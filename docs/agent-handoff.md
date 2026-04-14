# Agent Handoff

Use this file to help the next coding agent understand where work stopped.

## Project Summary

This app is evolving from a recovery-first phased workout app into a broader goal-based adaptive training platform.

The product should support multiple goal tracks while reusing the same core infrastructure:

- recovery / rehab
- general fitness
- strength
- hypertrophy
- running
- sport performance
- consistency / habit building

The differentiated product idea is still structured adaptive programming, not generic workout logging. The app should keep guiding users through plans/programs, progressive phases or Blocks, workouts, exercises, sessions, check-ins, and intelligent advancement, repetition, or adjustment decisions.

## Current Objective

The approved refactor direction is additive and migration-safe:

1. Domain foundation and draft abstraction.
2. Onboarding/profile separation.
3. `/plans/new` goal-specific plan setup.
4. UI terminology shift toward "Blocks".
5. Goal-aware exercise catalog and draft quality improvements.
6. Progression behavior expansion.

Slices 1, 2, 3, and 4 are implemented locally. The next implementation slice is Slice 5: goal-aware exercise catalog and draft quality improvements.

## Current Status

- The current app already has Supabase auth, onboarding, plan creation, structured plans with user-facing Blocks/workouts/exercises, session tracking, server-side progression evaluation, explicit Block advancement, plan activation, archive/delete management, and YouTube demo links.
- The database engine still uses `workout_plans -> plan_phases -> workout_templates -> exercise_entries -> workout_sessions`.
- Product/UI language now uses "Blocks" in the main plan, workout, progress, and manual-builder surfaces, but the database has not been renamed; `plan_phases` remains the compatibility layer.
- Manual plan creation remains available and is now a secondary path from `/plans/new?mode=manual` or the guided setup toggle.
- Guided plan creation is now review-before-save: `/plans/new` generates a draft, lets the user edit it, then saves through `/api/plans`.
- The app remains fully functional without any LLM provider.
- The future LLM path should plug into the same setup -> draft -> review/edit -> save flow and never become the system of record.

## Slice 1 Completed Locally

Slice 1 added the foundation for the broader product direction:

- richer profile metadata columns and plan metadata columns additively
- nullable plan-level `progression_mode`
- `source_exercise_id` for catalog-backed exercise entries
- AI-neutral draft-provider boundary at `lib/plan-drafting/plan-draft-provider.ts`
- goal/progression shared types, validation, and default progression-mode selection
- minimal Vitest foundation tests for draft generation, validation, and progression-mode selection

Verification after Slice 1:

- `npm run test` passed.
- `npm run typecheck` passed.
- `npm run build` passed.

## Slice 2 Completed Locally

Slice 2 separated onboarding/profile setup from longer-term goal-specific plan setup:

- onboarding now centers durable profile data: age, weight, training experience, activity level, training environment, limitations detail, exercise preferences, exercise dislikes, sports/interests, equipment, typical availability, and typical session duration
- `planSetupChoice` remains only as temporary onboarding submission state so users can still choose guided plan setup or the manual plan builder after profile save
- the onboarding API saves only durable profile fields and does not write `goal_notes` or infer `primary_goal_type`
- existing non-null profile fields are protected from null/empty overwrites by preserving stored values when optional submitted values are blank
- `lib/data.ts` maps the richer profile fields for future use
- onboarding/profile validation tests were added under `lib/__tests__/`

Verification after Slice 2:

- `npm run test` passed.
- `npm run typecheck` passed.
- `npm run build` passed.

## Slice 3 Completed Locally

Slice 3 moved goal-specific setup into `/plans/new`:

- added a lightweight `PlanSetupInput` model for `goalType`, optional `objectiveSummary`, `daysPerWeek`, `sessionMinutes`, `weeklySchedule`, `preferredSplit`, `focusAreas`, `currentConstraints`, and optional advanced `progressionModeOverride`
- added plan setup validation in `lib/validation.ts`
- refactored `lib/plan-drafting/plan-draft-provider.ts` and `lib/starter-plan-generator.ts` so guided drafts use plan setup input plus optional profile context, not onboarding input
- added `POST /api/plan-drafts` as a non-persistent draft-generation endpoint that requires auth, loads the profile, calls the template draft provider, and returns a structured draft without saving
- added `components/plan-setup-wizard.tsx` with goal selection, minimal plan-specific questions, draft loading/error/retry states, missing-profile fallback copy, and draft review/edit before save
- refactored `components/plan-builder-form.tsx` to accept an optional generated `StructuredPlanInput` while preserving `goalType`, `progressionMode`, and `creationSource`
- updated `/plans/new` to default to guided setup and keep manual setup available through `?mode=manual`
- updated onboarding to redirect to `/plans/new` or `/plans/new?mode=manual` instead of auto-saving a guided starter plan
- updated dashboard/onboarding/workout redirects so completed-profile users without a plan are sent to `/plans/new`
- updated `docs/current-task.md` to describe Slice 3

Verification after Slice 3:

- `npm run test` passed.
- `npm run typecheck` passed.
- `npm run build` passed.

## Slice 4 Completed Locally

Slice 4 made the user-facing terminology shift from "Phase" to "Block" as a scoped presentation-only pass:

- added `lib/plan-labels.ts` with a tiny `formatBlockLabel(phaseNumber)` display helper
- updated the dashboard, plans list, plan detail page, workout flow, phase progress panel, manual plan builder, and plan management controls so visible labels and action copy use "Block"
- updated user-visible progression/session/write-path messages that are rendered in the UI or surfaced as API errors
- kept internal compatibility names unchanged, including `plan_phases`, `phase-action`, `currentPhase`, `PhaseProgressPanel`, phase-shaped TypeScript payloads, route/file names, and progression algorithms/enums/semantics
- lightly updated README product wording so it reflects onboarding/profile setup, guided `/plans/new` plan drafts, and block-based progression
- updated `docs/current-task.md` to point to Slice 5 and added a maintenance note to advance it after each completed slice
- updated `docs/roadmap.md` so Slice 4 is implemented locally and Slice 5 is next

Verification after Slice 4:

- Terminology search was run to separate remaining internal/API/database names from user-facing copy.
- `npm run test` passed.
- `npm run typecheck` passed.
- `npm run build` passed.

## Schema Drift Recovery Status

After Slice 2, localhost hit a runtime error because the Supabase project in `.env.local` was missing Slice 1 columns such as `profiles.primary_goal_type`.

Recovery status:

- Partial migration-tolerant fallback edits in `lib/data.ts` and `app/api/onboarding/route.ts` were removed before Slice 3.
- The app now expects the clean Slice 1/Slice 2/Slice 3 schema directly.
- `supabase/schema.sql` was inspected and already includes the Slice 1/Slice 2 expected columns.
- Slice 3 did not require database schema changes.
- The repo only uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for Supabase clients.

Remaining recovery work:

- Create or use a Supabase dev project with the current schema applied.
- Update `.env.local` to the dev project's `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Apply `supabase/schema.sql` once to a blank dev project, or ensure these migrations are applied to an existing project:
  - `supabase/migrations/20260412160000_onboarding_progression.sql`
  - `supabase/migrations/20260412170000_phase_session_scoping.sql`
  - `supabase/migrations/20260413120000_training_profile_and_progression_mode.sql`
- Restart the dev server and manually verify logged-in flows.

## Next Best Step

Manually verify Slice 3 in a logged-in browser against a Supabase project with the current schema:

- new user onboarding saves durable profile data and redirects to `/plans/new`
- guided `/plans/new` draft generation works without LLM configuration
- generated drafts are editable before save
- generated plans save through `/api/plans` and appear in the plans list/detail pages
- `/plans/new?mode=manual` still saves a manual plan
- completed-profile users without a plan land on `/plans/new`, not back in onboarding

After browser verification, the next product slice is Slice 5: goal-aware exercise catalog and draft quality improvements while preserving the existing setup -> draft -> review/edit -> save contract.

## Known Risks And Assumptions

- The Slice 1 migration may still need to be applied in Supabase before deployed code can write the new columns.
- `workout_plans.progression_mode` is intentionally nullable at the database level; app code sets it when plan-goal context is available.
- Slice 3 defaults progression mode from goal type and light profile/constraint context; it does not expand progression algorithms.
- Ambiguous legacy profile goals should not be backfilled to `general_fitness`; only obvious goal text should receive `primary_goal_type`.
- Slice 2 preserves existing non-null profile fields when submitted optional onboarding values are null, empty strings, or empty arrays; there is not yet an explicit profile-field clearing UI.
- Session save plus phase action updates are not fully atomic yet; a future SQL RPC would be stronger before broader public use.
- Slice 4 intentionally did not rename `plan_phases`, `phase-action`, `currentPhase`, `PhaseProgressPanel`, existing phase-shaped payload fields, route/file names, or progression algorithm terms used internally.
- Existing old plans use default structured rule settings and keep old text criteria for display.
- The starter exercise catalog is static TypeScript data for now, not an admin-editable database table.
- Saved phase/workout/exercise deletes are hard deletes from the live plan structure, so browser testing should confirm history snapshots remain readable.
- Sessions with no recoverable phase snapshot do not count toward live phase progress.
- Logged-in browser testing is still needed for onboarding, guided draft generation, generated draft edit/save with Block terminology, manual plan creation, plan activation, deletion/archive behavior, and mobile layout.

## Important Files

- `app/plans/new/page.tsx`
- `components/plan-setup-wizard.tsx`
- `components/plan-builder-form.tsx`
- `app/api/plan-drafts/route.ts`
- `app/api/plans/route.ts`
- `app/api/onboarding/route.ts`
- `app/onboarding/page.tsx`
- `app/page.tsx`
- `lib/plan-write.ts`
- `lib/starter-plan-generator.ts`
- `lib/exercise-library.ts`
- `lib/plan-drafting/plan-draft-provider.ts`
- `lib/progression-mode.ts`
- `lib/plan-labels.ts`
- `lib/types.ts`
- `lib/validation.ts`
- `lib/data.ts`
- `supabase/schema.sql`
- `supabase/migrations/20260413120000_training_profile_and_progression_mode.sql`
- `docs/architecture.md`
- `docs/current-task.md`
- `docs/roadmap.md`

## Verification Notes

For code changes, usually run:

- `npm run test`
- `npm run typecheck`
- `npm run build`

Most recent Slice 3 verification:

- `npm run test` passed on April 13, 2026.
- `npm run typecheck` passed on April 13, 2026.
- `npm run build` passed on April 13, 2026.

Most recent Slice 4 verification:

- Terminology search run locally; remaining `phase`/`Phase` hits are internal compatibility names, docs context, or unused mock data.
- `npm run test` passed.
- `npm run typecheck` passed.
- `npm run build` passed.

Manual browser verification still needed:

- fresh auth and onboarding/profile creation
- guided draft generation and retry/error states
- generated draft edit and save, including visible Block terminology in the review builder
- manual `/plans/new?mode=manual` save
- dashboard, workout, and onboarding redirects when the user has a profile but no plan
- mobile layout usability
