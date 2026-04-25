# Current Task

## Goal

Current active work: Slice 9, workout execution UX.

Slice 8, contextual dashboard and progression UX, is implemented locally and accepted after the narrow QA follow-up patch.

## Current Slice

Current active implementation slice: Slice 9, workout execution UX.

Slice 9 should focus on:

- improving in-session workout usability
- improving logging and check-in flow clarity
- keeping workout history snapshots readable after plan edits
- building on the Slice 6 UI foundation and Slice 8 dashboard context
- preserving server-side progression evaluation and explicit user-confirmed phase movement

Slice 9 should not become:

- an onboarding redesign
- a guided setup redesign
- a plan creation redesign
- a saved-plan detail/edit/setup boundary rewrite
- LLM/provider integration
- schema or RLS changes
- a progression-algorithm rewrite unless explicitly re-scoped

Deferred follow-up from completed Slice 7 QA should stay outside the active Slice 9 scope unless explicitly re-scoped:

- broader `/plans/new` flow alignment and terminology cleanup
- assigned-day / prompt-specificity polish
- helper-text layout refinement
- exercise-media auto-population
- reducing repeated schedule-selection emphasis across Guided Setup, Manual Builder, and Draft with AI
- improving external-AI export / copy-paste ergonomics for the structured prompt-and-import handoff

## Recently Completed Slice

Slice 8, contextual dashboard and progression UX, is implemented locally and QA accepted.

That slice delivered:

- a workout-first dashboard centered on "Your workout for today"
- a compact 5-day "This week" preview based on active-phase workout scheduling
- compact `M/D` date treatment with right-aligned date pills in the weekly preview
- reduced weekly preview height so it no longer dominates the dashboard
- compact workout activity, phase progress, and symptom/pain trend summaries
- action-oriented progression prompts that route to the existing user-confirmed plan progress surface
- removal of repeated `Keep the streak going` copy from adjacent middle dashboard cards while keeping it as a single section-level heading
- preserved progression title, detail, CTA, and active-phase sync behavior derived from the same active plan, active phase, and `calculatePhaseProgress()` result

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

Slices 1 through 5B3 are implemented locally, along with the post-5B3 cleanup patch, UI Overhaul Phase 1, UI Polish and Theme Refinement, Slice 7 AI-assisted draft import, and Slice 8 contextual dashboard/progression UX with its accepted QA follow-up:

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
- workout-first dashboard context, compact weekly preview, activity summary, and progression prompts derived from active-phase progression state

The app must remain fully functional without any LLM provider.

## Next Major Slice

Slice 9, workout execution UX, is now the active next planned major slice.

Slice 9 should:

- improve the in-session workout and check-in experience
- keep workout history readable after plan edits
- build on the current dashboard context, UI foundation, and existing progression engine
- preserve explicit user-confirmed phase movement

Slice 9 should not:

- redesign onboarding or guided setup flows
- change progression algorithms beyond narrow explanation/display work unless explicitly re-scoped
- weaken the saved-plan detail/edit/setup boundaries
- add LLM/provider integration
- add schema or RLS changes

## Likely Files To Inspect

- `components/workout-flow.tsx`
- `components/workout-checklist.tsx`
- `components/check-in-form.tsx`
- `app/workout/page.tsx`
- `app/api/sessions/route.ts`
- `lib/data.ts`
- `docs/current-task.md`
- `docs/agent-handoff.md`
- `docs/roadmap.md`
- `docs/architecture.md`

## Constraints

- Do not add LLM/provider integration.
- Do not redesign onboarding broadly.
- Do not redesign guided setup or plan creation.
- Do not rename database tables, API routes, or compatibility fields such as `plan_phases`, `phase-action`, or `currentPhase`.
- Do not weaken Supabase auth or RLS assumptions.
- Keep changes migration-safe and scoped.
- Keep the separation between direct detail edits and setup/regenerate clear.
- Do not claim architecture changes that did not happen.
- Keep deferred Slice 7 QA ideas out of active Slice 9 scope unless explicitly re-scoped.
- Keep alternate/random workouts deferred future workout flexibility work.

## Non-Goals

- No LLM/provider integration.
- No onboarding redesign.
- No guided setup redesign.
- No plan creation redesign.
- No progression-engine redesign beyond narrow explanation/display work.
- No schema or RLS rewrites.
- No read-only plan sharing.

## Maintenance Note

After Slice 9 is complete, update this file so it points to the next active implementation slice.
