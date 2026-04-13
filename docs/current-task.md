# Current Task

## Goal

Move the app from “user builds everything from scratch” toward a first-user-ready flow:

- New users complete lightweight onboarding instead of landing on an empty dashboard.
- Users can create a guided starter plan without AI or paid token usage.
- Plan creation supports multiple phases and multiple workouts per phase.
- Phase progression uses structured presets, not free-text rules.
- The workout page recommends the right active-phase workout and lets users choose other current-phase workouts.
- Phase advancement is explicit and user-confirmed instead of silent.
- Users can clean up plan mistakes by deleting draft or saved phases, workouts, and exercises.
- Users can choose which incomplete plan is active.

## Requirements

- Add `profiles.onboarding_completed_at` and route users without onboarding or a usable active plan into `/onboarding`.
- Keep existing users with an active plan on the dashboard after migration backfill.
- Keep the existing Plan -> Phase -> Workout -> Exercise table model.
- Add structured schedule and progression fields while keeping old text fields for compatibility.
- Use a static starter exercise catalog for v1.
- Keep AI draft architecture disabled by default and fall back to the guided starter plan.
- Evaluate progression server-side after check-in, but do not update `current_phase_id` automatically.
- Show phase progress with clean sessions, pain flags, and next/previous phase actions.
- Let users mark a final completed plan as complete without deleting it.
- Keep saved workout history readable when a saved phase/workout/exercise is deleted from the live plan structure.
- Keep manual phase movement on the plan page. The workout page should only prompt users to review the plan when advancement criteria are met.
- Scope phase progress to sessions completed in that exact phase, not older sessions from prior phases.

## Assumptions

- The database migration must be applied before testing the deployed app.
- Static catalog exercises are acceptable for v1.
- Phase changes now happen through a focused action route; session save no longer silently advances phases.
- Whole-plan delete is a soft archive; phase/workout/exercise deletes are real deletes from the plan structure.
- Workout and exercise names are snapshotted onto history rows so old logs can remain useful after structure cleanup.
- Old session phase snapshots are backfilled from the current workout template link when possible.

## Test Plan

- Run `npm run typecheck`.
- Run `npm run build`.
- Test a new user with no onboarding and no plan.
- Test an existing user with an active plan after migration.
- Create a guided starter plan from onboarding.
- Create a manual structured plan with multiple phases and workouts.
- Save a workout check-in and confirm the progression recommendation/reason is visible.
- Confirm AI draft stays unavailable and does not call any provider.
- Confirm `/workout` shows recommended and other active-phase workouts.
- Confirm move next, move anyway, return previous, and mark complete workflows.
- Confirm draft delete buttons work and the last phase/workout/exercise cannot be deleted.
- Confirm saved exercise/workout/phase deletes work and past history remains available.
- Confirm `Make Active Plan` switches the dashboard/workout source.
- Confirm phase progress percent appears on dashboard and plan detail.
- Confirm moving to a new phase starts progress at 0% until that phase has its own completed sessions.
