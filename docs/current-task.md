# Current Task

## Goal

Implement Slice 3 of the goal-based adaptive training refactor: `/plans/new` goal-specific plan setup.

`/plans/new` should become the primary place users choose what they want to train for right now, generate a structured draft through the template draft provider, review and edit the draft, then save through the existing plans API.

## Current Context

Slice 1 and Slice 2 are implemented locally:

- richer profile and plan metadata columns
- nullable `workout_plans.progression_mode`
- `exercise_entries.source_exercise_id`
- AI-neutral plan draft provider
- onboarding/profile separation for durable profile data
- profile data mapped through `lib/data.ts`
- tests for draft foundations and onboarding profile validation

The app should continue to work without any LLM provider.

## Scope

Slice 3 should:

- add a small plan setup input model for goal-specific plan creation
- make guided setup the default `/plans/new` path
- keep manual plan creation available as an advanced secondary path
- generate drafts through `lib/plan-drafting/plan-draft-provider.ts` with the template strategy only
- return generated drafts for review and editing before save
- save plans through the existing `/api/plans` write path
- use profile data as defaults/context without asking users to re-enter durable onboarding data
- redirect onboarding to `/plans/new` instead of auto-saving guided plans
- update `docs/agent-handoff.md` after implementation

Plan setup fields should stay intentionally small:

- `goalType`
- optional `objectiveSummary`
- `daysPerWeek`
- `sessionMinutes`
- `weeklySchedule`
- `preferredSplit`
- `focusAreas`
- `currentConstraints`
- optional advanced `progressionModeOverride`

## Likely Files Touched

- `app/plans/new/page.tsx`
- `components/plan-setup-wizard.tsx`
- `components/plan-builder-form.tsx`
- `app/api/plan-drafts/route.ts`
- `app/api/onboarding/route.ts`
- `app/onboarding/page.tsx`
- `app/page.tsx`
- `lib/types.ts`
- `lib/validation.ts`
- `lib/plan-drafting/plan-draft-provider.ts`
- `lib/starter-plan-generator.ts`
- `lib/__tests__/plan-drafting-foundation.test.ts`
- `docs/current-task.md`
- `docs/agent-handoff.md`

## Constraints

- Do not add LLM/provider integration.
- Do not redesign onboarding.
- Do not perform the full Phase-to-Block terminology sweep.
- Do not expand progression algorithms.
- Do not do a broad exercise catalog overhaul.
- Do not make database schema changes for this slice.
- Do not weaken Supabase auth or RLS assumptions.
- Keep changes migration-safe and scoped.

## Acceptance Criteria

- `/plans/new` supports a small guided goal-based setup flow.
- Manual plan creation still works from `/plans/new?mode=manual` and from the guided page toggle.
- Guided draft creation uses the template draft provider.
- Draft generation does not auto-save plans.
- Generated drafts can be reviewed and edited before saving.
- Saved plans still persist through `/api/plans`.
- Onboarding saves profile data and redirects to `/plans/new`.
- The app remains functional without LLM configuration.
- `npm run test`, `npm run typecheck`, and `npm run build` pass for code changes.
- Logged-in browser testing notes are added to `docs/agent-handoff.md`.

## Non-Goals

- No LLM/provider integration.
- No broad catalog overhaul.
- No progression behavior expansion.
- No full Phase-to-Block terminology pass.
- No read-only plan sharing.
- No exercise substitutions.
