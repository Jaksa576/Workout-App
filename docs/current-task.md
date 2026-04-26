# Current Task

## Goal

Current active work: Slice 9C, Public Landing Route + Dashboard Route Split.

Slice 9B, Design System Foundation, is implemented locally and complete.

## Current Slice

Current active implementation slice: Slice 9C, Public Landing Route + Dashboard Route Split.

Slice 9C should focus on:

- moving the public landing page experience to `/`
- moving the authenticated dashboard to `/dashboard`
- preserving protected-route behavior and existing auth/proxy patterns
- keeping the route split migration-safe and explicit

The old narrow Slice 8 dashboard compacting follow-up remains superseded by the broader redesign program. A tiny blocking bug patch is still acceptable if needed, but it is not the mainline next slice.

Slice 9C should not become:

- a full public landing-page polish slice beyond the route boundary move
- a schema or RLS slice
- an auth model rewrite
- a progression-engine slice
- an LLM/provider integration slice
- a full authenticated app redesign

## Current Implementation Goals

- implement the public/authenticated route split documented in 9A
- preserve current auth protection and route safety during the split
- keep the adaptive-training engine and authenticated app behavior unchanged apart from route organization
- prepare the repo for later landing-page implementation and dashboard redesign

## Recently Completed Slice

Slice 9B, Design System Foundation, is implemented locally.

That slice delivered:

- extended semantic CSS tokens for warm public backgrounds, strong white surfaces, dark product-preview surfaces, primary/secondary accents, goal accents, soft borders, premium shadows, and focus-ring color
- preserved existing `html[data-theme]` support and the Settings-based local theme preference flow
- added reusable presentational primitives for shared redesign work, including `SurfaceCard`, `MetricCard`, `ProductPreviewCard`, `GoalIconCard`, and `LandingSection`
- evolved `AppLogo` with backward-compatible visual variants, including an app-icon-ready mark option
- refactored `SectionCard` to compose `SurfaceCard`
- updated `PageHero`, `ProgressBadge`, and `TimerCard` to use the shared foundation more cleanly
- used `MetricCard` for the small dashboard metric strip as a low-risk verification adoption

That slice did not deliver:

- route split
- public landing page implementation
- schema migrations
- Supabase RLS changes
- auth behavior changes
- LLM/provider integration
- progression-engine changes

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

Deferred follow-up from completed Slice 7 QA should stay outside the active Slice 9C scope unless explicitly re-scoped:

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

Slice 9C, Public Landing Route + Dashboard Route Split, is now the active next planned major slice.

Slice 9C should:

- move the public landing page boundary to `/`
- move the authenticated dashboard to `/dashboard`
- preserve protected-route logic and auth safety during the route split
- keep the current app functional while changing route organization

Slice 9C should not:

- implement the full landing-page redesign yet
- change progression algorithms
- weaken the saved-plan detail/edit/setup boundaries
- change auth behavior
- add LLM/provider integration
- add schema or RLS changes

## Likely Files To Inspect

- `docs/current-task.md`
- `docs/agent-handoff.md`
- `docs/roadmap.md`
- `docs/architecture.md`
- `AGENTS.md`
- `app/layout.tsx`
- `app/page.tsx`
- `components/app-shell.tsx`
- `proxy.ts`

## Constraints

- Do not change routes in this slice.
- Do not add LLM/provider integration.
- Do not change schema or Supabase RLS.
- Do not change auth behavior.
- Do not change progression behavior or the server-side progression engine.
- Do not rename database tables, API routes, or compatibility fields such as `plan_phases`, `phase-action`, or `currentPhase`.
- Do not weaken Supabase auth or RLS assumptions.
- Keep deferred Slice 7 QA ideas out of active Slice 9C scope unless explicitly re-scoped.
- Keep the separation between direct detail edits and setup/regenerate clear.
- Keep alternate/random workouts deferred future workout flexibility work.

## Non-Goals

- No route changes yet.
- No landing page implementation yet.
- No schema or RLS changes.
- No auth behavior changes.
- No progression-engine changes.
- No LLM/provider integration.
- No full authenticated app redesign in this slice.

## Maintenance Note

After Slice 9C is complete, update this file so it points to the next active implementation slice.
