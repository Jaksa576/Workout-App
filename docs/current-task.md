# Current Task

## Goal

Current active work: Slice 9A, UI Redesign Direction, Public Landing, and App Icon Planning.

This is a docs-only planning slice and must not modify application code.

## Current Slice

Current active implementation slice: Slice 9A, UI Redesign Direction, Public Landing, and App Icon Planning.

Slice 9A should focus on:

- locking the selected clean premium consumer fitness visual direction in repo docs
- defining `/` as the intended future public landing page route
- defining `/dashboard` as the intended future authenticated dashboard route
- defining the selected app icon direction for later PWA and app-store asset work
- defining mobile-first landing page requirements and the full redesign sequence before workout execution UX

The old narrow Slice 8 dashboard compacting follow-up is intentionally no longer the active priority because the dashboard is being redesigned under the new visual system. A tiny blocking bug patch is still acceptable if needed, but it is not the mainline next slice.

Slice 9A should not become:

- a code implementation slice
- a route-change slice
- a schema or RLS slice
- a progression-engine slice
- an LLM/provider integration slice
- a broad redesign implementation pass

## Current Implementation Goals

- lock the selected design direction in docs
- define public `/` and authenticated `/dashboard` direction
- define the app icon direction
- define mobile-first public landing page requirements
- define the full redesign sequence from 9A through 9J

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
- public landing page work
- authenticated route split work
- app icon integration
- full dashboard redesign under the new visual system
- schema migrations or Supabase RLS changes
- progression-engine rewrite
- alternate/random workout support

Deferred follow-up from completed Slice 7 QA should stay outside the active Slice 9A scope unless explicitly re-scoped:

- broader `/plans/new` flow alignment and terminology cleanup
- assigned-day / prompt-specificity polish
- helper-text layout refinement
- exercise-media auto-population
- reducing repeated schedule-selection emphasis across Guided Setup, Manual Builder, and Draft with AI
- improving external-AI export / copy-paste ergonomics for the structured prompt-and-import handoff

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

Slice 9A, UI Redesign Direction, Public Landing, and App Icon Planning, is now the active next planned major slice.

Slice 9A should:

- document the selected public landing page direction at `/`
- document the authenticated dashboard direction at `/dashboard`
- document the visual system for the public landing page and future authenticated redesign
- document the app icon direction and later asset-integration intent
- define the redesign implementation order through 9J before workout execution UX work begins

Slice 9A should not:

- modify application code
- change route behavior yet
- change progression algorithms
- weaken the saved-plan detail/edit/setup boundaries
- add LLM/provider integration
- add schema or RLS changes

## Likely Files To Inspect

- `docs/current-task.md`
- `docs/agent-handoff.md`
- `docs/roadmap.md`
- `docs/architecture.md`
- `AGENTS.md`

## Constraints

- Do not modify application code in this slice.
- Do not change routes in this slice.
- Do not add LLM/provider integration.
- Do not change schema or Supabase RLS.
- Do not change progression behavior or the server-side progression engine.
- Do not rename database tables, API routes, or compatibility fields such as `plan_phases`, `phase-action`, or `currentPhase`.
- Do not weaken Supabase auth or RLS assumptions.
- Keep the route split documentation-only for now.
- Keep the separation between direct detail edits and setup/regenerate clear.
- Do not claim implementation changes that did not happen.
- Keep deferred Slice 7 QA ideas out of active Slice 9A scope unless explicitly re-scoped.
- Keep alternate/random workouts deferred future workout flexibility work.

## Non-Goals

- No code changes.
- No route changes yet.
- No schema or RLS changes.
- No progression-engine changes.
- No LLM/provider integration.
- No broad implementation in this docs slice.

## Maintenance Note

After Slice 9A is complete, update this file so it points to the next active implementation slice.
