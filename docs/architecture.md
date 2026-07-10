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

A selected workout from the current phase starts or resumes one active draft for the authenticated user within the current browser/device profile. The initial state machine is:

1. `not_started`: no active draft exists for the selected workout in the current browser/device profile.
2. `active`: a local draft exists, elapsed time is running, prescribed sets are visible, and edits are recoverable on the same browser/device profile.
3. `finishing`: the user has tapped Finish and is completing readiness, symptoms, notes, and final validation.
4. `saved`: all session, exercise-result, and set-result records commit durably in one server transaction; progression is evaluated only after that save succeeds.
5. `discarded`: the local active draft is explicitly removed after confirmation.

Pause is omitted initially. Elapsed time is measured from a persisted `started_at` plus optional accumulated offset reserved for future pause support. Refresh, same-device navigation away, and backgrounding must preserve elapsed-time continuity. Closing and reopening on the same browser/device profile should recover the draft if local storage is still available. Cross-device resume is deferred until a later explicitly scoped server-draft issue.

Initial active-draft scope is intentionally local-first: active workout drafts are scoped to the authenticated user plus the current browser/device profile, not globally unique across all devices. Only one active draft is allowed for that user within that browser/device profile. Starting a different workout on the same browser/device profile must either resume the existing local draft, discard it after confirmation, or finish it before starting another. Another browser/device may independently hold another local draft for the same authenticated user. Completed sessions remain server-backed and must never silently overwrite one another; concurrent completed saves must create distinct durable session records or fail with an explicit validation error. Cross-device active-draft discovery, uniqueness, resume, synchronization, and conflict resolution are deferred to a future explicitly scoped issue. User-facing copy must not imply that the active workout is synchronized across all devices.

Stale active drafts older than the configured stale threshold should be surfaced as recover-or-discard, not silently saved or silently deleted. Seven local days is the initial default product value for that threshold; it is configurable/product-adjustable and must not be treated as an irreversible architecture invariant.

### Exercise tracking registry

Tracking type and logging metadata must be explicit persisted metadata, never runtime exercise-name inference. The initial deterministic registry is bounded to:

- `weight_reps`: load plus reps per set; load units are `lb` or `kg`; summary may include completed sets, best load, total reps, and volume.
- `reps_only`: reps per set; summary may include completed sets and total reps.
- `duration`: duration per set or interval; duration stores seconds and displays as minute/second formatting.
- `distance_duration`: distance plus duration; distance units are `mi`, `km`, or `m`; duration stores seconds; summary may include total distance, total duration, and pace.
- `completion`: set or exercise completion without performance quantity; summary is completion count/status.

Canonical metadata ownership is:

- The current exercise catalog is the static TypeScript `exerciseCatalog` in `lib/exercise-library.ts`. It is not a Supabase table today, and its stable catalog-backed exercise IDs are strings such as `bodyweight-squat`.
- `ExerciseCatalogItem` owns default tracking metadata in code for catalog-backed exercises and should be extended with validated defaults for `tracking_type`, load-unit support/default, distance-unit support/default, primary and secondary display labels, and `unilateral_mode`. These are code-owned catalog defaults, not durable database catalog columns.
- Saved plan exercise entries snapshot the effective metadata used by that plan so plan history remains readable after code-owned catalog defaults change. Expected durable `exercise_entries` fields are `tracking_type`, `load_unit`, `distance_unit`, `primary_value_label`, `secondary_value_label`, `unilateral_mode`, the existing nullable text `source_exercise_id` for catalog-backed identity, and display-name/prescription text snapshots.
- The existing `exercise_entries.source_exercise_id` text field remains the stable identity for catalog-backed exercises. Issue #9 does not require a new Supabase exercise-catalog table, and it does not introduce a UUID catalog identity. Moving the catalog into Supabase would require a separate approved issue and migration.
- Plan exercise entries may override catalog defaults only through explicit validated fields in plan creation/editing. Overrides must remain within the registry above and within the catalog-supported unit set unless the exercise is custom.
- Session exercise results snapshot the effective metadata again for durable history: tracking type, units, display labels, unilateral mode, display name, the same stable text `source_exercise_id` when catalog-backed, source saved exercise-entry identity, prescription target text, and exercise order.
- Custom exercises must explicitly choose a `tracking_type` and `unilateral_mode` in plan creation/editing before they can use richer logging than `completion`; the flow may default them to `completion` only as a safe temporary choice that the user can review and change.
- Missing metadata uses `completion` only as a temporary safe fallback. It is not a substitute for classifying existing saved exercises.
- Existing saved exercises must be classified or initialized by an explicit migration/update strategy, not by silent name guessing at runtime. Acceptable strategies are a reviewed catalog mapping for catalog-backed rows, a conservative `completion` initialization for unknown/custom rows, and/or a user-visible edit flow for upgrading custom exercises.
- No runtime exercise-name inference, fuzzy matching, or label parsing is allowed for tracking type, units, or unilateral mode.

These metadata fields and the initialization/backfill strategy belong in Issue #10 unless repository inspection during that issue proves the combined migration is no longer reviewable. If Issue #10 cannot include them safely, it must stop and open a prerequisite metadata-foundation issue before creating set-result tables that depend on the fields.

Required metadata for each exercise-result snapshot: `tracking_type`, `load_unit`, `distance_unit`, `primary_value_label`, `secondary_value_label`, `unilateral_mode`, `prescribed_target_text`, nullable text `source_exercise_id` when catalog-backed, saved exercise-entry identity when present, exercise order, and safe fallback display values for custom exercises.

### Unilateral convention

Unilateral behavior must be explicit metadata, not inferred from instructional text such as “each side.” Initial allowed values are:

- `bilateral`: one actual value represents the set.
- `same_each_side`: one entered value applies independently to left and right sides; display labels must say “each side.”
- `independent_sides`: left and right actual values may differ and must be recorded separately.

Planned and actual set rows must snapshot the unilateral mode. Volume semantics are deterministic: bilateral counts once, same-each-side counts both sides when volume is shown, and independent-sides sums completed side values. The execution UI must label side-specific inputs clearly and history must preserve whether a value was per-side or bilateral.

### Set-result persistence model

Issue #10 should replace disposable execution/history data with a normalized completed-session model. Exact SQL names may be adjusted to repository conventions, but the relational contract must remain explicit enough that implementation does not invent product behavior while coding.

`workout_sessions` remains the durable session header for saved sessions and should be extended with lifecycle fields such as `started_at timestamptz not null`, `finished_at timestamptz not null`, `elapsed_seconds integer not null`, source workout/plan/phase IDs and display snapshots, check-in fields, notes, pain/readiness fields, and progression outputs. `elapsed_seconds` must be nonnegative, and `finished_at` must be greater than or equal to `started_at`.

`exercise_results` stores one row per exercise within a saved session. Recommended column-level shape:

- `id uuid primary key` and `workout_session_id uuid not null` referencing `workout_sessions` with cascading delete according to existing repo convention.
- `source_workout_template_id uuid null` for the originating workout template.
- `exercise_entry_id uuid null` for the source saved plan exercise entry when available.
- `source_exercise_id text null` for the stable text catalog/source identity when available, snapshotting the existing string identity from `exercise_entries.source_exercise_id`; do not add `catalog_exercise_id uuid` or a UUID `source_exercise_id` for Issue #10.
- `exercise_name text not null` or equivalent display-name snapshot.
- `exercise_order integer not null` with a nonnegative check.
- `tracking_type text not null` constrained to `weight_reps`, `reps_only`, `duration`, `distance_duration`, or `completion`.
- `unilateral_mode text not null` constrained to `bilateral`, `same_each_side`, or `independent_sides`.
- `load_unit text null` constrained to `lb` or `kg`; required only when `tracking_type = 'weight_reps'`.
- `distance_unit text null` constrained to `mi`, `km`, or `m`; required only when `tracking_type = 'distance_duration'`.
- `primary_value_label text null` and `secondary_value_label text null` as display-label snapshots.
- `prescribed_target_text text null` for the human-readable prescription snapshot from the plan.
- `completion_status text not null` constrained to `completed`, `partial`, `skipped`, or `incomplete`; exact labels may align with repo conventions, but the contract must distinguish complete, partial, skipped, and incomplete exercise outcomes.
- `notes text null`.
- `created_at timestamptz not null` and `updated_at timestamptz not null` if required by repo convention.

`exercise_set_results` stores one row per planned or added set. Recommended column-level shape:

- `id uuid primary key`.
- `exercise_result_id uuid not null` referencing `exercise_results`.
- `set_order integer not null` with a nonnegative check and a unique constraint on `(exercise_result_id, set_order)`.
- `prescribed_set_index integer null` with a nonnegative check. Current prescribed sets may not have durable row IDs, so Issue #10 should snapshot the prescribed set index/order instead of implying a source prescribed-set identity. Added sets use `null`.
- `set_kind text not null` constrained to `prescribed` or `added`.
- `status text not null` constrained to `completed`, `skipped`, or `incomplete`.
- Prescribed scalar snapshots: `prescribed_load numeric(8,2) null`, `prescribed_reps integer null`, `prescribed_duration_seconds integer null`, and `prescribed_distance numeric(10,3) null`.
- Actual scalar values: `actual_load numeric(8,2) null`, `actual_reps integer null`, `actual_duration_seconds integer null`, and `actual_distance numeric(10,3) null`.
- Independent-side values only if independent-side storage is approved in Issue #10: `actual_left_load numeric(8,2) null`, `actual_left_reps integer null`, `actual_left_duration_seconds integer null`, `actual_left_distance numeric(10,3) null`, `actual_right_load numeric(8,2) null`, `actual_right_reps integer null`, `actual_right_duration_seconds integer null`, and `actual_right_distance numeric(10,3) null`. If this makes Issue #10 unreasonably broad, Issue #10 should ship `same_each_side` support and explicitly defer `independent_sides` rows rather than inventing a parallel shape.
- `completed_at timestamptz null`.
- `created_at timestamptz not null` and `updated_at timestamptz not null` if required by repo convention.

Unit normalization rules:

- Store load in the `exercise_results.load_unit` selected for that exercise result; do not mix `lb` and `kg` within one exercise result.
- Store distance in the `exercise_results.distance_unit` selected for that exercise result; do not mix `mi`, `km`, and `m` within one exercise result.
- Store durations as integer seconds.
- Convert only at validated user-entry boundaries; history displays must use the snapshotted unit instead of current profile preferences when showing stored values.

Nullability and value checks:

- All numeric and integer metric columns must be nonnegative when present.
- `actual_reps`, `prescribed_reps`, `actual_duration_seconds`, and `prescribed_duration_seconds` are integers.
- `completed_at` is required when `status = 'completed'` and must be null when `status` is `skipped` or `incomplete`, unless a future issue explicitly adds audit semantics for skip timestamps.
- `skipped` and `incomplete` set rows must not require actual performance values. They may retain prescribed snapshots.
- `completed` rows must satisfy the fields required by their tracking type and unilateral mode.
- For `weight_reps`, completed bilateral or same-each-side rows require `actual_load` and `actual_reps`; independent-sides rows require approved left/right load and reps fields.
- For `reps_only`, completed bilateral or same-each-side rows require `actual_reps`; independent-sides rows require approved left/right reps fields.
- For `duration`, completed bilateral or same-each-side rows require `actual_duration_seconds`; independent-sides rows require approved left/right duration fields.
- For `distance_duration`, completed bilateral or same-each-side rows require `actual_distance` and `actual_duration_seconds`; independent-sides rows require approved left/right distance and duration fields.
- For `completion`, completed rows require no metric values.
- `same_each_side` stores one actual value plus unilateral metadata; history/volume calculations know that value applies to each side. `independent_sides` stores explicit left/right values and must not be approximated from a single value.

Scalar columns are preferred for all initially supported metrics. Bounded JSON is allowed only for a narrowly documented future-proof metadata purpose such as preserving a validated raw source payload or display-only import note; JSON must not be the canonical storage for load, reps, duration, distance, status, order, units, source identities, or unilateral side values in Issue #10.

Prescribed sets remain visible and may be marked skipped or incomplete; they are not silently deleted. Added sets are session-only additions and must not rewrite the plan. Reorder, add/remove exercise, and substitution should be represented by extension columns or later child tables without requiring a parallel session system. Actual performance values never automatically mutate `exercise_entries`; a later issue may offer an explicit “update planned workout” prompt for meaningful structural changes.

The save boundary should be one server transaction or RPC that writes the session header, exercise rows, and set rows atomically. If any child insert fails, no partial session should remain. RLS must continue to anchor ownership on `workout_sessions.user_id`; exercise and set rows must be readable/writable only when their parent session belongs to `auth.uid()`.

### Execution/history reset and rollout

Existing `workout_sessions` and `exercise_results` records are disposable test execution/history data for this overhaul. Issue #10 may reset those records with committed SQL in a timestamped migration. Preserve `profiles`, `workout_plans`, `plan_phases`, `workout_templates`, `exercise_entries`, setup context, guidance fields, current phase pointers, and auth users unless a later approved migration explicitly scopes otherwise.

The approved database rollout sequence for Issue #10 is:

1. Commit timestamped Supabase migration SQL that resets only disposable execution/history rows, replaces or extends execution tables, creates `exercise_set_results`, initializes required tracking metadata fields, adds constraints/indexes/RLS, and documents the exact reset scope in the migration or PR handoff.
2. Synchronize `supabase/schema.sql` to the same canonical end state in the same PR.
3. Regenerate database types in the repository after the migration shape is committed.
4. Update read/write code behind feature-compatible route changes in the same PR or in an immediately following PR that is ordered before deployment to shared preview.
5. Apply schema before app code that writes the new model; do not merge or deploy app code that depends on missing schema.
6. Include verification SQL for reset row counts, table/column/constraint/index existence, RLS policy presence, and authenticated smoke insert/select behavior where practical.
7. Run the Vercel preview QA checklist against a reset test environment before promoting.

`supabase/schema.sql` remains canonical alongside timestamped migrations: migrations describe apply order, while `schema.sql` must reflect the expected full database state after all migrations. Do not leave hosted database actions as “apply manually in Supabase” without committed repository SQL. Issue #10 must not delete auth users, profiles, workout plans, plan phases, workout templates, or exercise entries without separate approval.

Compatibility expectation: old app against new schema is not required after the reset migration because execution/history data is disposable and the deployment must pair schema and app changes. New app against old schema is also not supported for set-level execution. The PR sequence must therefore call out deployment ordering and avoid merging app code that writes the new model before the migration PR is applied to the target environment.

Required indexes for the new model: user/session chronology on `workout_sessions`, active/stale draft lookup if server drafts are introduced later, workout-template/session chronology, exercise identity history lookup across saved exercise-entry ID and stable text source exercise ID, exercise-result parent/order lookup, and set-result parent/order lookup.

### In-progress draft recovery

Initial draft persistence is local-first. Store active workout draft state on the same device with a versioned key that includes user ID and workout template ID. It must include started-at timestamp, last-updated timestamp, selected workout identity, set rows, input values, completion statuses, notes, and scroll/rest-timer state when practical. Refresh and temporary navigation must restore the draft without losing scroll context. Discard requires confirmation. Offline save is not required initially; failed save should keep the local draft and present retry/discard options. Cross-device resume is deferred.

### Prior-performance selection

Prior values must be selected deterministically with this precedence:

1. same workout template and same saved exercise-entry identity;
2. same stable saved exercise-entry identity after plan edits when that identity is preserved;
3. same stable text catalog/source exercise identity within the authenticated user’s history;
4. no previous value.

For a session-time replacement, prior values follow the performed replacement exercise’s stable text catalog/source identity. If that replacement identity has no matching history, show no previous value. Never borrow prior values from an unrelated exercise based only on tracking type, unit, plan membership, or compatible metric shape. Fuzzy exercise-name matching is not allowed. Custom exercises without stable identity use only exact saved entry identity; if that identity is gone, show no prior value rather than guessing.

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
## Durable Workout Execution Schema (Issue #10)

Issue #10 implements the Issue #9 contract as committed Supabase SQL without applying it to hosted Supabase from Codex Web. The migration `supabase/migrations/20260710120000_workout_execution_set_results.sql` resets disposable execution/history data by deleting only `exercise_results` and `workout_sessions` rows before recreating the set-result foundation. It preserves `auth.users`, `profiles`, `workout_plans`, `plan_phases`, `workout_templates`, `exercise_entries`, setup context, guidance fields, and current phase pointers.

The durable model keeps `workout_sessions` as the saved session header and adds server-readable lifecycle fields: source plan/phase snapshots, `started_at`, `finished_at`, nonnegative `elapsed_seconds`, and `elapsed_source`. `exercise_results` now stores one ordered exercise result per saved session with source workout template identity, source saved exercise-entry identity, stable catalog/source exercise identity, display-name and prescription snapshots, effective `tracking_type`, `unilateral_mode`, unit/display-label snapshots, completion status, and notes. `exercise_set_results` stores one ordered row per prescribed or added visible set with `prescribed_set_index`, set kind, status, prescribed scalar fields, actual scalar fields, independent left/right scalar fields, and completion timestamp constraints.

Tracking metadata ownership follows the Issue #9 contract: the TypeScript catalog owns code defaults, saved `exercise_entries` snapshot the effective plan metadata, and `exercise_results` snapshot it again for history. The Issue #10 migration initializes known catalog-backed saved entries by reviewed stable `source_exercise_id` lists; unknown/custom entries remain on the temporary `completion` fallback until an edit flow upgrades them. Runtime exercise-name inference is not allowed.

RLS remains anchored to `workout_sessions.user_id`. Session rows are private to their owner; exercise-result rows inherit ownership through their parent session; set-result rows inherit ownership through exercise result -> session. Indexes support session chronology, workout-template chronology, exercise-order lookup, set-order lookup, and prior-performance lookup by saved exercise-entry identity before stable catalog/source identity.

Schema/app compatibility is intentionally paired for this reset: old app code is not supported after the new schema reset, and new app code is not supported against the old schema for set-level execution. Apply committed Supabase migrations to the target environment before deploying app code that writes `exercise_set_results`; do not use undocumented manual SQL. Read-only verification SQL lives in `supabase/verification/issue-10-workout-execution-readonly.sql`.

### Issue #10 PR #25 patch clarifications

The transitional checklist compatibility layer is intentionally conservative. A checked exercise still updates `exercise_results.completion_status`, but prescribed set rows for `weight_reps`, `reps_only`, `duration`, and `distance_duration` remain `incomplete` with `completed_at = null` until an active set-entry UI supplies actual metrics. `completion` tracking is the only tracking type where a checked checklist exercise can mark prescribed set rows completed without numeric actual values.

The runtime source of catalog-backed tracking defaults is the static TypeScript exercise catalog. Plan creation and structured plan updates snapshot the effective tracking metadata onto `exercise_entries`; session finalization snapshots the saved plan metadata onto `exercise_results`. Unknown source IDs and custom exercises use the explicit `completion` fallback rather than name inference or fuzzy matching.

Final workout persistence is transaction-scoped through `public.finalize_workout_session(jsonb, jsonb, jsonb)`. The function derives the user from `auth.uid()`, validates workout ownership through the plan hierarchy, inserts the session/exercise/set rows atomically, uses a fixed `search_path`, and grants execution only to authenticated users. Progression evaluation remains an application-layer follow-up that runs only after the RPC succeeds.
