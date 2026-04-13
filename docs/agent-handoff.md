# Agent Handoff

Use this file to help the next coding agent understand where work stopped.

## Current Feature

First-user onboarding, guided plan builder, starter exercise library, structured progression, explicit phase advancement, and plan management cleanup.

## Current Status

- YouTube v1 was manually verified by the user.
- Onboarding/progression feature is implemented locally and needs logged-in browser testing.
- Workout selection supports active-phase recommendations and other workouts in the current phase.
- Plan management now includes make-active plan controls, plan archive, hard delete for phases/workouts/exercises, and phase progress percent UI.
- Manual phase actions are on the plan page; the workout page only prompts the user to review the plan when criteria are met.
- The phase-action API now allows a next-phase move whenever a next phase exists; the UI remains responsible for showing the criteria-met versus manual override confirmation path.
- Phase progress now counts only sessions with `phase_id_at_completion` matching the current phase, and a follow-up migration backfills old sessions from their workout template phase.
- A focused UI polish pass tightened mobile spacing, button alignment, hover states, logo/header sizing, and shorter copy across dashboard, plans, workout, onboarding, and shared cards.
- `npm run typecheck` passed after the UI polish pass.
- `npm run build` passed after the UI polish pass.

## Last Completed Step

Added schema/migration changes, onboarding UI/API, structured plan creation, a starter exercise catalog, guided starter plan generation, server-side progression evaluation, explicit phase actions, plan section delete APIs, make-active plan API, and progress indicators.

## Next Best Step

1. Apply `supabase/migrations/20260412160000_onboarding_progression.sql` and `supabase/migrations/20260412170000_phase_session_scoping.sql` in Supabase, or rerun `supabase/schema.sql` for a fresh local database.
2. Test a new-user onboarding flow with guided starter plan creation.
3. Test an existing user with an active plan still reaches the dashboard after migration backfill.
4. Test the plan builder with multiple phases/workouts, including draft delete buttons.
5. Test saved plan deletion for an exercise, workout, and phase.
6. Test make-active plan, plan archive, manual phase movement, previous phase movement, and plan completion.
7. Review dashboard, plans, workout, onboarding, and plan builder on mobile width for spacing and button alignment.

## Open Issues / Risks

- The feature depends on a database migration before deployed code can read/write the new columns.
- Session save plus phase action updates are not fully atomic yet; a future SQL RPC would be stronger before broad public use.
- Existing old plans use default structured rule settings and keep the old text criteria for display.
- The starter exercise catalog is static TypeScript data for v1, not an admin-editable database table.
- AI draft architecture is a disabled stub, so no paid API calls happen by default.
- Plan completion uses `completed_at` and keeps plan data for reference.
- Whole-plan archive uses `archived_at`; archived plans are hidden from active plan recommendations.
- Saved phase/workout/exercise deletes are hard deletes, so manual browser testing should confirm history snapshots still show readable past workout/exercise names.
- Sessions with no recoverable phase snapshot do not count toward live phase progress.
- The polish pass was checked by typecheck/build, but still needs visual browser review on a real mobile viewport.

## Important Files

- `app/onboarding/page.tsx`
- `app/api/onboarding/route.ts`
- `components/onboarding-flow.tsx`
- `components/plan-builder-form.tsx`
- `app/api/plans/route.ts`
- `app/api/sessions/route.ts`
- `app/api/plans/[planId]/phase-action/route.ts`
- `app/api/plans/[planId]/activate/route.ts`
- `app/api/plans/[planId]/route.ts`
- `app/api/phases/[phaseId]/route.ts`
- `app/api/workouts/[workoutId]/route.ts`
- `app/api/exercises/[exerciseId]/route.ts`
- `components/phase-progress-panel.tsx`
- `components/plan-management-actions.tsx`
- `components/plan-list-actions.tsx`
- `lib/plan-write.ts`
- `lib/progression.ts`
- `lib/starter-plan-generator.ts`
- `lib/exercise-library.ts`
- `lib/ai/plan-draft-provider.ts`
- `lib/data.ts`
- `lib/types.ts`
- `lib/validation.ts`
- `supabase/schema.sql`
- `supabase/migrations/20260412160000_onboarding_progression.sql`
- `supabase/migrations/20260412170000_phase_session_scoping.sql`

## Verification Steps

- `npm run typecheck`
- `npm run build`
- Manual: new user without onboarding lands on `/onboarding`.
- Manual: guided starter plan creates a usable active plan without AI.
- Manual: manual setup routes to `/plans/new`.
- Manual: existing active-plan user lands on dashboard.
- Manual: structured plan builder saves multiple phases/workouts.
- Manual: check-in saves progression decision/reason and only advances phase when criteria are met.
- Manual: phase does not advance automatically after check-in.
- Manual: `Move to Next Phase`, `Move Anyway`, `Return to Previous Phase`, and `Mark Plan Complete` behave correctly.
- Manual: moving to the next phase does not show the stale “not met” error when the progress panel says the phase is ready.
- Manual: after moving into a new phase, phase progress starts at 0% until a workout is logged in that phase.
- Manual: make another incomplete plan active and confirm dashboard/workout switch to it.
- Manual: delete a saved exercise/workout/phase and confirm it leaves the plan without deleting past session history.
- Manual: archive a plan and confirm it no longer drives dashboard/workout recommendations.
