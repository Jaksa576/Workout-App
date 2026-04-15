# Current Task

## Goal

Next planned major implementation slice: Slice 5B3, reusable review/edit flow for existing plans.

Slice 5B2 should be treated as completed locally: users can open an existing plan, enter a setup-driven edit flow, regenerate an updated draft, review it, and save back to the same plan without rerunning onboarding.

Immediate product learning from QA:

- the current edit-setup flow is useful, but it should mean "update plan setup" or "regenerate from setup," not the primary general "edit my plan" path
- users who want to edit an existing plan usually want to edit the already-generated plan details / review-stage content
- having both the setup-driven flow and the advanced/manual plan editor creates confusing duplicate edit surfaces right now

Immediate follow-up patch recommendation:

- relabel the current setup-driven entry point so it clearly means setup/regenerate rather than general plan editing

Small follow-up candidate still open from Slice 5B1: improve profile/settings validation UX so invalid values such as negative age or weight show clear field-level guidance. This is a patch candidate, not a completed fix.

## Current Context

Slices 1 through 5B2 are implemented locally:

- richer profile and plan metadata columns
- nullable `workout_plans.progression_mode`
- `exercise_entries.source_exercise_id`
- `workout_plans.setup_context` for guided plan setup persistence
- AI-neutral plan draft provider
- onboarding/profile separation for durable profile data
- guided `/plans/new` plan setup with review-before-save drafts
- guided `/plans/[planId]/edit-setup` setup-driven plan regeneration with review-before-save updates
- template-only draft generation through `POST /api/plan-drafts`
- compatible plan creation and update writes through `lib/plan-write.ts`
- presentation-only terminology refinement back to user-facing "Phase"
- lightweight app framing as "Adaptive Training" / "Structured plans that progress with you."
- expanded static exercise catalog metadata for deterministic generation
- goal-aware template drafts for recovery, general fitness, strength, hypertrophy, running, sport performance, and consistency
- settings/profile editing through `/settings` and `PATCH /api/profile`

The app should continue to work without any LLM provider.

## Slice 5B2 Completed Scope

Slice 5B2 added guided plan setup regeneration for existing plans:

- one primary "Edit plan setup" entry point from plan detail
- `/plans/[planId]/edit-setup` for guided edits without routing through onboarding
- setup-context persistence for newly saved guided plans
- safe reconstruction for older plans that do not have saved setup context
- reuse of the existing guided setup -> draft -> review/edit -> save pattern
- `PATCH /api/plans/[planId]` for saving reviewed updates back to the same plan
- history snapshot preservation before replacing live plan structure
- manual plan management kept as a separate advanced path

Post-implementation notes:

- Guided edit replaces the live plan structure after review. Existing workout and exercise names are snapshotted first so prior history remains readable.
- Old sessions from the replaced structure should not be treated as progress toward the newly generated structure.
- The update path follows existing non-RPC write patterns and is not fully transactional; a future SQL RPC would be stronger before broader public use.
- Logged-in browser testing is still needed against a real Supabase project with `workout_plans.setup_context` applied.
- QA learning changed the next priority: the setup-driven flow should remain available, but it should not be treated as the main general edit-existing-plan journey.

## Scope For Slice 5B3

Slice 5B3 should make editing an existing plan feel like editing the already-generated plan details, not restarting setup.

Expected focus:

- separate or reuse the post-generation review/edit experience so it can be opened for an existing plan
- make that review/edit experience the primary edit-existing-plan journey
- keep setup/regenerate as a distinct action for changing setup inputs and regenerating from them
- keep the advanced/manual plan editor available until the reusable review/edit flow fully covers the real use case
- preserve existing plan write compatibility and readable history snapshots
- avoid broad onboarding, profile/settings, schema, or LLM work in this slice

## Likely Files To Inspect

- `app/plans/[planId]/page.tsx`
- `app/plans/[planId]/edit-setup/page.tsx`
- `app/plans/new/page.tsx`
- `components/plan-builder-form.tsx`
- `components/plan-setup-wizard.tsx`
- `components/plan-management-actions.tsx`
- `lib/plan-setup-context.ts`
- `lib/plan-write.ts`
- `lib/types.ts`
- `lib/validation.ts`
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
- Do not remove the advanced/manual plan editor yet; that decision is deferred until the new review/edit path is complete.
- Do not do dashboard/progression UX work yet; that remains Slice 6 after this slice.
- Do not do workout execution timer/checklist overhaul; that is Slice 7.
- Do not do exercise media/instruction work; that is Slice 8.

## Acceptance Criteria For Slice 5B3

- Editing an existing plan can primarily start from a review/edit experience for the already-generated plan details.
- Setup/regenerate remains available as a separate action and is clearly labeled that way.
- Duplicate edit surfaces are meaningfully clearer to a normal user.
- The advanced/manual plan editor remains available until the new primary edit flow fully covers the use case.
- Existing guided `/plans/new` creation still works.
- Existing guided `/plans/[planId]/edit-setup` editing still works.
- Workout history snapshots remain readable after plan edits.
- The app remains functional without LLM configuration.
- `npm run test`, `npm run typecheck`, and `npm run build` pass for code changes.
- Logged-in browser testing notes are added to `docs/agent-handoff.md`.

## Non-Goals

- No LLM/provider integration.
- No profile/settings redesign beyond targeted validation UX fixes.
- No broad progression algorithm expansion.
- No removal of the advanced/manual plan editor in this slice.
- No broad internal phase terminology renaming.
- No dashboard/progression UX work in this slice; that is Slice 6.
- No workout execution timer/checklist overhaul; that is Slice 7.
- No exercise media/instruction layer; that is Slice 8.
- No read-only plan sharing.

## Maintenance Note

After each completed slice, update this file so it points to the next active implementation slice rather than the slice that just finished.
