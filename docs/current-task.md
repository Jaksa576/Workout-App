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
