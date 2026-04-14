# Current Task

## Goal

Implement Slice 5A of the goal-based adaptive training refactor: goal-aware templates, richer exercise metadata, and better deterministic defaults.

Slice 4.5 is the immediately previous slice and should be treated as completed locally: user-facing plan/workout/progress copy now uses concise "Phase" language again, the working product frame is "Adaptive Training", and internal database/API compatibility names remain unchanged.

## Current Context

Slices 1 through 4.5 are implemented locally:

- richer profile and plan metadata columns
- nullable `workout_plans.progression_mode`
- `exercise_entries.source_exercise_id`
- AI-neutral plan draft provider
- onboarding/profile separation for durable profile data
- guided `/plans/new` plan setup with review-before-save drafts
- template-only draft generation through `POST /api/plan-drafts`
- presentation-only terminology refinement back to user-facing "Phase"
- lightweight app framing as "Adaptive Training" / "Structured plans that progress with you."

The app should continue to work without any LLM provider.

## Scope

Slice 5A should improve deterministic template draft quality and catalog coverage for the supported goal tracks:

- recovery / rehab
- general fitness
- strength
- hypertrophy
- running
- sport performance
- consistency / habit building

Use profile and plan setup context to make template drafts feel more specific without changing the review/edit/save contract.

## Likely Files Touched

- `lib/exercise-library.ts`
- `lib/starter-plan-generator.ts`
- `lib/plan-drafting/plan-draft-provider.ts`
- `components/plan-setup-wizard.tsx`
- `lib/__tests__/plan-drafting-foundation.test.ts`
- `docs/current-task.md`
- `docs/agent-handoff.md`
- `docs/roadmap.md`

## Constraints

- Do not add LLM/provider integration.
- Do not redesign onboarding.
- Do not rename database tables, API routes, or compatibility fields such as `plan_phases`, `phase-action`, or `currentPhase`.
- Do not expand progression algorithms.
- Do not implement the Slice 5B profile/settings or guided edit-plan workflow yet.
- Do not make database schema changes unless a very small additive field is clearly required.
- Do not weaken Supabase auth or RLS assumptions.
- Keep changes migration-safe and scoped.

## Acceptance Criteria

- The template draft provider remains the only guided draft path.
- Drafts are more goal-aware for the supported tracks.
- Exercise selection better respects available equipment, limitations, dislikes, and plan-specific constraints.
- Generated drafts remain valid `StructuredPlanInput` values and are still reviewable/editable before save.
- Saved guided drafts still persist through the existing `/api/plans` write path.
- Manual plan creation still works.
- The app remains functional without LLM configuration.
- `npm run test`, `npm run typecheck`, and `npm run build` pass for code changes.
- Logged-in browser testing notes are added to `docs/agent-handoff.md`.

## Non-Goals

- No LLM/provider integration.
- No progression behavior expansion.
- No broad internal phase terminology renaming.
- No profile/settings workflow or guided edit-plan workflow; that is Slice 5B.
- No read-only plan sharing.
- No exercise substitutions.

## Maintenance Note

After each completed slice, update this file so it points to the next active implementation slice rather than the slice that just finished.
