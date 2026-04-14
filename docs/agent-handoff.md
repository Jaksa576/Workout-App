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

The differentiated product idea is still structured adaptive programming, not generic workout logging. The app should keep guiding users through plans/programs, progressive phases, workouts, exercises, sessions, check-ins, and intelligent advancement, repetition, or adjustment decisions.

## Current Objective

The approved refactor direction is additive and migration-safe:

1. Domain foundation and draft abstraction.
2. Onboarding/profile separation.
3. `/plans/new` goal-specific plan setup.
4. UI terminology shift toward "Blocks".
4.5. Terminology refinement and lightweight branding polish.
5A. Goal-aware templates, richer exercise metadata, and deterministic defaults.
5B1. Profile/settings editing.
5B2. Guided edit-plan workflow.
6. Contextual dashboard and progression UX.
7. Workout execution UX.
8. Exercise media and instruction layer.
9. Broader polish/branding if still needed.

Slices 1, 2, 3, 4, 4.5, 5A, and 5B1 are implemented locally. The next major implementation slice is Slice 5B2: guided edit-plan workflow. A small Slice 5B1 follow-up patch may be needed first for profile/settings field-level validation messaging.

## Current Status

- The current app already has Supabase auth, onboarding, plan creation, structured plans with user-facing phases/workouts/exercises, session tracking, server-side progression evaluation, explicit phase advancement, plan activation, archive/delete management, and YouTube demo links.
- The database engine still uses `workout_plans -> plan_phases -> workout_templates -> exercise_entries -> workout_sessions`.
- Product/UI language now uses concise "Phase" labels in the main plan, workout, progress, and manual-builder surfaces, but the database has not been renamed; `plan_phases` remains the compatibility layer.
- The lightweight working product frame is now "Adaptive Training" with the subtitle "Structured plans that progress with you."
- Manual plan creation remains available and is now a secondary path from `/plans/new?mode=manual` or the guided setup toggle.
- Guided plan creation is now review-before-save: `/plans/new` generates a draft, lets the user edit it, then saves through `/api/plans`.
- Settings now has a real profile editing form for durable training context; onboarding remains separate from ongoing profile edits.
- Slice 5B1 QA found that invalid settings values, such as negative age or weight, need clearer field-level validation guidance.
- The app remains fully functional without any LLM provider.
- The future LLM path should plug into the same setup -> draft -> review/edit -> save flow and never become the system of record.
- Guided template drafts now have a stronger deterministic baseline by goal track before any LLM support exists.

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

## Slice 4.5 Completed Locally

Slice 4.5 refined terminology and light product framing as a presentation-only pass:

- changed the tiny display helper in `lib/plan-labels.ts` from `formatBlockLabel(phaseNumber)` to `formatPhaseLabel(phaseNumber)`
- changed user-visible "Block" copy back to concise "Phase" language across the dashboard, plans list, plan detail page, workout flow, phase progress panel, manual plan builder, plan management controls, progression messages, plan write validation, and management API error text
- updated the app shell, metadata, manifest, and README to the working product frame "Adaptive Training" / "Structured plans that progress with you."
- updated `docs/roadmap.md` to add Slice 4.5 and revise the next sequence to Slice 5A, 5B, 6, 7, 8, and 9
- updated `docs/current-task.md` so the next active implementation task is Slice 5A
- kept internal compatibility names unchanged, including `plan_phases`, `phase-action`, `currentPhase`, `PhaseProgressPanel`, `PhaseProgressSummary`, `PlanPhase`, `StructuredPhaseInput`, phase-shaped payload fields, route/file names, progression algorithms/enums/semantics, the draft provider, guided setup logic, save paths, schema, auth, and RLS assumptions

Verification after Slice 4.5:

- Terminology search was run locally; remaining lowercase `block` hits in app code are Tailwind/CSS display classes, while remaining "Block" docs hits are Slice 4 historical context.
- `npm run test` passed.
- `npm run typecheck` passed.
- `npm run build` passed.

## Slice 5A Completed Locally

Slice 5A improved deterministic guided draft quality without changing schema, API routes, provider strategy, or the `/plans/new` review/edit/save flow:

- expanded `lib/exercise-library.ts` from a tiny rehab-leaning catalog into richer static metadata for movement pattern, goal tags, difficulty tier, caution tags, traits, and preference tags
- added enough deterministic catalog entries to support recovery, general fitness, strength, hypertrophy, running, sport performance, and consistency drafts
- refactored `lib/starter-plan-generator.ts` around the approved bounded draft shapes: `simple_foundation`, `balanced_3_day`, `strength_full_body`, `upper_lower`, and `run_strength`
- added explicit goal-aware draft structures so running plans include run/walk or easy-run work, recovery plans stay conservative, strength/hypertrophy plans use real training patterns, sport performance includes lateral/athletic support, and consistency stays simple
- added coarse deterministic selection for available equipment, exercise dislikes, profile limitations, plan constraints, and preference/sport context
- kept running sessions represented as exercise-like plan items such as "Run/walk intervals" and "Easy run"; this is a temporary model compromise, not the long-term running design
- kept `getPlanDraftProvider("template")` as the guided generation path and left the LLM provider unavailable
- expanded Vitest coverage for all goal tracks, structure differences, goal fidelity, filtering behavior, metadata completeness, validation, and LLM unavailability
- updated `docs/current-task.md` so the next active implementation slice is Slice 5B
- updated `docs/roadmap.md` so Slice 5A is implemented locally and Slice 5B is next

Verification after Slice 5A:

- `npm run test` passed.
- `npm run typecheck` passed.

## Slice 5B1 Completed Locally

Slice 5B1 split profile/settings editing away from the guided edit-plan workflow and added a durable profile ownership surface:

- replaced the read-only `/settings` summary with a client-side profile settings form
- added `PATCH /api/profile` for authenticated profile updates without rerunning onboarding
- added `ProfileSettingsInput`, settings validation, and a pure update-value mapper for partial profile updates
- preserved the onboarding safeguard by keeping onboarding's "blank does not overwrite existing data" behavior unchanged
- made settings PATCH behavior explicit: omitted fields are preserved, while submitted `null`, blank strings, or empty arrays are treated as intentional clears
- extracted shared profile option lists into `lib/profile-options.ts` so onboarding and settings stay aligned
- left `/plans/new`, plan drafting, progression behavior, schema, and LLM/provider integration unchanged
- added Vitest coverage for settings validation and update-value mapping
- updated `docs/current-task.md` and `docs/roadmap.md` to split 5B into 5B1 and 5B2

Verification after Slice 5B1:

- `npm run test` passed.
- `npm run typecheck` passed.
- `npm run build` passed.

Post-QA findings after Slice 5B1:

- Profile/settings editing works, but validation messaging needs a small follow-up UX patch so invalid values such as negative age or weight show clear field-level guidance.
- Profile field ownership remains an open future product question. Training experience, current activity level, and similar fields are currently stored and editable as durable profile fields, but may later be treated as onboarding/setup inputs, plan-context inputs, or last-known context instead.
- No redesign of the profile model has been implemented or approved yet.

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

If needed, make a small Slice 5B1 follow-up patch for profile/settings field-level validation messaging:

- invalid values such as negative age or weight should show clear guidance near the relevant field
- do not redesign the profile model as part of that patch
- do not move fields between onboarding, settings, and plan setup unless explicitly scoped

The next major product slice remains Slice 5B2: guided edit-plan workflow. That likely needs persisted or reconstructable plan setup context before an existing generated plan can be safely reopened for guided editing.

## Known Risks And Assumptions

- The Slice 1 migration may still need to be applied in Supabase before deployed code can write the new columns.
- `workout_plans.progression_mode` is intentionally nullable at the database level; app code sets it when plan-goal context is available.
- Slice 3 defaults progression mode from goal type and light profile/constraint context; it does not expand progression algorithms.
- Ambiguous legacy profile goals should not be backfilled to `general_fitness`; only obvious goal text should receive `primary_goal_type`.
- Slice 2 preserves existing non-null profile fields when submitted optional onboarding values are null, empty strings, or empty arrays; Slice 5B1 adds explicit clearing only through settings profile edits.
- Slice 5B1 settings updates use partial PATCH semantics; omitted fields are preserved, while included empty values are intentional clears.
- Slice 5B1 needs a small validation UX follow-up if settings field errors are not clear enough to the user.
- Profile field ownership is not fully settled. Fields such as training experience and activity level may later move conceptually toward onboarding/setup context, plan-context inputs, or last-known context rather than permanent durable settings.
- Slice 5B2 guided plan editing likely needs persisted or reconstructable setup context because current saved plans do not retain every guided setup answer.
- Session save plus phase action updates are not fully atomic yet; a future SQL RPC would be stronger before broader public use.
- Slice 4.5 intentionally did not rename `plan_phases`, `phase-action`, `currentPhase`, `PhaseProgressPanel`, `PhaseProgressSummary`, `PlanPhase`, `StructuredPhaseInput`, existing phase-shaped payload fields, route/file names, or progression algorithm terms used internally.
- Slice 5A uses coarse deterministic filtering only; it is not a medical/PT rules engine and should not be treated as individualized clinical guidance.
- Running drafts still model run/walk and easy-run sessions as exercise entries because the app does not yet have a dedicated running-session domain model.
- Goal-aware template quality is stronger, but the static catalog remains intentionally small and code-owned until a later catalog/admin workflow exists.
- Existing old plans use default structured rule settings and keep old text criteria for display.
- The starter exercise catalog is static TypeScript data for now, not an admin-editable database table.
- Saved phase/workout/exercise deletes are hard deletes from the live plan structure, so browser testing should confirm history snapshots remain readable.
- Sessions with no recoverable phase snapshot do not count toward live phase progress.
- Logged-in browser testing is still needed for onboarding, guided draft generation, generated draft edit/save with Phase terminology, manual plan creation, plan activation, deletion/archive behavior, and mobile layout.
- Post-QA follow-up is still needed for settings/profile field-level validation messaging if not already patched.

## Important Files

- `app/plans/new/page.tsx`
- `components/plan-setup-wizard.tsx`
- `components/plan-builder-form.tsx`
- `app/api/plan-drafts/route.ts`
- `app/api/plans/route.ts`
- `app/api/profile/route.ts`
- `app/api/onboarding/route.ts`
- `app/settings/page.tsx`
- `app/onboarding/page.tsx`
- `app/page.tsx`
- `components/profile-settings-form.tsx`
- `lib/plan-write.ts`
- `lib/starter-plan-generator.ts`
- `lib/exercise-library.ts`
- `lib/plan-drafting/plan-draft-provider.ts`
- `lib/progression-mode.ts`
- `lib/profile-options.ts`
- `lib/profile-settings.ts`
- `lib/plan-labels.ts`
- `lib/types.ts`
- `lib/validation.ts`
- `lib/__tests__/profile-settings.test.ts`
- `lib/__tests__/plan-drafting-foundation.test.ts`
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

Most recent Slice 4.5 verification:

- Terminology search run locally; remaining lowercase `block` hits in app code are Tailwind/CSS display classes, and remaining "Block" docs hits are Slice 4 historical context.
- `npm run test` passed.
- `npm run typecheck` passed.
- `npm run build` passed.

Most recent Slice 5A verification:

- `npm run test` passed.
- `npm run typecheck` passed.
- `npm run build` passed.

Most recent Slice 5B1 verification:

- `npm run test` passed.
- `npm run typecheck` passed.
- `npm run build` passed.

Manual browser verification still needed:

- fresh auth and onboarding/profile creation
- guided draft generation and retry/error states
- generated draft quality across recovery, general fitness, strength, hypertrophy, running, sport performance, and consistency
- generated draft edit and save, including visible Phase terminology in the review builder
- compact/mobile UI for badges, cards, headers, and progress surfaces with the Phase wording
- manual `/plans/new?mode=manual` save
- dashboard, workout, and onboarding redirects when the user has a profile but no plan
- mobile layout usability
