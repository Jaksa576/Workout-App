# Current Task

## Goal

Next planned major implementation slice: Slice 5B2, guided edit-plan workflow.

Slice 5B1 should be treated as completed locally: users now have a real `/settings` profile editing surface for durable training context without rerunning onboarding.

Immediate small follow-up candidate before or alongside 5B2: improve profile/settings validation UX so invalid values such as negative age or weight show clear field-level guidance. This is a patch candidate, not a completed fix.

## Current Context

Slices 1 through 5B1 are implemented locally:

- richer profile and plan metadata columns
- nullable `workout_plans.progression_mode`
- `exercise_entries.source_exercise_id`
- AI-neutral plan draft provider
- onboarding/profile separation for durable profile data
- guided `/plans/new` plan setup with review-before-save drafts
- template-only draft generation through `POST /api/plan-drafts`
- presentation-only terminology refinement back to user-facing "Phase"
- lightweight app framing as "Adaptive Training" / "Structured plans that progress with you."
- expanded static exercise catalog metadata for deterministic generation
- goal-aware template drafts for recovery, general fitness, strength, hypertrophy, running, sport performance, and consistency
- settings/profile editing through `/settings` and `PATCH /api/profile`

The app should continue to work without any LLM provider.

## Slice 5B1 Completed Scope

Slice 5B was split into two separate product problems:

- Slice 5B1: profile/settings editing for durable training context.
- Slice 5B2: guided edit-plan workflow for existing plans.

Slice 5B1 added a settings/profile editing workflow only. It did not implement guided plan editing.

Post-QA notes:

- Settings/profile saves are functional, but validation feedback needs a small UX patch for field-level guidance when invalid values are entered.
- Profile field ownership is still an open product question. Fields such as training experience and current activity level may later be reclassified as onboarding/setup inputs, plan-context inputs, or last-known context instead of permanent user-editable settings.
- No profile model redesign is active yet; treat that as future product refinement unless explicitly scoped.

## Scope For Slice 5B2

Slice 5B2 should add a guided edit-plan workflow for an existing plan without sending users back through onboarding.

Expected focus:

- guided editing of an existing plan's setup/context
- a safe way to persist or reconstruct the plan setup context needed to reopen guided configuration
- review-before-save behavior for edited plan drafts
- compatibility with existing plan structure and history snapshots
- keeping manual plan management available for advanced users

## Likely Files To Inspect

- `app/plans/[planId]/page.tsx`
- `app/plans/new/page.tsx`
- `components/plan-setup-wizard.tsx`
- `components/plan-builder-form.tsx`
- `components/plan-management-actions.tsx`
- `lib/data.ts`
- `lib/types.ts`
- `lib/validation.ts`
- `app/api/plans/route.ts`
- `app/api/plans/[planId]/route.ts`
- `lib/plan-write.ts`
- `lib/starter-plan-generator.ts`
- `docs/current-task.md`
- `docs/agent-handoff.md`
- `docs/roadmap.md`

## Constraints

- Do not add LLM/provider integration.
- Do not redesign onboarding broadly.
- Do not redo Slice 5B1 profile/settings editing unless a focused bug fix is needed.
- Do not rename database tables, API routes, or compatibility fields such as `plan_phases`, `phase-action`, or `currentPhase`.
- Do not expand progression algorithms.
- Do not do dashboard/progression UX work; that is Slice 6.
- Do not do workout execution UX work; that is Slice 7.
- Do not make database schema changes unless a small additive field is clearly required.
- Do not weaken Supabase auth or RLS assumptions.
- Keep changes migration-safe and scoped.

## Acceptance Criteria For Slice 5B2

- Users can start a guided edit workflow for an existing plan without rebuilding onboarding.
- Existing guided `/plans/new` creation still works.
- Manual plan management remains available.
- Existing plans persist through compatible save/write paths.
- Workout history snapshots remain readable after plan edits.
- The app remains functional without LLM configuration.
- `npm run test`, `npm run typecheck`, and `npm run build` pass for code changes.
- Logged-in browser testing notes are added to `docs/agent-handoff.md`.

## Non-Goals

- No LLM/provider integration.
- No profile/settings redesign beyond targeted follow-up fixes.
- No progression behavior expansion.
- No broad internal phase terminology renaming.
- No dashboard redesign or contextual progression UX; that is Slice 6.
- No workout execution timer/checklist overhaul; that is Slice 7.
- No exercise media/instruction layer; that is Slice 8.
- No read-only plan sharing.

## Maintenance Note

After each completed slice, update this file so it points to the next active implementation slice rather than the slice that just finished.
