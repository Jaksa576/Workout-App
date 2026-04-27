# Current Task

## Goal

Current production follow-up work: complete locally through Slice 9G.

Slice 9D, Public Landing Page Implementation, is implemented locally with an immediate visual QA polish patch. Slice 9E, App Icon / PWA Asset Integration, is also implemented locally as part of the same polish pass. Slice 9F, Authenticated App Shell Redesign, is implemented locally. Slice 9G, Dashboard Redesign, is implemented locally.

## Current Slice

Current next planned implementation slice: Slice 9H, Plans / Phase UX Redesign, after the Slice 9G post-slice review and pushed branch.

Slice 9H should focus on:

- redesigning the plans list, plan detail, and phase/workout hierarchy around the selected visual system
- making active plan state, current phase, workouts under phases, and plan actions easier to understand
- preserving `/`, `/dashboard`, and protected-route behavior from 9C
- preserving the existing plan, phase, workout, session, and progression behavior
- preserving saved-plan edit versus setup/regenerate boundaries

The old narrow Slice 8 dashboard compacting follow-up remains superseded by the broader redesign program. The small 9C production follow-up patch restored the authenticated app shell/header/nav on app routes before 9D.

Slice 9H should not become:

- a route-split slice
- a schema or RLS slice
- an auth model rewrite
- a progression-engine slice
- an LLM/provider integration slice
- a plan builder rewrite or workout execution redesign

## Current Implementation Goals

- preserve the completed public landing and app icon work
- keep `/` public and shell-free while `/dashboard` remains authenticated
- move next into plans/phase UX redesign only after the Slice 9G branch is pushed and the post-slice review finds no blocker
- keep schema, RLS, progression, and LLM/provider behavior unchanged

## Recently Completed Slices

Slice 9G, Dashboard Redesign, is implemented locally.

That slice delivered:

- rebuilt `/dashboard` around a stronger today's-workout hero
- made current phase progress and progression-aware next steps more visible
- added a clearer 5-day weekly training rhythm card
- refreshed recent activity, pain/symptom trend framing, metric cards, and current-plan snapshot
- added a real no-active-plan/no-workout dashboard empty state that routes to plan creation or plan review
- kept dashboard data sourced from `getDashboardData()` and existing progression helpers

This slice did not deliver:

- plans/detail redesign
- workout execution redesign
- plan creation/settings polish
- route-boundary rewrites
- schema migrations
- Supabase RLS changes
- auth-model rewrites
- LLM/provider integration
- progression-engine changes

Slice 9F, Authenticated App Shell Redesign, is implemented locally.

That slice delivered:

- replaced the authenticated top-nav card with a responsive shell treatment
- added a dark navy desktop navigation rail aligned with the landing/icon direction
- added a compact mobile header and fixed thumb-friendly bottom navigation
- added icon-backed Dashboard, Plans, Workout, and Settings navigation with clear active states
- allowed the shared `AppLogo` and `SignOutButton` components to adapt visually inside the shell
- kept route-aware shell visibility through the existing authenticated route-boundary helper

This slice did not deliver:

- dashboard redesign
- plans/detail redesign
- workout execution redesign
- plan creation/settings polish
- route-boundary rewrites
- schema migrations
- Supabase RLS changes
- auth-model rewrites
- LLM/provider integration
- progression-engine changes

Slice 9D, Public Landing Page Implementation, is implemented locally.

That slice delivered:

- replaced the minimal public landing scaffold at `/` with a warm off-white landing page
- added auth-aware public CTAs while keeping `/` shell-free
- added deterministic coded product preview, how-it-works cards, goal cards, returning-user banner, and trust strip
- completed an immediate visual QA polish pass to reduce hero scale, bound the preview, tighten section spacing, strengthen goals/step/trust cards, and preserve mobile behavior
- kept marketing content static and deterministic

Slice 9E, App Icon / PWA Asset Integration, is implemented locally.

That slice delivered:

- added production PNG, SVG, favicon, and Apple touch icon assets from the approved dark-navy / green-A / blue-dumbbell reference
- updated app metadata and the PWA manifest to use the new icon files
- updated shared logo rendering so public and authenticated headers use the approved icon direction

These slices did not deliver:

- authenticated app shell redesign
- dashboard redesign
- schema migrations
- Supabase RLS changes
- auth-model rewrites
- LLM/provider integration
- progression-engine changes

## Previous Completed Slice

Slice 9C, Public Landing Route + Dashboard Route Split, is implemented locally.

That slice delivered:

- moved the authenticated dashboard from `/` to `/dashboard` without changing its training, progression, or onboarding behavior
- replaced `/` with a public landing scaffold that uses static/deterministic marketing content and 9B primitives
- kept `/dashboard`, `/onboarding`, `/plans`, `/plans/new`, `/plans/[planId]`, `/workout`, and `/settings` protected
- updated dashboard-intent redirects and links from `/` to `/dashboard`
- updated the app shell so signed-in users visiting `/` see the public landing scaffold without the authenticated app shell
- added `?mode=sign-up` support on `/login` to preselect the existing sign-up state for landing-page CTAs
- restored authenticated app shell/header/nav rendering on `/dashboard`, `/plans`, `/workout`, `/settings`, and other authenticated app routes through a small pre-production follow-up patch
- centralized route classification in the shared route-boundary helper so the app shell and protected-route logic agree on public versus authenticated surfaces
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

Deferred follow-up from completed Slice 7 QA should stay outside the active Slice 9H scope unless explicitly re-scoped:

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

Slice 9H, Plans / Phase UX Redesign, is now the docs-aligned next planned major slice after Slice 9G post-slice review.

Slice 9H should:

- redesign plans, plan detail, and phase/workout hierarchy surfaces under the new visual system
- preserve the current plan, phase, workout, save-path, and history-snapshot engine
- keep direct detail editing and setup/regenerate boundaries clear
- preserve the authenticated dashboard at `/dashboard`
- preserve protected-route behavior for `/plans`, `/workout`, `/settings`, `/onboarding`, and related app routes
- avoid changing progression logic, schema, RLS, auth, or LLM/provider behavior

Slice 9H should not:

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
- `app/plans/page.tsx`
- `app/plans/[planId]/page.tsx`
- plan detail and phase/workout display components
- shared display/card primitives if needed

## Constraints

- Do not change the route boundary in this slice unless fixing a narrow bug.
- Do not add LLM/provider integration.
- Do not change schema or Supabase RLS.
- Do not change auth behavior.
- Do not change progression behavior or the server-side progression engine.
- Do not rename database tables, API routes, or compatibility fields such as `plan_phases`, `phase-action`, or `currentPhase`.
- Do not weaken Supabase auth or RLS assumptions.
- Keep deferred Slice 7 QA ideas out of active Slice 9H scope unless explicitly re-scoped.
- Keep the separation between direct detail edits and setup/regenerate clear.
- Keep alternate/random workouts deferred future workout flexibility work.

## Non-Goals

- No workout execution redesign yet.
- No plan creation/settings polish yet.
- No schema or RLS changes.
- No auth behavior changes.
- No progression-engine changes.
- No LLM/provider integration.
- No route-boundary rewrite.

## Maintenance Note

After Slice 9H is complete, update this file so it points to the next active implementation slice.
