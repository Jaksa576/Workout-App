# Architecture

This app is a mobile-first adaptive training planner built with Next.js, Supabase, and Vercel.

For product truth, read `docs/product.md`. This document owns technical architecture and durable workflow conventions.

## App Platform

- Next.js App Router powers pages and API routes under `app/`.
- Supabase provides email authentication, Postgres storage, and row-level security.
- Vercel deploys the app from GitHub.
- Protected routes use `proxy.ts` plus server-side auth helpers.
- Data loading lives mostly in `lib/data.ts`.
- Writes generally flow through API route handlers, validation helpers, and the authenticated Supabase server client.

## Public And Authenticated Route Boundary

Current route boundary:

- `/` is the public landing page.
- `/dashboard` is the authenticated dashboard.
- `/plans`, `/plans/new`, `/plans/[planId]`, `/workout`, and `/settings` are authenticated app routes.

Boundary rules:

- Public landing components must not depend on Supabase-authenticated user records.
- Public previews should use static or deterministic marketing mock data.
- Protected routes should continue to rely on existing auth helpers and `proxy.ts`.
- Shared route classification lives in `lib/app-route-boundary.ts`.
- Authenticated shell visibility is route-aware inside `AppShell`.

## Data Model

The core database/app model is:

1. `profiles`
2. `workout_plans`
3. `plan_phases`
4. `workout_templates`
5. `exercise_entries`
6. `workout_sessions`
7. `exercise_results`

Compatibility names such as `plan_phases` remain intentionally unchanged unless a migration-safe rename is explicitly approved.

## Plan And Session Architecture

- `workout_plans` is the top-level plan/program structure.
- `plan_phases` stores progressive training phases.
- `workout_templates` stores planned workouts within phases.
- `exercise_entries` stores prescribed exercises.
- Optional reviewed exercise guidance is stored migration-free in existing exercise fields: labeled text guidance in `exercise_entries.coaching_note` and reviewed YouTube demo links in `exercise_entries.video_url`.
- `workout_sessions` and `exercise_results` store completed workout history and progression signals.
- Session history should remain readable after plan edits through workout/exercise snapshots.
- Issue #6 owns migration-safe extension of the workout/session/result model for set-level recording; the approved Issue #9 discovery contract below governs the initial child implementation issues.


## Workout Execution Domain Contract (Issue #9 Discovery)

Issue #9 selects the initial workout execution contract for Issue #6 follow-up work. This contract is documentation-only and does not change production behavior until the child implementation issues add committed migrations, generated types, routes, UI, and tests.

### Repository evidence inspected

Current execution starts at `/workout`, which loads `getWorkoutPageData()` and renders the client `WorkoutFlow`. The client experience is a checklist-based flow backed by `WorkoutChecklist`, a session-level readiness form, `sessionStorage` recovery for checked exercise IDs, and a save call to `POST /api/sessions`. `TimerCard` is reusable as a simple client timer primitive, but it is not yet part of durable session elapsed-time persistence.

Current persistence is session-level plus exercise-level only:

- `workout_sessions` stores one completed session row with `user_id`, nullable `workout_template_id`, workout and phase snapshots, completion date, completion boolean, pain flag, perceived difficulty, notes, recommendation, progression decision/reason, and `created_at`.
- `exercise_results` stores one row per prescribed exercise with nullable `exercise_entry_id`, exercise-name snapshot, completed boolean, optional unstructured actual fields, and pain flag.
- RLS keeps workout sessions private to `user_id`; exercise results inherit ownership through their parent session.
- Existing indexes cover user completion chronology and workout-template completion chronology.
- `POST /api/sessions` inserts the session, inserts exercise-result rows, deletes the just-created session if exercise-result insert fails, then evaluates deterministic progression from session-level fields.
- `lib/data.ts`, `lib/dashboard.ts`, and progression helpers read `workout_sessions`; current dashboard/progression behavior does not depend on set-level actual values.
- `lib/plan-write.ts` snapshots workout and exercise names before replacing plan structure so edited plans do not make existing history unreadable.

### Approved active-session lifecycle

A selected workout from the current phase starts or resumes a single active session for that user and workout. The initial state machine is:

1. `not_started`: no active draft exists for the selected workout.
2. `active`: a draft exists, elapsed time is running, prescribed sets are visible, and edits are recoverable.
3. `finishing`: the user has tapped Finish and is completing readiness, symptoms, notes, and final validation.
4. `saved`: all session, exercise-result, and set-result records commit durably in one server transaction; progression is evaluated only after that save succeeds.
5. `discarded`: the active draft is explicitly removed after confirmation.

Pause is omitted initially. Elapsed time is measured from a persisted `started_at` plus optional accumulated offset reserved for future pause support. Refresh, same-device navigation away, and backgrounding must preserve elapsed-time continuity. Closing and reopening on the same device should recover the draft if local storage is still available. Cross-device resume is deferred until a later server-draft issue.

Only one active workout draft per user is supported initially. Starting a different workout must either resume the existing active draft, discard it after confirmation, or finish it before starting another. Stale active drafts older than seven local days should be surfaced as recover-or-discard, not silently saved or silently deleted.

### Exercise tracking registry

Tracking type must be explicit metadata from the exercise catalog or saved exercise entry snapshot. Runtime name-based inference is not allowed. The initial deterministic registry is bounded to:

- `weight_reps`: load plus reps per set; units are `lb` or `kg`; summary may include completed sets, best load, total reps, and volume.
- `reps_only`: reps per set; summary may include completed sets and total reps.
- `duration`: duration per set or interval; units are seconds for storage and minute/second formatting for display.
- `distance_duration`: distance plus duration; distance units are `mi`, `km`, or `m`; duration stores seconds; summary may include total distance, total duration, and pace.
- `completion`: set or exercise completion without performance quantity; summary is completion count/status.

Required metadata for each exercise-result snapshot: tracking type, supported units, display labels, prescribed target text, source exercise identity when present, saved exercise-entry identity when present, and safe fallback display values for custom exercises. If catalog metadata is missing, the fallback tracking type is `completion` until the user or plan-edit flow explicitly chooses richer tracking.

### Unilateral convention

Unilateral behavior must be explicit metadata, not inferred from instructional text such as “each side.” Initial allowed values are:

- `bilateral`: one actual value represents the set.
- `same_each_side`: one entered value applies independently to left and right sides; display labels must say “each side.”
- `independent_sides`: left and right actual values may differ and must be recorded separately.

Planned and actual set rows must snapshot the unilateral mode. Volume semantics are deterministic: bilateral counts once, same-each-side counts both sides when volume is shown, and independent-sides sums completed side values. The execution UI must label side-specific inputs clearly and history must preserve whether a value was per-side or bilateral.

### Set-result persistence model

Issue #10 should replace disposable execution/history data with a normalized completed-session model:

- `workout_sessions`: durable session header for saved sessions, extended with lifecycle timestamps such as `started_at`, `finished_at`, elapsed seconds, source workout/plan/phase snapshots, check-in fields, and progression outputs.
- `exercise_results`: one row per exercise within a saved session, including workout-session ID, source workout-template ID, source exercise-entry ID, catalog/source exercise ID, exercise display snapshot, tracking type, unit snapshot, unilateral mode, prescription snapshot, exercise order, completion status, and exercise-session notes.
- `exercise_set_results`: one row per planned or added set, including exercise-result ID, set order, source prescribed-set identity when available, set kind (`prescribed` or `added`), status (`completed`, `skipped`, or `incomplete`), prescribed value snapshot, actual value fields appropriate to the tracking type, side values when needed, completed timestamp, and validation-safe metadata.

Prescribed sets remain visible and may be marked skipped or incomplete; they are not silently deleted. Added sets are session-only additions and must not rewrite the plan. Reorder, add/remove exercise, and substitution should be represented by extension columns or later child tables without requiring a parallel session system. Actual performance values never automatically mutate `exercise_entries`; a later issue may offer an explicit “update planned workout” prompt for meaningful structural changes.

The save boundary should be one server transaction or RPC that writes the session header, exercise rows, and set rows atomically. If any child insert fails, no partial session should remain. RLS must continue to anchor ownership on `workout_sessions.user_id`; exercise and set rows must be readable/writable only when their parent session belongs to `auth.uid()`.

### Execution/history reset and rollout

Existing `workout_sessions` and `exercise_results` records are disposable test execution/history data for this overhaul. Issue #10 may reset those records with committed SQL in a timestamped migration. Preserve `profiles`, `workout_plans`, `plan_phases`, `workout_templates`, `exercise_entries`, setup context, guidance fields, current phase pointers, and auth users unless a later approved migration explicitly scopes otherwise.

The approved database rollout sequence is:

1. Commit a timestamped Supabase migration that deletes disposable execution/history rows, replaces or extends execution tables, creates `exercise_set_results`, adds constraints/indexes/RLS, and updates `supabase/schema.sql` to the same canonical end state.
2. Regenerate database types in the repository after the migration shape is committed.
3. Update read/write code behind feature-compatible route changes in the same PR or in an immediately following PR that is ordered before deployment to shared preview.
4. Run preview QA flows against a reset test environment before promoting.

`supabase/schema.sql` remains canonical alongside timestamped migrations: migrations describe apply order, while `schema.sql` must reflect the expected full database state after all migrations. Do not leave hosted database actions as “apply manually in Supabase” without committed repository SQL.

Compatibility expectation: old app against new schema is not required after the reset migration because execution/history data is disposable and the deployment must pair schema and app changes. New app against old schema is also not supported for set-level execution. The PR sequence must therefore call out deployment ordering and avoid merging app code that writes the new model before the migration PR is applied to the target environment.

Required indexes for the new model: user/session chronology on `workout_sessions`, active/stale draft lookup if server drafts are introduced later, workout-template/session chronology, exercise identity history lookup across saved exercise-entry ID and catalog/source exercise ID, exercise-result parent/order lookup, and set-result parent/order lookup.

### In-progress draft recovery

Initial draft persistence is local-first. Store active workout draft state on the same device with a versioned key that includes user ID and workout template ID. It must include started-at timestamp, last-updated timestamp, selected workout identity, set rows, input values, completion statuses, notes, and scroll/rest-timer state when practical. Refresh and temporary navigation must restore the draft without losing scroll context. Discard requires confirmation. Offline save is not required initially; failed save should keep the local draft and present retry/discard options. Cross-device resume is deferred.

### Prior-performance selection

Prior values must be selected deterministically with this precedence:

1. same workout template and same exercise-entry ID,
2. same saved exercise-entry ID after plan edits when snapshot identity is preserved,
3. same catalog/source exercise ID within the same user history,
4. same plan and compatible tracking type/unit when the exercise was intentionally replaced,
5. no prior value.

Fuzzy exercise-name matching is not allowed. Custom exercises without stable identity use only exact saved entry identity; if that identity is gone, show no prior value rather than guessing.

### Mobile information architecture

The approved mobile execution IA is one compact vertically scrolling active-workout page. It keeps the app’s current visual system and primitives rather than copying another app’s branding or trade dress. The sticky active header shows workout name, elapsed time, completed sets, applicable totals, timer access, Finish, and discard/overflow behavior. Exercise sections display title/media affordance, planned context, previous value, inline set rows, add-set action where supported, notes, and compact validation. Tapping exercise title/media opens a secondary Summary / History / How-to surface and returns to the active page without draft or scroll-context loss. Finish leads to the existing readiness/symptom/check-in boundary before durable save.

### Progression boundary

Current deterministic progression remains unchanged until an explicitly scoped issue changes it. The migrated save path must continue to provide completed session, pain flag, perceived difficulty, completion date, phase-at-completion, recommendation, progression decision, and progression reason. Rich set aggregates such as volume, best set, total duration, distance, skipped-set counts, or unilateral side totals are informational at first. Progression runs only after the durable transaction succeeds and must not read unsaved local drafts.

### Supabase change handoff template for later PRs

Later Supabase-affecting PRs under Issue #6 should include a copyable handoff section with:

- migration files: exact timestamped migration paths and whether `supabase/schema.sql` changed;
- objects affected: tables, columns, constraints, indexes, RLS policies, functions/RPCs, generated types, API routes, and tests;
- data impact: execution/history tables reset, preserved plan/auth/profile tables, and whether any data is backfilled;
- apply order: migration, generated types, app code, preview deployment, QA, and production promotion order;
- verification SQL: row counts for reset tables, constraint/index existence checks, RLS policy checks, and smoke inserts/selects scoped to an authenticated test user where practical;
- recovery path: rollback or restore approach for disposable execution/history data and how to re-run the migration in preview;
- deployment compatibility: old-app/new-schema and new-app/old-schema expectations;
- target environment action: which hosted environment receives the migration and who verifies it;
- preview QA: start recommended workout, choose alternate current-phase workout, log each tracking type, skip/incomplete/add sets, discard draft, refresh recovery, finish/save, dashboard readiness, history display, and progression recommendation smoke checks.


## Plan Creation And Editing

- Guided plan creation, manual plan creation, and external AI draft import converge on review/edit before save.
- Plan creation should save through `createStructuredPlanForUser` in `lib/plan-write.ts`.
- Saved-plan detail edits and setup/regenerate edits save through `updateStructuredPlanForUser` in `lib/plan-write.ts`.
- The update path snapshots current workout and exercise names before replacing live plan structure.
- Guided setup answers can persist on `workout_plans.setup_context`.
- Older plans without setup context can be reopened with safely reconstructed fields and explicit missing-context guidance.

## Progression Architecture

- Progression remains server-side and deterministic.
- Progression prompts should derive from active plan, active phase, recent sessions, completion, pain flags, effort, and phase snapshots.
- Dashboard progression messaging should use existing progression helpers rather than creating dashboard-only readiness inference.
- User-confirmed progression actions should remain explicit.
- Set-level recording may provide richer future inputs, but Issue #6 must not silently alter progression rules. Any new progression signal requires an explicit issue, tests, and product approval.

## Plan Drafting And AI Boundary

- Plan drafts should flow through `lib/plan-drafting/plan-draft-provider.ts`.
- The enabled in-app draft path is template-based.
- Manual Builder remains available.
- External AI draft import is provider-free and does not make server-side model calls.
- Imported AI output must be validated and converted into the same review/edit/save flow before persistence.
- AI-imported exercise guidance and demo links are optional metadata. They must be normalized, reviewed, and saved through the structured plan flow rather than bypassing validation.
- Optional provider-backed plan drafting is queued in GitHub Issue #8.
- Direct AI generation must remain feature-gated and unavailable when server config or quota does not allow it; Guided Setup, Manual Builder, and external AI import must continue to work.
- Provider adapters should live behind the plan-drafting boundary rather than in UI components, and provider keys/details must remain server-only.
- Model output must be parsed, normalized, and strictly validated before it can enter app state.
- Direct AI generation must not write plan tables until a user reviews and saves through the structured plan write path.
- AI-assisted active-plan mutation, phase alternatives, and automatic next-phase replacement remain deferred.
- Issue #8 must be reconciled with the exercise tracking and prescription contract approved through Issue #6 before implementation resumes.

## UI And Theme Architecture

- Theme styling should prefer semantic tokens and shared primitives over hardcoded page-specific colors.
- Light/dark mode flows through `html[data-theme]` with system preference by default.
- The user-facing theme preference control lives in Settings.
- The theme preference remains a local client-side override rather than a profile-backed setting.
- User-facing “today” behavior uses the browser-detected IANA timezone when available.
- Authenticated routes persist that timezone in the `workout-app-time-zone` cookie and localStorage key so server-rendered data and client-side date inputs share the same local-date basis.
- Public landing and authenticated app surfaces should stay aligned through shared foundations where practical.
- App icon and PWA surfaces use the approved generated assets in `public/` and `app/favicon.ico`.

## Issue-Driven Delivery Workflow

GitHub issues own active implementation scope and sequencing.

- Large umbrella issues should be decomposed into independently reviewable child issues.
- Pull requests should reference the issue they implement.
- `docs/current-task.md` identifies the current priority and immediate next issue.
- `docs/product.md`, `docs/architecture.md`, and `docs/roadmap.md` should only be updated when durable truth or sequencing changes.
- `docs/campaigns/` is deprecated and reference-only. Do not create new campaign documents.
- Historical campaign files may remain temporarily for archaeology, but they are not active instructions.

Codex final reports should include the issue number, branch, commit SHA, pushed remote branch, validation results, documentation delta, compact state packet, and branch-push verification result.

The state packet is a transition note, not a source of truth.

## Local Development Workflow

Standard local environment:

- Windows native
- PowerShell
- repository: `C:\Code\Workout-App`
- Codex app running as a Windows-native agent
- VS Code in standard Windows mode, not Remote-WSL
- Codex worktrees under `C:\Users\<user>\.codex\worktrees\...`

WSL-based workflows were previously tested but caused instability with Codex worktrees. Do not assume WSL or bash unless explicitly requested.

Worktrees do not include `.env.local` automatically. The local setup script copies `.env.local` from `C:\Code\Workout-App\.env.local`, validates required public Supabase variables, and runs `npm install`.

## Validation Expectations

For code changes, use the standard validation gate:

- `npm run check`

The wrapper runs:

- `npm run typecheck`
- `npm run test`
- `npm run build`

Known lint issue:

- `npm run lint` currently fails because the Next 16 setup interprets `next lint` as a project directory named `lint`.

For docs-only changes, run `git status` and `git diff --stat`, confirm the diff is docs-only, and do not run app build/test unless non-doc files are touched accidentally.