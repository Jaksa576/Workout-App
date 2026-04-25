# Current Task

## Goal

Current active work: Slice 8, contextual dashboard and progression UX.

Slice 8 has been implemented locally, but QA identified a narrow dashboard-only follow-up patch that should land before the docs move on to Slice 9.

## Current Slice

Current active implementation slice: Slice 8, contextual dashboard and progression UX.

Slice 8 should focus on:

- more contextual dashboard copy and next-step guidance
- clearer progression explanations tied to the active goal, phase, and recent sessions
- keeping explicit user-confirmed phase movement
- a narrow post-QA dashboard polish follow-up before the slice is considered ready to move on

Slice 8 should not become:

- a workout execution redesign
- an onboarding redesign
- a plan creation redesign
- a saved-plan detail/edit/setup boundary rewrite
- a progression-algorithm rewrite unless explicitly re-scoped

Deferred follow-up from completed Slice 7 QA should stay outside the active Slice 8 scope unless explicitly re-scoped:

- broader `/plans/new` flow alignment and terminology cleanup
- assigned-day / prompt-specificity polish
- helper-text layout refinement
- exercise-media auto-population
- reducing repeated schedule-selection emphasis across Guided Setup, Manual Builder, and Draft with AI
- improving external-AI export / copy-paste ergonomics for the structured prompt-and-import handoff

## Immediate Slice 8 QA Follow-Up

QA feedback on the new dashboard was positive overall, but a narrow dashboard-only follow-up patch is still needed before this slice should advance.

That immediate follow-up should include:

- compacting the weekly preview / calendar summary so it uses less space
- considering a smaller preview, likely 5 days instead of 7, if that improves layout
- reducing the vertical space used by each day row
- preventing date text from wrapping onto two lines
- using a more compact single-line date treatment such as `4/26`
- removing the repeated `Keep the streak going` copy from adjacent middle dashboard cards
- keeping a single positive section-level affirmation where helpful, while making card-level copy short and useful

That immediate follow-up should not include:

- alternate/random workout support
- workout execution redesign
- onboarding changes
- plan creation or plan editing redesign
- progression-engine changes beyond narrow dashboard explanation/display polish
- schema or RLS changes
- LLM/provider integration

## Recently Implemented Slice

Slice 8, contextual dashboard and progression UX, is implemented locally.

That slice delivered:

- a workout-first dashboard centered on "Your workout for today"
- a compact 7-day "This week" preview based on active-phase workout scheduling
- safe weekly-preview fallback copy when workout-specific schedules are missing
- compact workout activity, phase progress, and symptom/pain trend summaries
- action-oriented progression prompts that route to the existing user-confirmed plan progress surface
- removal of prominent normal "ready" status noise from the dashboard
- an active-phase sync fix so dashboard progression copy, phase progress, and progression CTA derive from the same active plan, active phase, and `calculatePhaseProgress()` result

That slice is implemented locally, but the narrow QA follow-up above is still outstanding.

That slice did not deliver:

- provider-backed LLM integration
- onboarding redesign
- workout execution redesign
- plan creation or plan editing redesign
- setup/regenerate resurfacing
- schema migrations or Supabase RLS changes
- progression-engine rewrite
- alternate/random workout support

## Current Context

Slices 1 through 5B3 are implemented locally, along with the post-5B3 cleanup patch, UI Overhaul Phase 1, UI Polish and Theme Refinement, Slice 7 AI-assisted draft import, and the initial Slice 8 contextual dashboard/progression UX implementation:

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
- AI-assisted prompt generation and paste-back import through `/plans/new`
- compatible plan creation and update writes through `lib/plan-write.ts`
- presentation-only terminology refinement back to user-facing "Phase"
- lightweight app framing as "Adaptive Training" / "Structured plans that progress with you."
- expanded static exercise catalog metadata for deterministic generation
- goal-aware template drafts for recovery, general fitness, strength, hypertrophy, running, sport performance, and consistency
- settings/profile editing through `/settings` and `PATCH /api/profile`
- shared theme tokens, `html[data-theme]` support, and a single user-facing theme preference control in Settings
- refreshed saved-plan detail and editing surfaces that preserve the existing edit-versus-regenerate boundary
- workout-first dashboard context, weekly preview, activity summary, and progression prompts derived from active-phase progression state

The app must remain fully functional without any LLM provider.

## Next Major Slice

Slice 9, workout execution UX, remains the next major slice after the narrow Slice 8 QA follow-up is complete.

Slice 9 should:

- build on the shared UI foundation and Slice 8 dashboard context
- improve the in-session workout and check-in experience
- keep workout history readable after plan edits
- preserve server-side progression evaluation and explicit user-confirmed phase movement

Slice 9 should not:

- redesign onboarding or guided setup flows
- change progression algorithms beyond narrow explanation/display work unless explicitly re-scoped
- weaken the saved-plan detail/edit/setup boundaries
- add LLM/provider integration

## Likely Files To Inspect

- `app/page.tsx`
- `lib/dashboard.ts`
- `lib/data.ts`
- `lib/types.ts`
- `docs/current-task.md`
- `docs/agent-handoff.md`
- `docs/roadmap.md`
- `docs/architecture.md`

## Constraints

- Do not add LLM/provider integration.
- Do not redesign onboarding broadly.
- Do not redesign workout execution in this slice.
- Do not redesign plan creation or plan editing in this slice.
- Do not rename database tables, API routes, or compatibility fields such as `plan_phases`, `phase-action`, or `currentPhase`.
- Do not weaken Supabase auth or RLS assumptions.
- Keep changes migration-safe and scoped.
- Keep the separation between direct detail edits and setup/regenerate clear.
- Do not claim architecture changes that did not happen.
- Keep the Slice 8 QA follow-up narrow and dashboard-only.
- Keep deferred Slice 7 QA ideas and deferred alternate/random workout ideas out of the active Slice 8 follow-up scope unless explicitly re-scoped.

## Non-Goals

- No LLM/provider integration.
- No onboarding redesign.
- No workout execution redesign.
- No plan creation redesign.
- No progression-engine redesign beyond narrow explanation/display work.
- No schema or RLS rewrites.
- No read-only plan sharing.

## Maintenance Note

After the Slice 8 QA follow-up is complete and authenticated QA is in a good state, update this file so it points to Slice 9 as the active implementation slice.
