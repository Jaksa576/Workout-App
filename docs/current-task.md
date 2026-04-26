# Current Task

## Goal

Current production follow-up work: complete locally.

Slice 9C, Public Landing Route + Dashboard Route Split, is implemented locally, including a narrow pre-production follow-up patch.

## Current Slice

Current next planned implementation slice: Slice 9D, Public Landing Page Implementation.

Slice 9D should focus on:

- expanding the new public landing scaffold into a more polished landing page
- building on the 9B design-system primitives and the 9C public route boundary
- keeping marketing content static and deterministic
- preserving the authenticated app boundary and dashboard route split from 9C

The old narrow Slice 8 dashboard compacting follow-up remains superseded by the broader redesign program. The small 9C production follow-up patch restored the authenticated app shell/header/nav on app routes without starting 9D.

Slice 9D should not become:

- a route-split slice
- a schema or RLS slice
- an auth model rewrite
- a progression-engine slice
- an LLM/provider integration slice
- a full authenticated app redesign

## Current Implementation Goals

- turn the public landing scaffold into a stronger marketing entry point
- preserve the new `/` public and `/dashboard` authenticated boundary
- keep public landing content free of authenticated Supabase data
- improve signed-in public CTA behavior with auth-aware options such as `Continue your plan` or `Dashboard`
- prepare the repo for later app icon integration and broader authenticated redesign slices

## Recently Completed Slice

Slice 9C, Public Landing Route + Dashboard Route Split, is implemented locally.

That slice delivered:

- moved the authenticated dashboard from `/` to `/dashboard` without changing its training, progression, or onboarding behavior
- replaced `/` with a public landing scaffold that uses static/deterministic marketing content and 9B primitives
- kept `/dashboard`, `/onboarding`, `/plans`, `/plans/new`, `/plans/[planId]`, `/workout`, and `/settings` protected
- updated dashboard-intent redirects and links from `/` to `/dashboard`
- updated the app shell so signed-in users visiting `/` see the public landing scaffold without the authenticated app shell
- added `?mode=sign-up` support on `/login` to preselect the existing sign-up state for landing-page CTAs
- restored authenticated app shell/header/nav rendering on `/dashboard`, `/plans`, `/workout`, `/settings`, and other authenticated app routes through a small pre-production follow-up patch
- accepted the current signed-in public CTA behavior for 9C; landing CTAs should become more auth-aware in 9D rather than changing auth flow in this patch

That slice did not deliver:

- full landing page implementation
- app icon integration
- authenticated app shell redesign
- dashboard redesign
- schema migrations
- Supabase RLS changes
- auth-model rewrites
- LLM/provider integration
- progression-engine changes

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

Deferred follow-up from completed Slice 7 QA should stay outside the active Slice 9D scope unless explicitly re-scoped:

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

Slice 9D, Public Landing Page Implementation, is now the next planned major slice and is not started by this follow-up patch.

Slice 9D should:

- build out the public landing page on top of the new public `/` route
- preserve the authenticated dashboard at `/dashboard`
- keep landing-page preview content static and deterministic
- improve public presentation without changing training/product behavior

Slice 9D should not:

- undo or revisit the route split itself unless a bug requires a narrow patch
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
- `app/page.tsx`
- `components/*`
- `app/manifest.ts`

## Constraints

- Do not change the route boundary in this slice unless fixing a narrow bug.
- Do not add LLM/provider integration.
- Do not change schema or Supabase RLS.
- Do not change auth behavior.
- Do not change progression behavior or the server-side progression engine.
- Do not rename database tables, API routes, or compatibility fields such as `plan_phases`, `phase-action`, or `currentPhase`.
- Do not weaken Supabase auth or RLS assumptions.
- Keep deferred Slice 7 QA ideas out of active Slice 9D scope unless explicitly re-scoped.
- Keep the separation between direct detail edits and setup/regenerate clear.
- Keep alternate/random workouts deferred future workout flexibility work.

## Non-Goals

- No authenticated app redesign yet.
- No schema or RLS changes.
- No auth behavior changes.
- No progression-engine changes.
- No LLM/provider integration.
- No dashboard redesign in this slice.

## Maintenance Note

After Slice 9D is complete, update this file so it points to the next active implementation slice.
