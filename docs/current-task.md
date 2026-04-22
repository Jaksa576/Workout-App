# Current Task

## Goal

Current active work: Slice 7, AI-assisted plan draft import.

Slice 6.5, UI Polish and Theme Refinement, is complete locally. The next implementation slice is now the AI-assisted draft-import slice. The following slice after that becomes contextual dashboard and progression UX.

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

Current active implementation slice: Slice 7, AI-assisted plan draft import.

Slice 7 should add an optional external-AI-assisted draft path inside `/plans/new` while preserving the existing setup -> draft -> review/edit -> save contract.

It should focus on:

- a `Draft with AI` path inside `/plans/new`
- generating a copyable prompt from structured plan setup inputs
- accepting pasted structured AI output from the user's own external assistant
- validating and normalizing imported output into the existing review/edit/save flow
- requiring review before save while keeping the app as the system of record

It should not become:

- a provider-backed LLM integration
- an onboarding redesign or an AI-onboarding path
- a workout execution redesign
- a contextual dashboard/progression slice
- a progression-engine redesign
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

AI-assisted plan draft import should:

- stay inside `/plans/new` and build on the existing guided setup flow
- generate a structured prompt from plan setup inputs for the user's own external AI assistant
- accept pasted structured AI output and validate it before it becomes a draft
- normalize valid imported output into the existing review/edit/save flow
- reuse the current draft provider boundary, draft validation expectations, and plan write architecture where practical
- require review before saving any imported draft

AI-assisted plan draft import should not:

- integrate an LLM provider or server-side API keys
- move AI assistance into onboarding
- redesign workout execution
- redesign dashboard/progression UX; that is the next slice after this one
- redesign the progression engine or algorithms
- weaken the saved-plan detail/edit/setup boundaries that are now clearer after Slice 6

## Likely Files To Inspect

- `app/plans/new/page.tsx`
- `components/plan-setup-wizard.tsx`
- `lib/plan-drafting/plan-draft-provider.ts`
- `lib/validation.ts`
- `lib/plan-write.ts`
- `docs/current-task.md`
- `docs/agent-handoff.md`
- `docs/roadmap.md`
- `docs/architecture.md`

## Constraints

- Do not add LLM/provider integration.
- Do not redesign onboarding broadly or move AI into onboarding.
- Do not redesign workout execution or progression UX in this slice.
- Do not rename database tables, API routes, or compatibility fields such as `plan_phases`, `phase-action`, or `currentPhase`.
- Do not weaken Supabase auth or RLS assumptions.
- Keep changes migration-safe and scoped.
- Keep the separation between direct detail edits and setup/regenerate clear.
- Do not redesign the progression engine; imported drafts must adapt to the current system rather than redefining it.
- The next slice after this one is Slice 8, contextual dashboard and progression UX.

## Non-Goals

- No LLM/provider integration.
- No onboarding AI flow.
- No workout execution redesign.
- No contextual dashboard/progression redesign in this slice.
- No progression-engine redesign.
- No schema or RLS rewrites.
- No read-only plan sharing.

## Maintenance Note

After each completed slice, update this file so it points to the next active implementation slice rather than the slice that just finished.
