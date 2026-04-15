# Current Task

## Goal

Current active work: Slice 6, contextual dashboard and progression UX.

Recent patch completed locally: a post-5B3 cleanup pass based on QA learning after release.

Important product learning after Slice 5B3:

- `Edit details` is the right primary edit-existing-plan journey
- 5B3 shipped while still surfacing `Update setup & regenerate` and the advanced/manual plan-detail section
- QA showed those extra surfaced actions created unnecessary duplication
- the cleanup patch simplified the main plan-detail UX rather than changing the underlying write model

That cleanup patch delivered:

- simpler review/save copy in `/plans/[planId]/edit`
- removal of the surfaced advanced/manual section from the main plan-detail page
- removal of the surfaced `Update setup & regenerate` action from the main plan-detail page
- a small secondary archive control on the plan-detail page
- retention of `/plans/[planId]/edit-setup` as a direct route for now, without surfacing it as a main plan-detail action

Next planned major implementation slice: Slice 6, contextual dashboard and progression UX.

Small follow-up candidate still open from Slice 5B1: improve profile/settings validation UX so invalid values such as negative age or weight show clear field-level guidance. This is a patch candidate, not a completed fix.

## Current Context

Slices 1 through 5B3 are implemented locally:

- richer profile and plan metadata columns
- nullable `workout_plans.progression_mode`
- `exercise_entries.source_exercise_id`
- `workout_plans.setup_context` for guided plan setup persistence
- AI-neutral plan draft provider
- onboarding/profile separation for durable profile data
- guided `/plans/new` plan setup with review-before-save drafts
- guided `/plans/[planId]/edit` for primary saved-plan detail edits
- guided `/plans/[planId]/edit-setup` for setup-driven plan regeneration with review-before-save updates
- post-5B3 cleanup that de-surfaces regenerate and advanced/manual plan-detail actions while keeping archive as a smaller secondary control
- template-only draft generation through `POST /api/plan-drafts`
- compatible plan creation and update writes through `lib/plan-write.ts`
- presentation-only terminology refinement back to user-facing "Phase"
- lightweight app framing as "Adaptive Training" / "Structured plans that progress with you."
- expanded static exercise catalog metadata for deterministic generation
- goal-aware template drafts for recovery, general fitness, strength, hypertrophy, running, sport performance, and consistency
- settings/profile editing through `/settings` and `PATCH /api/profile`

The app should continue to work without any LLM provider.

## Slice 5B3 Completed Scope

Slice 5B3 added a primary existing-plan detail edit flow:

- `/plans/[planId]/edit` for editing the saved plan details directly without rerunning onboarding or setup
- `Edit details` as the primary plan-detail action on the existing plan page
- `Update setup & regenerate` as a clearly separate setup/regenerate action
- reuse of the existing review/edit stage for both saved-plan edits and regenerate flows
- continued saving through `PATCH /api/plans/[planId]` for compatible updates to the same plan row
- preservation of existing `setup_context` during saved-plan detail edits when it already exists
- readable history snapshot behavior preserved when live plan structure is replaced
- lower-page advanced/manual plan management kept available as a clearly secondary path
- read-side `source_exercise_id` preservation on the saved-plan edit path so reopening and resaving a plan does not drop catalog traceability

Post-implementation notes:

- Saved-plan detail edits and setup/regenerate edits both replace the live plan structure after review. Existing workout and exercise names are snapshotted first so prior history remains readable.
- Old sessions from the replaced structure should not be treated as progress toward the newly changed structure.
- The update path follows existing non-RPC write patterns and is not fully transactional; a future SQL RPC would be stronger before broader public use.
- Older plans can still rely on reconstructed setup context when using the regenerate path.
- Logged-in browser testing is still needed against a real Supabase project with the current schema applied.

## Post-5B3 Cleanup Patch Completed Locally

This patch was a QA-driven cleanup after Slice 5B3, not a restatement of 5B3's original intended scope.

What changed:

- kept `Edit details` as the clear primary existing-plan edit journey
- simplified the review/save copy in the saved-plan edit flow
- removed the surfaced advanced/manual plan-detail section
- removed the surfaced `Update setup & regenerate` action from the main plan-detail page
- kept archive available as a small secondary control
- preserved `/plans/[planId]/edit-setup`, compatible save behavior, and readable history snapshots

## Next Major Scope After This Patch

Slice 6 should improve dashboard and progression UX without changing the core progression engine.

## Likely Files To Inspect

- `app/plans/[planId]/page.tsx`
- `app/plans/[planId]/edit/page.tsx`
- `app/plans/[planId]/edit-setup/page.tsx`
- `components/plan-builder-form.tsx`
- `components/plan-management-actions.tsx`
- `docs/current-task.md`
- `docs/agent-handoff.md`
- `docs/roadmap.md`
- `docs/architecture.md`

## Constraints

- Do not add LLM/provider integration.
- Do not redesign onboarding broadly.
- Do not redo profile/settings editing unless a focused validation UX patch is explicitly included.
- Do not rename database tables, API routes, or compatibility fields such as `plan_phases`, `phase-action`, or `currentPhase`.
- Do not weaken Supabase auth or RLS assumptions.
- Keep changes migration-safe and scoped.
- Do not broaden this cleanup patch into a broader editing-system redesign.
- Do not change plan-write persistence behavior beyond the small UX cleanup this patch requires.
- Do not remove the `/plans/[planId]/edit-setup` route unless that is explicitly re-scoped later; this patch is about the surfaced plan-detail UI.
- Do not do workout execution timer/checklist overhaul; that is Slice 7.
- Do not do exercise media/instruction work; that is Slice 8.

## Non-Goals

- No LLM/provider integration.
- No profile/settings redesign beyond targeted validation UX fixes.
- No broad progression algorithm expansion.
- No broad internal phase terminology renaming.
- No dashboard/progression UX work in this patch; that remains Slice 6.
- No workout execution timer/checklist overhaul; that is Slice 7.
- No exercise media/instruction layer; that is Slice 8.
- No read-only plan sharing.

## Maintenance Note

After each completed slice, update this file so it points to the next active implementation slice rather than the slice that just finished.
