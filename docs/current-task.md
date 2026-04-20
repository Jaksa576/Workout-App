# Current Task

## Goal

Current active work: Slice 7, contextual dashboard and progression UX.

Slice 6.5, UI Polish and Theme Refinement, is complete locally. The next major implementation slice is now Slice 7.

Manual browser QA still remains for the final Slice 6.5 contrast checks on Settings, Plans, and the theme selector in both dark and light mode.

## Recently Completed Slice

Slice 6.5, UI Polish and Theme Refinement, is implemented locally as the narrow follow-up patch after Slice 6.

That patch delivered:

- dark-mode contrast and readability fixes on the Slice 6 saved-plan surfaces
- tighter semantic theme tokens and clearer shared badge/card contrast in dark mode
- relocation of the user-facing theme preference control from the authenticated shell into Settings
- preservation of the existing local persisted theme override, `html[data-theme]` behavior, and no-flash theme bootstrap

That patch did not deliver:

- dashboard redesign
- workout execution redesign
- exercise media/instruction work
- onboarding/setup flow redesign
- schema, API, or route reorganization

## Current Slice

Current active implementation slice: Slice 7, contextual dashboard and progression UX.

Slice 7 should build on the visual foundation from Slice 6 and the cleanup from Slice 6.5.

It should focus on:

- more contextual dashboard copy and next-step guidance
- clearer progression explanations tied to the active goal, phase, and recent sessions
- keeping explicit user-confirmed phase movement

It should not become:

- a workout execution redesign
- an exercise media/instruction slice
- an onboarding/setup redesign
- a rewrite of the saved-plan detail/edit/setup boundaries
- a progression-algorithm rewrite unless explicitly re-scoped

## Current Context

Slices 1 through 5B3 are implemented locally, along with the post-5B3 cleanup patch and UI Overhaul Phase 1:

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
- compatible plan creation and update writes through `lib/plan-write.ts`
- presentation-only terminology refinement back to user-facing "Phase"
- lightweight app framing as "Adaptive Training" / "Structured plans that progress with you."
- expanded static exercise catalog metadata for deterministic generation
- goal-aware template drafts for recovery, general fitness, strength, hypertrophy, running, sport performance, and consistency
- settings/profile editing through `/settings` and `PATCH /api/profile`
- shared theme tokens, `html[data-theme]` support, and a single user-facing theme preference control in Settings
- refreshed saved-plan detail and editing surfaces that preserve the existing edit-versus-regenerate boundary

The app must remain fully functional without any LLM provider.

## Slice 7 Planned Scope

Contextual dashboard and progression UX should:

- build on the shared UI foundation from Slice 6 instead of creating a separate visual system
- make dashboard copy and next-step prompts more contextual to the active goal, phase, and recent sessions
- improve progression explanations so users understand why a phase should advance, repeat, or deload
- keep explicit user-confirmed phase movement

Contextual dashboard and progression UX should not:

- redesign workout execution
- redesign exercise media/instruction surfaces
- redesign onboarding or guided setup flows
- change progression algorithms beyond narrow explanation/display work unless explicitly re-scoped
- weaken the saved-plan detail/edit/setup boundaries that are now clearer after Slice 6

## Likely Files To Inspect

- `app/page.tsx`
- `components/phase-progress-panel.tsx`
- `lib/data.ts`
- `lib/types.ts`
- `docs/current-task.md`
- `docs/agent-handoff.md`
- `docs/roadmap.md`
- `docs/architecture.md`

## Constraints

- Do not add LLM/provider integration.
- Do not redesign onboarding broadly.
- Do not redo the saved-plan UI foundation unless a narrow dashboard adjustment truly requires it.
- Do not rename database tables, API routes, or compatibility fields such as `plan_phases`, `phase-action`, or `currentPhase`.
- Do not weaken Supabase auth or RLS assumptions.
- Keep changes migration-safe and scoped.
- Keep the separation between direct detail edits and setup/regenerate clear.
- Do not do workout execution redesign here; that is Slice 8.
- Do not do exercise media/instruction work here; that is Slice 9.

## Non-Goals

- No LLM/provider integration.
- No workout execution redesign.
- No exercise media/instruction layer work.
- No schema or RLS rewrites.
- No read-only plan sharing.

## Maintenance Note

After each completed slice, update this file so it points to the next active implementation slice rather than the slice that just finished.
