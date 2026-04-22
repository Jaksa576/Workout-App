# Current Task

## Goal

Current active work: Slice 8, contextual dashboard and progression UX.

Slice 7, AI-assisted plan draft import, is complete locally. The next implementation slice is now contextual dashboard and progression UX.

## Recently Completed Slice

Slice 7, AI-assisted plan draft import, is implemented locally.

That slice delivered:

- a visible `Draft with AI` path inside `/plans/new`
- deterministic prompt generation from the v1 prompt contract
- strict paste-back import of structured markdown from the user's own external AI assistant
- validation and conversion of imported output into the existing review/edit/save flow
- a distinct `ai_import` plan creation source
- preservation of review-before-save and the existing plan write path

That slice did not deliver:

- provider-backed LLM integration
- onboarding redesign
- dashboard/progression redesign
- workout execution redesign
- progression-engine redesign

## Current Slice

Current active implementation slice: Slice 8, contextual dashboard and progression UX.

Slice 8 should build on the updated plan-creation foundation, including the new external AI-assisted draft-import path, without changing the underlying progression engine.

It should focus on:

- more contextual dashboard copy and next-step guidance
- clearer progression explanations tied to the active goal, phase, and recent sessions
- keeping explicit user-confirmed phase movement

It should not become:

- a workout execution redesign
- an onboarding redesign
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
- AI-assisted prompt generation and paste-back import through `/plans/new`
- compatible plan creation and update writes through `lib/plan-write.ts`
- presentation-only terminology refinement back to user-facing "Phase"
- lightweight app framing as "Adaptive Training" / "Structured plans that progress with you."
- expanded static exercise catalog metadata for deterministic generation
- goal-aware template drafts for recovery, general fitness, strength, hypertrophy, running, sport performance, and consistency
- settings/profile editing through `/settings` and `PATCH /api/profile`
- shared theme tokens, `html[data-theme]` support, and a single user-facing theme preference control in Settings
- refreshed saved-plan detail and editing surfaces that preserve the existing edit-versus-regenerate boundary

The app must remain fully functional without any LLM provider.

## Slice 8 Planned Scope

Contextual dashboard and progression UX should:

- build on the shared UI foundation from Slice 6 and the broadened plan-creation flows now available in Slice 7
- make dashboard copy and next-step prompts more contextual to the active goal, phase, and recent sessions
- improve progression explanations so users understand why a phase should advance, repeat, or deload
- keep explicit user-confirmed phase movement

Contextual dashboard and progression UX should not:

- redesign workout execution
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
- Do not redesign workout execution in this slice.
- Do not rename database tables, API routes, or compatibility fields such as `plan_phases`, `phase-action`, or `currentPhase`.
- Do not weaken Supabase auth or RLS assumptions.
- Keep changes migration-safe and scoped.
- Keep the separation between direct detail edits and setup/regenerate clear.
- Do not redesign the progression engine; dashboard explanations must adapt to the current system rather than redefining it.
- The next slice after this one is Slice 9, workout execution UX.

## Non-Goals

- No LLM/provider integration.
- No workout execution redesign.
- No onboarding AI flow or provider-backed AI work in this slice.
- No progression-engine redesign.
- No schema or RLS rewrites.
- No read-only plan sharing.

## Maintenance Note

After each completed slice, update this file so it points to the next active implementation slice rather than the slice that just finished.
