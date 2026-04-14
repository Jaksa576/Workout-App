# Current Task

## Goal

Next planned implementation slice: Slice 5B, profile/settings plus guided edit-plan workflow.

Slice 5A should be treated as completed locally: deterministic guided plan drafts now use richer exercise metadata, bounded goal-aware template shapes, and coarse equipment/dislike/constraint filtering while keeping the setup -> draft -> review/edit -> save contract unchanged.

## Current Context

Slices 1 through 5A are implemented locally:

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

The app should continue to work without any LLM provider.

## Scope For Slice 5B

Slice 5B should add user-facing ways to update durable training context and adjust existing plans without sending users back through onboarding.

Expected focus:

- profile/settings surface for durable training context
- guided edit-plan workflow for an existing plan
- reuse existing profile and plan setup concepts where practical
- keep manual plan editing available for advanced users
- preserve existing plan save paths and compatibility fields

## Likely Files To Inspect

- `app/onboarding/page.tsx`
- `app/plans/new/page.tsx`
- `app/plans/[planId]/page.tsx`
- `components/plan-setup-wizard.tsx`
- `components/plan-builder-form.tsx`
- `components/plan-management-actions.tsx`
- `lib/data.ts`
- `lib/types.ts`
- `lib/validation.ts`
- `app/api/onboarding/route.ts`
- `app/api/plans/route.ts`
- any profile/settings routes or components introduced in Slice 5B
- `docs/current-task.md`
- `docs/agent-handoff.md`
- `docs/roadmap.md`

## Constraints

- Do not add LLM/provider integration.
- Do not redesign onboarding broadly.
- Do not rename database tables, API routes, or compatibility fields such as `plan_phases`, `phase-action`, or `currentPhase`.
- Do not expand progression algorithms.
- Do not do dashboard/progression UX work; that is Slice 6.
- Do not do workout execution UX work; that is Slice 7.
- Do not make database schema changes unless a small additive field is clearly required.
- Do not weaken Supabase auth or RLS assumptions.
- Keep changes migration-safe and scoped.

## Acceptance Criteria For Slice 5B

- Users can update durable training profile/settings outside onboarding.
- Users can start a guided edit workflow for an existing plan without rebuilding onboarding.
- Existing guided `/plans/new` creation still works.
- Manual plan creation/editing remains available.
- Existing plans persist through compatible save/write paths.
- The app remains functional without LLM configuration.
- `npm run test`, `npm run typecheck`, and `npm run build` pass for code changes.
- Logged-in browser testing notes are added to `docs/agent-handoff.md`.

## Non-Goals

- No LLM/provider integration.
- No progression behavior expansion.
- No broad internal phase terminology renaming.
- No dashboard redesign or contextual progression UX; that is Slice 6.
- No workout execution timer/checklist overhaul; that is Slice 7.
- No exercise media/instruction layer; that is Slice 8.
- No read-only plan sharing.

## Maintenance Note

After each completed slice, update this file so it points to the next active implementation slice rather than the slice that just finished.
