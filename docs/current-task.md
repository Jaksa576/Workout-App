# Current Task

## Current Priority

GitHub Issue #6 — **Umbrella: Overhaul workout execution and exercise recording** — remains the top product and development priority.

Issue #9 — **Discovery: Define workout execution and set-result domain contract** — has produced the docs-first domain contract in `docs/architecture.md`. No production workout behavior, schema, or API behavior changed in that discovery step.

## Why This Was Reprioritized

The previous direct AI-guided plan creation work completed only its docs/planning step. Provider-backed implementation has not started.

Workout execution and set-result changes may affect:

- exercise tracking metadata
- prescription snapshots
- supported units and tracking types
- unilateral conventions
- workout/session persistence
- history queries
- deterministic progression inputs
- the structured exercise output expected from future AI-generated plans

For that reason, Issue #6 should establish the durable workout/exercise recording contract before direct AI-generated plan implementation proceeds.

## Immediate Next Action

Implement the next child issue under #6:

**Issue #10 — Set-result data foundation and execution/history reset**

Implementation has been prepared in-repo with committed migration SQL, schema snapshot updates, app write-path adaptation, verification SQL, and architecture documentation. Hosted Supabase migration application remains intentionally pending product-owner/ChatGPT authorization.

This next step should implement the approved Supabase data foundation from the Issue #9 domain contract before broad active-workout UI work begins. It must:

- commit timestamped Supabase migration SQL for resetting disposable `workout_sessions` and `exercise_results` data and creating the durable session/exercise/set-result model
- keep `supabase/schema.sql` canonical with the timestamped migrations
- update generated database types in-repo
- preserve auth users, profiles, plans, phases, workout templates, exercise entries, setup context, guidance, and current phase pointers; do not delete them without separate approval
- initialize durable tracking metadata fields for catalog-backed and existing saved exercise entries, or stop for a prerequisite metadata issue if repository inspection proves that scope is too broad
- define RLS ownership through `workout_sessions.user_id` for session, exercise-result, and set-result rows
- add required parent/order/history indexes and a transaction or RPC save boundary
- document the exact execution/history reset scope and app/schema deployment ordering
- include verification SQL for reset row counts, schema objects, constraints/indexes, RLS policies, and authenticated smoke behavior where practical
- include a Vercel preview QA checklist covering start, draft recover/discard, supported tracking types, skip/incomplete/add set behavior, finish/save, dashboard/history, and progression smoke checks
- avoid undocumented hosted manual SQL; all schema-affecting changes must be committed in repository SQL
- update API/data access only as needed for the new schema foundation while avoiding a broad UI rewrite
- include the Supabase change handoff section required by the Issue #9 contract

Do not start the broad active-workout UI replacement until #10 lands and the preview migration/QA path is verified.

## Queued Work

GitHub Issue #8 — **Feature: Direct AI-guided plan creation** — replaces the former active campaign document and is queued behind the foundational decisions from #6.

Reassess #8 after the first #6 discovery/domain issue is approved. It remains important, but its exercise-output contract should align with the new recording model.


## PR Follow-up — Set-aware Finish Recap

Implementing the PR #47 follow-up request for the set-aware Finish recap on top of the Issue #13-#15 execution rows and existing atomic final-save path. The Finish action now captures a client-side elapsed-time snapshot, clears active rest state, scrolls the terminal review view to the top, and opens a clean review-and-save flow with the active-workout sticky header hidden. Back to workout reconstructs the active timer baseline from that frozen duration so time spent reviewing Finish is excluded while preserving the draft's set rows, exercise notes, check-in fields, and workout notes.

This patch intentionally does not change the draft lifecycle storage shape, `POST /api/sessions`, `finalize_workout_session`, retry/idempotency behavior, progression-after-save ordering, or any database schema. Submitting Finish continues to send the existing required `completed` payload field as a deterministic completed-session value while partial set rows remain valid and truthfully represent incomplete work. The Finish form no longer includes an incomplete-work notice or a completion question; its action hierarchy is Save workout, Back to workout, then a subordinate guarded Discard workout action using the existing discard confirmation lifecycle.

Recap formulas are derived from completed active-draft set rows. Load volume now uses one shared helper for workout-level and exercise-level totals: bilateral rows use `load × reps`, same-each-side rows count both sides for aggregate totals, and independent-side rows sum each side independently (`left load × left reps + right load × right reps`) without combining missing values across sides. Same-each-side per-exercise labels preserve the entered per-side amount such as `8 reps/side`, while workout aggregate totals may count both sides such as `16` total reps. Incompatible metric types are not collapsed into a synthetic score.

Validation focus: complete and partial finish recaps, mixed tracking types, same-each-side labels versus aggregate totals, independent-side volume, Back preserving draft data and excluding Finish-review time, duplicate-save disabled state, retry after failure with frozen elapsed seconds, rest-timer cleanup at Finish, top positioning, hidden active header on Finish, and guarded bottom Discard workout behavior.


## PR Follow-up — Issue #17A compatibility and aggregation

Implementing the PR follow-up request to treat dashboard/history/progression compatibility as the correctness/data-layer step before progress-trends Issue #36. This patch adds shared session and exercise metric derivation over the durable `workout_sessions` -> `exercise_results` -> `exercise_set_results` model, including Completed/Partial status, elapsed seconds, set and exercise completion counts, load volume, total reps, work duration, distance, units, unilateral semantics, concise summaries, and ordered trend-series objects for future chart consumers.

The dashboard now reads the shared saved-session metrics for compact recent activity rows instead of asking users to infer raw set data. Progression policy is unchanged: existing `completed`, pain, perceived-difficulty, phase, and recommendation fields remain the deterministic progression inputs, while richer set metrics are informational and prepared for #36. No schema, RLS, final-save, active-draft, or hosted Supabase behavior changed in this follow-up.

## Workflow Source Of Truth

Active work is issue-driven:

- `AGENTS.md`
- `docs/product.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/current-task.md`
- GitHub Issue #6 and its active child issue

`docs/campaigns/` is deprecated and reference-only. Do not create or update campaign documents.

## Validation Expectations

For code changes, use:

```powershell
npm run check
```

Before a final report from a local worktree, also run:

```powershell
.\scripts\verify-branch-pushed.ps1
```

For docs-only changes, run `git status` and `git diff --stat`, confirm the diff is docs-only, and do not run app build/test unless non-doc files are touched accidentally.

## Stop Conditions

Stop and report before implementation if:

- the database schema or RLS differs from the assumptions in Issue #6
- current code and docs disagree about session/result persistence
- the first child issue requires committing to a schema before the domain contract is approved
- implementation would create a parallel session system rather than migration-safely extending the existing one
- progression behavior would change without an explicitly scoped and reviewed issue
- branch state, push state, or target issue becomes ambiguous

## PR #25 Review Patch State (Issue #10)

The PR #25 follow-up patch addresses the review blockers without broadening into the full active-workout UI. The current checklist remains exercise-level: checked metric-tracking exercises save completed `exercise_results` but create incomplete prescribed set rows because the checklist does not capture actual metrics. Completion-only checked exercises may create completed prescribed set rows.

The static TypeScript exercise catalog is now the runtime source of default tracking metadata, and plan create/update paths snapshot effective metadata to `exercise_entries`. Final session persistence now goes through the `finalize_workout_session` RPC so the session header, exercise results, and set results are inserted in one database transaction before progression evaluation runs.

### PR #25 remaining review-blocker patch

The follow-up patch hardens the `finalize_workout_session` SECURITY DEFINER RPC so `auth.uid()` remains authoritative and caller-supplied child JSON cannot attach set rows to foreign or pre-existing exercise results. The RPC now rejects duplicate exercise-result IDs, duplicate exercise-entry IDs, exercise entries outside the selected workout template, mismatched `source_workout_template_id` values, and set rows that do not reference exercise results inserted by the same finalize call.

The Issue #10 migration backfill now matches the static TypeScript catalog contract: only explicit reviewed catalog IDs receive `weight_reps`, `reps_only`, `duration`, or `distance_duration`; null, blank, stale, custom, or unrecognized source IDs remain `completion` with bilateral mode and no units. The transactional QA SQL is now an executable rollback script that proves successful finalize, late child rollback, foreign exercise-entry rejection, foreign/pre-existing set-parent rejection, and absence of orphan rows.

### PR #25 final trust patch

The latest Issue #10 patch corrects the transactional QA rejection pattern so each negative case catches only the RPC call, records `was_rejected`, fails if the RPC unexpectedly succeeds, and then separately verifies no session/exercise/set rows remain. The finalize RPC now derives authoritative session and exercise snapshots from `workout_templates`, `plan_phases`, `workout_plans`, and `exercise_entries` instead of trusting caller-supplied metadata for source exercise identity, exercise name/order, tracking type, unilateral mode, units, labels, prescription text, workout name, or phase identity.

## PR Follow-up — Active Session Lifecycle

Implementing the PR follow-up request for the active-workout lifecycle issue on top of Issue #10. Issue #10's committed final-save path remains the approved persistence boundary: in-progress execution is local-first, and completion continues through `POST /api/sessions` and the `finalize_workout_session` RPC before progression evaluation runs.

This patch adds one browser-local active draft per authenticated user with explicit `idle`, `active`, `finishing`, `save_failed`, and discard flows. Drafts are keyed by `workout-app:active-workout-draft:v1:<userId>`, carry version `1`, and preserve draft/session ID, user ID, workout template ID, plan/phase IDs, workout-name snapshot, timestamps, elapsed-time basis, checked exercise state, and check-in fields. Drafts older than seven days are surfaced as stale and offered for deliberate resume or discard; malformed, unsupported-version, or missing-workout drafts are blocked from silent resume and require safe discard/restart.

Patch state: the PR #26 lifecycle blockers are addressed for Issue #11. Draft-backed saves now send the schema-approved `client_timer` elapsed source, `clientSessionId` is rejected at the API boundary unless it is a valid UUID, and uncertain-response retries first look up an existing owned session by the draft/session ID. If that existing session belongs to the same workout, the API returns it as success without re-running `finalize_workout_session` or progression; if it belongs to another workout, the request is rejected as a conflict. The local draft remains until a confirmed success, and ordinary save failures keep retry available.

UI recovery now keeps stale drafts on the idle recovery decision surface until the user deliberately resumes or discards them, while preserving checked exercises and check-in data for an explicit resume. The idle stale-recovery decision is intentionally non-persistent so merely loading or refreshing the page does not update `lastUpdatedAt` or lifecycle and accidentally make the draft fresh; persistence resumes only after the user clicks Resume and enters the stored lifecycle step. Malformed recovery data no longer points at an unavailable discard action; it exposes `Clear recovery data` for the current user's versioned storage key. After a successful save, `Start another workout` clears saved/draft/form state and returns to idle so the next session starts only after the user explicitly starts a new draft.

## PR Follow-up — Issue #12 Active Workout Shell

Implementing the PR follow-up request for Issue #12 on top of the Issue #11 active-draft lifecycle. The workout details/selection page remains at `/workout`, while Start and Resume now hand off to `/workout/active`, a dedicated active execution route that preserves the same local draft and final save path.

The active route intentionally hides the normal authenticated app shell navigation through the route-boundary helper. It renders only execution-relevant workout content, a sticky compact active-workout header, durable elapsed time reconstructed from the active draft timestamps, truthful checked-exercise progress, Finish, and explicit Discard access. Leaving `/workout/active` without finishing continues to preserve the local Issue #11 draft unless the user deliberately discards it; completion still posts through `POST /api/sessions` and the Issue #10 `finalize_workout_session` RPC path.

Validation focus for this patch: Start from `/workout`, Resume recovered drafts, refresh `/workout/active` to verify elapsed-time continuity, confirm Dashboard/Plans/Settings navigation is hidden on the active route, and verify Finish/Discard remain reachable while scrolling.

Patch update: the Issue #12 active-shell review blockers are addressed by keeping `/workout` selection-only even when a fresh draft is recovered, requiring explicit Resume before a stale draft can Finish, disabling Finish during idle/malformed/stale/saving states, returning active Discard to `/workout?workoutId=<id>`, and making Discard a labeled destructive control. Focused shell behavior tests now cover stale recovery gating, selection-route resume handoff, discard redirect construction, saved-state Start-card suppression, elapsed reconstruction, and retry/stale guards.

## PR Follow-up — Issue #12B Active Workout Density

Implementing the PR follow-up request for Issue #12B on top of the dedicated `/workout/active` shell. This patch keeps the Issue #11 local draft lifecycle and Issue #10 final-save/RPC path unchanged while making the active execution checklist compact by default. Exercise cards now prioritize exercise name, prescription, rest, completion state, and a large labeled completion target; detailed setup, cues, safety notes, demos, mistakes, and modifications are available through progressive disclosure. Recovery messaging is shortened so the sticky header remains the authoritative elapsed-time display.

Validation focus for this patch: mobile scan density, long names/guidance, guidance expand/collapse without losing checked state, keyboard operation on completion and details controls, explicit Discard confirmation/redirect, and existing refresh/resume/finish/retry behavior.

## PR Follow-up — Issue #12C Workout Selection And Completion-State Simplification

Implementing the PR follow-up request for Issue #12C on top of the dedicated `/workout/active` shell and compact execution cards. This patch keeps `/workout` as the workout details and selection surface: recovered fresh drafts show a single Resume action that routes to `/workout/active`, malformed recovery shows a single Clear recovery data action, and the selected workout no longer displays duplicate Start/Resume controls. The recommended-workout panel now changes selection only when a different workout is recommended, leaving the selected details card as the single place to Start or Resume.

The active route now avoids offering a new Start action when no draft is available there; it sends the user back to the matching workout details page to deliberately start from selection. Successful saves show only the saved confirmation and one Back to workout details action. The existing Issue #11 local draft lifecycle and Issue #10 final-save/RPC boundary remain unchanged.

Validation focus for this patch: no active checklist/check-in on `/workout`, fresh-draft Resume handoff to `/workout/active`, one selected-workout Start/Resume/Clear action, active-route no-draft back-to-details state, saved confirmation without a Start card, save retry on failure, and discard redirect back to `/workout?workoutId=<id>`.

## PR Follow-up — Post-Issues #12/#12B/#12C Workout Selection Simplification

Implementing the requested main-state patch after Issues #12, #12B, and #12C. `/workout` remains a selection/details route and `/workout/active` remains the focused execution route. This patch removes the Rest timer card and implementation-oriented local-draft Start explanation from the selection page, shortens the Recommended Today card to the workout name plus that workout's summary, and leaves the selected-workout details card as the single dominant Start/Resume/Clear action surface with recent-history/progression context.

No draft lifecycle, final save, progression, timer continuity, or Supabase behavior is intentionally changed. Validation focus: `/workout` should show no Rest timer or local-draft implementation copy, Recommended Today should not duplicate phase number/duration/goal context, and Start/Resume should still hand off to `/workout/active`, where elapsed timing and execution controls remain available.

## PR Follow-up — Issue #13 Core Set Logging

Implementing the PR follow-up request for the core active-workout set logging issue on top of the Issue #12C active route. This patch keeps the Issue #11 local draft lifecycle and Issue #10 final-save/RPC path as the only persistence boundaries while adding inline set rows for `weight_reps` and `reps_only` exercises on `/workout/active`.

The active draft now carries partial set inputs, completion status, added-set rows, and optional exercise notes. The active UI switches only on persisted `exercise.trackingType`: `weight_reps` renders weight and reps inputs, `reps_only` omits weight, and unsupported tracking types stay on the existing safe completion fallback. Submitted set rows are mapped into the existing `exercise_set_results` RPC payload with prescribed/added kind, order, status, actual load/reps, and completed timestamps; no parallel session or draft store is introduced.

Validation focus for this patch: metadata-driven row choice, decimal/nonnegative load entry, whole-number/nonnegative reps entry, out-of-order complete/uncomplete, added-set remove, refresh recovery of partial row values, exercise-note recovery, unsupported tracking fallback, and final save payload shape.

### PR #33 follow-up — Issue #13 production readiness patch

This follow-up addresses the PR #33 review blockers for Issue #13. The active checklist now gates inline metric entry to the real active execution surface, removes the unsolicited large exercise-note disclosure, shows previous set values from server-resolved stable catalog identity, provides row-level completion validation/focus, and derives active progress from completed metric sets plus fallback completion exercises.

The final-save path now merges untouched prescribed defaults with edited rows before submitting to `finalize_workout_session`, validates submitted metric rows against the selected workout and persisted tracking metadata, and rejects unsupported/foreign/duplicate/invalid child rows. The Supabase delta is committed as `supabase/migrations/20260711193000_issue13_inline_set_logging_rpc_and_metadata.sql`; Codex Web did not apply hosted migrations.

Validation focus: apply the Issue #13 migration to the target Supabase environment, run `supabase/verification/issue-13-inline-set-logging-readonly.sql`, run transactional QA for metric persistence/rejection cases, redeploy the preview, and perform narrow-mobile QA against the actual preview workout confirming Goblet Squat and Romanian Deadlift render `weight_reps` rows while reps-only exercises omit Weight.

### PR #33 follow-up — optional metrics and default-first set logging

The latest Issue #13 patch changes metric completion semantics so a set can be completed with one tap even when load/reps are blank. Supplied metric values are still validated for type and nonnegative range, but missing values persist as `null`; clearing a value no longer uncompletes a row. The checklist now seeds new prescribed rows from previous exact-position history, then most recent applicable exercise history, then deterministic prescribed reps, while preserving recovered draft/user-edited values over generated defaults.

The active exercise card was simplified around the set table as the source of truth: the redundant `sets × reps` banner, row-level completion instructions, and metric exercise-level Completed badge have been removed. Supabase migration `supabase/migrations/20260712120000_issue13_optional_completed_metrics.sql` relaxes only the completed-metric required-value checks while preserving type restrictions, numeric constraints, duplicate order/index protections, RLS ownership, and atomic finalization.

## PR Follow-up — Issue #14 Tracking-Type Execution Rows

Implementing the PR follow-up request for Issue #14 on top of the Issue #13 inline set-row system. The active workout row primitives now accept metadata-driven duration, distance + duration, completion-only fallback, same-each-side labels, and independent-side validation semantics without adding a separate cardio, rehab, or unilateral flow.

This patch keeps the Issue #11 local draft lifecycle and Issue #10/Issue #13 final-save path as the persistence boundary. Duration values are entered and displayed as human-readable time strings while persisting as seconds, distance values remain in the exercise metadata unit, same-each-side rows use one scalar with explicit per-side labeling, and independent-side draft/API validation rejects mixed scalar and side-specific values. Completion checks stay type-specific so invalid or incomplete rows remain editable instead of being silently marked complete.

Validation focus for this patch: duration rows, distance-duration rows, completion-only fallback rows, same-each-side labeling, independent-side validation helpers, mixed-workout draft persistence, final payload metric columns, and no runtime name-based tracking inference.

### PR #35 follow-up — Issue #14 persistence and independent-side blockers

This patch addresses the two confirmed PR #35 blockers for Issue #14. The existing schema already contains the approved duration, distance, and independent left/right scalar columns, so the fix extends the existing `finalize_workout_session` RPC instead of introducing a second result model or save path. The API already sent duration, distance, and side-specific fields, while the prior RPC insert only persisted load/reps; independent-side rows also validated left/right values but rendered scalar inputs.

The Issue #14 follow-up migration is `supabase/migrations/20260712133000_issue14_finalize_metric_persistence.sql`. It updates the single atomic finalize RPC so `exercise_set_results` persists prescribed scalar fields, actual duration/distance fields, and actual independent left/right fields from the existing payload. The active checklist now renders explicit left/right inputs for approved `independent_sides` combinations while preserving `same_each_side` as one clearly labeled scalar value. Codex did not apply any hosted Supabase migration.

Validation focus: apply the Issue #14 migration to the target Supabase environment, run `supabase/verification/issue-14-metric-persistence-readonly.sql`, run `supabase/verification/issue-14-metric-persistence-transactional-qa.sql` in a safe context after substituting environment IDs, redeploy the preview, then complete mobile QA for bilateral duration, distance-duration, same-each-side, independent reps/duration/distance-duration/weight-reps when metadata exists, refresh/Resume, invalid-side focus, completed-row editing, out-of-order completion, save failure/retry, and persisted Supabase scalar values.

## PR Follow-up — Issue #38 Completion Set Rows

Implemented Issue #38 as a focused patch on the active Issue #14 execution-row work. Completion tracking now uses the same `setResults` row model as metric tracking: each prescribed completion set is represented by one prescribed row, added completion sets use added rows, progress counts completed rows over visible rows, and legacy draft exercise-level checked state is converted into completion rows on recovery before subsequent draft writes.

The existing `exercise_set_results` schema and `finalize_workout_session` RPC can persist completion rows without a new table or migration because completion rows carry set order/kind/status/completed timestamp and leave all metric columns null. Historical saved `exercise_results` and sessions are unchanged; this patch only changes new active execution state, draft recovery conversion, and final payload construction.

Validation focus: one-set and multi-set completion exercises, partial/out-of-order/uncomplete behavior, added completion sets, legacy checked/unchecked draft recovery, mixed-workout progress, final payload null metric fields, save retry after failure, and narrow mobile row layout. Codex could not use GitHub CLI in this container (`gh` is not installed), so Issue #38/PR #37 remote issue updates and hosted Supabase row inspection remain manual follow-up items for the Windows environment with `gh` and Supabase access.

## PR Follow-up — Issue #14 First-Class Distance Tracking

Implementing the PR follow-up request to add `distance` as a first-class set tracking type on top of the existing Issue #13/#14 set-row and atomic finalize path. The patch extends the authoritative TypeScript and SQL tracking unions, keeps `distance_duration` for rows that intentionally capture both distance and elapsed time, and uses the existing active draft, retry, API validation, `exercise_set_results`, and `finalize_workout_session` flow rather than adding a parallel workout-result model.

Migration `supabase/migrations/20260712150000_issue14_first_class_distance_tracking.sql` is committed but not applied to hosted Supabase by Codex. Validation focus: distance-only meter rows, independent-side partial rejection, blank completed metric rows persisting `null`, existing duration and distance-duration rows, and narrow active-workout set row layout.

### PR follow-up — keep time-prescribed drills as duration

This review patch addresses the first-class distance tracking feedback for `stride-drills` and `lateral-shuffle`: both catalog entries remain prescribed in seconds, so they stay on `duration` tracking rather than being converted to distance-only rows. The distance-only tracking type remains available for future exercises whose prescription is actually distance-based; no hosted Supabase migration was applied by Codex.

Validation focus: confirm the catalog defaults and SQL backfill keep `stride-drills` and `lateral-shuffle` as duration rows while retaining `distance` support for true distance-only exercises.

## PR Follow-up — Issue #14 Exhaustive Metadata Inventory

Implementing the PR follow-up request to establish a durable, typed exercise metadata inventory on top of the Issue #14 tracking-row foundation. The committed registry in `lib/exercise-metadata-inventory.ts` derives from the static exercise catalog so runtime defaults and review artifacts cannot drift silently. It records normalized names, aliases, exact catalog prescriptions, tracking type, unilateral mode, units, labels, review status, rationale, intentional completion reasons, and future metric flags.

Hosted Supabase audit/backfill was not run from this environment, so legacy row counts remain pending an authorized database audit. The report in `docs/exercise-metadata-inventory.md` documents current repo-owned coverage, totals by tracking type, intentional completion decisions, ambiguity decisions, and future `load_distance` candidates without applying hosted migrations.

## PR Follow-up — Issue #15 Workout execution rest timer integration

Implementing the PR follow-up request for Issue #15 rest timer integration on top of the active Issue #13/#14 execution-row system. The active workout continues to use one draft-backed, timestamp-driven rest timer state for the whole session instead of reintroducing the old standalone `TimerCard` on workout selection.

Completing a set auto-starts or restarts the timer with the just-completed exercise's prescribed rest duration when the current workout's `autoStartRest` draft preference is enabled. The preference defaults to enabled for new or legacy drafts, persists through refresh/recovery, applies only to subsequent set completions, and is shaped so a later global setting can initialize new drafts without rewriting the timer engine. Timer continuity remains timestamp-based (`endsAt`) so refresh/background recovery derives remaining time from absolute time rather than interval ticks.

Patch update: active running, paused, and expired rest controls now live in a non-modal bottom dock with large countdown, exercise context, +15 seconds, pause/resume, skip, and dismiss controls while the workout page keeps enough bottom padding for final rows and Finish controls. Idle rest no longer consumes a permanent large surface; manual Start rest remains a compact active-workout control. Manual start now chooses the current/recent exercise when it still has unfinished visible prescribed or added sets, falls through to the first unfinished exercise, and only uses the bounded fallback when no current context exists. Finish clears `restTimer` and the live derived state before check-in so expiry feedback cannot continue after execution ends; Discard/save/start-over cleanup remains deliberate.

Validation focus: complete a set and confirm the bottom dock follows scroll without blocking logging, refresh while running, refresh with auto-start disabled, pause/resume/add/skip/dismiss, expiry after tab backgrounding, complete another set while running to confirm deterministic restart, manual Start after set 1 of a multi-set exercise, Finish/Discard reset timer state, and verify no timer appears on `/workout` selection.

### PR #51 follow-up — saved-session metric safety patch

The PR #51 merge-safety patch narrows the Issue #17A implementation to the saved-session aggregation/dashboard compatibility slice. It fixes the saved-session Supabase select contract by aliasing `exercise_name:exercise_name_snapshot` from the persisted exercise-result snapshot column, keeps dashboard recent activity sourced from true recent saved sessions across plans while retaining active-plan sessions for phase/progression widgets, and derives latest-session metrics once per read.

Session summaries are now tracking-type-aware and null-aware: missing completed-set metrics fall back to set completion instead of zero-value claims, explicit persisted zero values remain visible, distance and duration are combined only within compatible distance-duration exercise groups, different distance units are not collapsed, and mixed strength/timed/distance workouts use neutral exercise/set completion summaries. Bilateral, same-each-side, and independent-side totals preserve the existing finish-recap aggregate semantics without changing progression policy, schema, RLS, or final-save behavior.

Remaining Issue #17 scope stays open for broader reusable metric outputs such as best/latest values, planned/performed identity details, richer trend-ready groupings, and explicit side-specific trend payloads beyond the compatibility metrics exposed in this patch.

## PR Follow-up — Issue #18 Exercise Details surface

Implementing Issue #18 on top of the active workout execution route. Each active exercise card now exposes a visible exercise-specific Details action plus the exercise title as the same semantic action, opening a secondary Summary/History dialog without creating a second active-workout state tree. Summary is the default every time the surface opens from the workout, and closing returns focus to the originating Details action while the active draft, set inputs, notes, elapsed timer, and rest timer remain owned by the existing `/workout/active` component tree.

The active card no longer renders the standalone in-card Guidance/How-to disclosure. Existing reviewed setup, cues, safety notes, modifications, common mistakes, coaching notes, and reviewed demo links are reused from saved exercise metadata inside Summary. History initially reuses stable server-resolved previous-set summaries/defaults for the selected exercise identity and shows the approved compact empty state when none exist; broader multi-session chronology remains a future extension point over the existing durable session/result model rather than a parallel content system.

Validation focus: Details action visibility and accessible labels, Summary defaulting on every open, no duplicate in-card guidance surface, selected-exercise replacement without stale content, focus return to the originating Details action, current prescription remaining on the active card, reviewed guidance reuse in Summary, compact history/empty states, and active timer/draft preservation through the existing active route state boundary.

### PR #52 follow-up — Issue #18 saved history and modal accessibility patch

This patch completes the Exercise Details readiness items for Issue #18 inside PR #52. The active exercise card now uses one compact semantic Details button per exercise header, so the visible exercise name and Details affordance share a single keyboard tab stop and focus restoration target. The details surface is a real top-aligned modal: focus moves to Close on open, Tab/Shift+Tab are trapped inside the dialog, Escape closes it, body scrolling is locked while open, and close restores focus to the originating Details control without moving active-workout state out of the existing route tree.

History now comes from durable saved-session records (`workout_sessions` joined to `exercise_results` and `exercise_set_results`) resolved by the stable `source_exercise_id` catalog identity that is already snapshotted on `exercise_entries` and `exercise_results`. The Summary recent-performance section reuses the newest trusted completed history entry and includes units, date, and workout context. Previous-set defaults remain only logging prefills and are not presented as completed History. No schema migration was added.

Summary/History share the same fixed-height modal shell with a stable header/tab region and an internal scrolling content region, so switching tabs does not collapse shorter History content toward the bottom. Summary now groups tracking, last completed session, how-to content, safety/modifications, coaching notes, and reviewed demo links without repeating the prescription in a large card. Tracking labels and History set rows use shared exercise-history formatting for weight/reps, reps-only, duration, distance/time, same-each-side, independent-side, and completion-only rows. Reviewed YouTube URLs render as “Watch Demo on YouTube”; non-YouTube reviewed demo URLs render “Watch Demo”; `videoSearchQuery` remains non-renderable metadata and no longer suppresses the normal no-reviewed-guidance empty state when it is the only guidance field.

Validation focus: PR #52 preview QA should verify the compact header, modal focus trap/Escape/focus restoration, stable top-aligned Summary/History height, real saved History chronology and units, no prefill-only History claims, video-search-only empty-state behavior, active set/note/timer preservation, and mobile/desktop light/dark accessibility behavior.

## PR Follow-up — PWA installability foundation

Implemented a narrow PWA installability/supporting-work patch for the install-icon and application-owned install prompt issue, without changing workout execution, auth, Supabase, persistence, or progression behavior. The existing public product name remains `Adaptive Training`, matching the current manifest/layout metadata and historical handoff references.

The patch versions the existing approved icon assets as the active install icon family, updates manifest metadata with a stable app id and install categories, adds a compact dismissible install surface for eligible Chromium prompts and iOS Safari Add to Home Screen guidance, suppresses install UI during active workout routes, and registers a conservative production service worker. The service worker intentionally performs network fetches only and does not cache authenticated pages, Supabase/API requests, session saves, progression data, or user-specific responses.

Validation focus: manifest icon references, app-owned `beforeinstallprompt` state, standalone detection, dismissal cooldown, `appinstalled` cleanup, iOS Safari guidance, unsupported-browser hiding, active-workout suppression, and `npm run check`.

## PR Follow-up — Rest Timer Defaults and Workout Settings

Implementing the PR follow-up request for the workout execution rest-timer preference slice on top of the centralized active-workout timer. This patch keeps the centralized timer as the only timer authority, adds one durable `profiles.default_rest_seconds` global preference with a 90-second default, and stores workout-only timer overrides inside the existing browser active-workout draft.

Rest duration now resolves deterministically as active-workout default override, exercise prescribed rest, global profile default rest, then the application fallback. Auto-start and timer-complete sound remain enabled by default; workout settings can disable them for the current draft without mutating global settings, workout templates, exercise prescriptions, saved sessions, or active running timer duration. Timer-complete sound uses a short Web Audio beep and silently degrades when browser audio is unavailable or blocked.

Validation focus: profile preference persistence, draft serialization/recovery of workout-only timer settings, rest-duration precedence, auto-start duplicate prevention for the same completion event, sound-on-expiration behavior, and preserving Finish/Discard lifecycle cleanup.

## PR #56 Follow-up — Rest timer feedback and settings accessibility

This patch addresses the PR #56 review follow-up for GitHub Issue #22 without adding another Supabase migration. The active workout still uses the existing draft-backed centralized rest timer authority. Natural timer expiry now restores the prior mobile vibration cue independently of the timer-complete sound setting, and sound playback uses a reusable Web Audio context unlocked from deliberate workout interactions instead of constructing a new context at expiry.

Timer completion feedback is keyed by the timer lifecycle (`startedAt`, `endsAt`, and completed-set/manual source) so a natural completion can emit at most one vibration and one optional cue, while refresh recovery of an already-expired timer, Skip/Clear/Finish/Discard cleanup, pause, and settings changes do not replay completion feedback. Extending an expired timer creates a new running lifecycle that can emit once when it naturally completes.

The Workout settings surface is now a single active-route rendering path using the existing focused dialog pattern: initial focus moves inside the dialog, Escape closes it, Tab is contained, body scroll is locked, and focus returns to the three-dot trigger. Rest override copy now clarifies that a workout-level selection overrides every exercise prescription, while the unset option preserves exercise-rest/global-default precedence.

## PR Follow-up — PR #56 Product-owner QA cleanup

Implemented the focused product-owner QA cleanup for GitHub Issue #22 / PR #56 on top of the rest-timer settings patch. The active `/workout/active` workout body no longer renders the duplicate auto-start control or a redundant completion/progress presentation before exercises; normal active-workout content now proceeds from the sticky execution header to the active rest-timer dock when one is running, then directly into the exercise list. Routine draft/recovery informational success messages are not shown above the exercise list, while malformed recovery, stale resume/discard decisions, unavailable workout, save failure/retry, and destructive confirmation states remain available through their existing exceptional-state surfaces.

Workout rest override state is now explicit in the active draft: `workoutRestOverrideEnabled` records the user's Yes/No intent and `workoutDefaultRestSeconds` preserves the selected duration. Legacy drafts from the earlier PR representation remain recoverable: a missing explicit flag with a legacy `null` duration recovers as override disabled, while a missing explicit flag with a numeric duration recovers as override enabled with that duration. Reset to defaults disables the override and restores the approved default selected duration without mutating global profile settings, workout templates, exercise prescriptions, or saved history.

Validation focus: legacy nullable draft migration, new explicit override serialization, disabled override ignoring stored duration, enabled override precedence over exercise-prescribed rest, disabled override falling back through exercise rest then global default, preserving selected duration while toggling off/on, active workout opening directly into exercises, existing auto-start and sound settings persistence, and no new Supabase migration.

## PR Follow-up — Dashboard Training Home

The initial PR #57 dashboard simplification changed only presentation while preserving the existing dashboard data loader, saved-session metric derivation, progression calculation, Supabase schema, auth boundaries, workout start/log destinations, and deterministic progression behavior. Its durable outcome is the compact Today’s Training card and the compact This Week schedule as the top of the dashboard.

That initial intermediate layout was superseded by the follow-up below: the standalone progression attention card and condensed Progress Summary card are no longer current dashboard surfaces. The current dashboard state is Today’s Training, This Week, Current Phase, and Recent Activity, with detailed plan/progression review remaining on the existing Plans surfaces.

Validation focus for the current dashboard remains: active plan with a normal workout, active plan with no workout today, no active plan, long workout names, Start workout and Log past workout links, Review plan/progression links, keyboard focus, mobile density, and no unsafe no-workout fallthrough into plan creation.

## PR Follow-up — Dashboard Current Phase and Recent Activity Restore

Implementing the GitHub Issue #54 / dashboard PR follow-up request to preserve the simplified Today and This Week hierarchy while restoring meaningful progression and training-history context. The dashboard presentation now stays ordered as Today’s Training, This Week, Current Phase, and Recent Activity. The standalone Needs Attention progression card and condensed Progress Summary card are removed so progression readiness is not duplicated across multiple dashboard surfaces.

The restored Current Phase card reuses the existing dashboard `phaseProgress` and `progressionPrompt` contracts: phase percentage and progress-bar width are visually capped at 100%, while clean-session counts remain truthful (for example, over-target counts can still display as `6 / 4`). Ready users get the existing Review & progress link to the plan review/progression surface plus a secondary Review plan action; non-ready users keep a truthful plan-progress review action without a misleading progress CTA. The Today card remains compact and now carries workout-specific Monitor/Review readiness warnings inline rather than through a permanent attention slot.

Recent Activity is restored below Current Phase using the existing `activitySummary`, `painTrend`, and saved-session `metrics` fields already derived by shared session aggregation. No schema, Supabase query shape, session persistence, progression rules, clean-session calculation, active-workout lifecycle, or plan-detail behavior intentionally changed.

Validation focus: mobile/desktop dashboard order, no standalone Needs Attention card, no condensed Progress Summary card, compact Today card without old hero stat tiles, This Week directly below Today, Current Phase ready and non-ready action states, over-target visual progress capped to 100% with truthful counts, seven-day activity strip active/inactive/pain labeling, recent Completed/Partial rows with saved-session metric summaries, and workout-specific readiness warnings for Monitor/Review workouts.


### PR #57 narrow no-workout CTA follow-up

The active-plan/no-workout dashboard empty state now keeps a single plan-review action to the specific active plan route (`/plans/{planId}`) and no longer renders the secondary Choose workout link to `/workout`. This avoids the current `/workout` behavior where missing or invalid `workoutId` can redirect to `/plans/new`. The no-active-plan empty state continues to route Create a plan to `/plans/new`.

Validation focus: no-plan destination remains `/plans/new`; active-plan/no-workout destination is the plan review route; active-plan/no-workout renders no `/workout` link and exposes no path that falls through to `/plans/new`; the final dashboard order and workout-specific Monitor/Review readiness messaging remain unchanged.

## PR Follow-up — Issue #34 Workout Page Cleanup

Implemented the Issue #34 `/workout` cleanup as a selection/details-only surface on top of the existing Issue #11 active-draft lifecycle and Issue #12 `/workout/active` execution boundary. The selection route now uses a compact heading, one visible active-phase workout selector with the recommended workout badged in-place, canonical `workoutId` fallback/redirect behavior, selected-workout readiness/history context, an ordered exercise preview, and a single selected-workout Start/Resume/Clear action surface.

This patch intentionally does not change progression logic, workout execution on `/workout/active`, final-save behavior, database schema, migrations, RLS, or API contracts. Dashboard-style recent logs, phase progress/exit criteria, workout rhythm, and latest-suggestion reporting were removed only from `/workout`; the underlying shared data and destination behavior remain available elsewhere.

Validation focus: valid explicit `workoutId`, missing/invalid ID fallback to recommended or first active-phase workout, alternate selection URL synchronization, refresh preservation via canonical URL, Start using the selected workout, active-draft owner badging and Resume behavior, explicit Resume/Discard when another workout owns the draft, absence of duplicated dashboard/reporting sections, and no regression to `/workout/active` lifecycle behavior.

## PR #58 Follow-up — Calendar-oriented `/workout` direct-start surface

Implementing the PR #58 review follow-up for GitHub Issue #34 on top of the compact `/workout` selection cleanup. The `/workout` phase list is now the primary direct-start surface: cards are ordered by deterministic upcoming schedule metadata, the current intended workout is emphasized with `TODAY'S WORKOUT`, and each card owns its exact Start or Resume action so users no longer select a workout and then scroll to a separate downstream Start button.

Repository inspection for this patch found that active-phase workout scheduling is loaded from `workout_templates.scheduled_days` into `WorkoutTemplate.scheduledDays`, plans retain `WorkoutPlan.weeklySchedule`, and database `day_order` is loaded as `WorkoutTemplate.dayOrder` for fallback ordering. Starter-plan, AI import, and plan-editor save paths populate scheduled days, but empty scheduled-day arrays remain valid for flexible/manual records, so labels are only shown from available schedule metadata and unscheduled workouts fall back to `day_order`/source order. Multiple workouts may share a weekday, and one workout may be assigned to multiple weekdays; ordering uses each workout's next occurrence relative to the user-local date. Dashboard week preview already uses user-local date keys, supports multiple scheduled workouts by summarizing names, falls back to plan weekly schedule only when workout-level schedules are absent, and rolls through upcoming days; this patch extracted a focused helper for the `/workout` card ordering rather than changing dashboard behavior.

No schema, migration, progression, recommendation, active execution, plan-editor, dashboard, or session persistence behavior changed. The Issue #11 active-draft guard remains in force: the draft-owning card shows Resume, and starting another card routes through the existing explicit resume/discard protection instead of creating a second draft or silently replacing the current draft.

Validation focus: today-first ordering, tomorrow/weekday labels, week rollover, multi-day workouts, unscheduled fallback ordering, direct card Start/Resume exact workout IDs, active-draft guard preservation, valid `workoutId` deep-link context, no Recommended/Selected badges, no standalone downstream Start button, and compact mobile card density above the authenticated bottom navigation.
