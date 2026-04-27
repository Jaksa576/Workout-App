# Current Task

## Goal

Current production follow-up work: complete locally through Slice 9J.

Slice 9D, Public Landing Page Implementation, is implemented locally with an immediate visual QA polish patch. Slice 9E, App Icon / PWA Asset Integration, is also implemented locally as part of the same polish pass. Slice 9F, Authenticated App Shell Redesign, Slice 9G, Dashboard Redesign, Slice 9H, Plans / Phase UX Redesign, Slice 9I, Workout Execution UX Redesign, and Slice 9J, Plan Creation / Settings Polish, are implemented locally.

## Current Slice

Current campaign implementation status: Slice 9J, Plan Creation / Settings Polish, is implemented locally. There is no next implementation slice in the approved Slice 9F through Slice 9J campaign.

Slice 9J focused on:

- polishing `/plans/new`, plan setup/review presentation, and settings/profile forms around the selected visual system
- preserving the existing setup -> draft -> review/edit -> save contract
- preserving `/`, `/dashboard`, and protected-route behavior from 9C
- preserving the existing plan, phase, workout, session, and progression behavior
- preserving existing settings/profile behavior and theme controls

The old narrow Slice 8 dashboard compacting follow-up remains superseded by the broader redesign program. The small 9C production follow-up patch restored the authenticated app shell/header/nav on app routes before 9D.

Slice 9J did not become:

- a route-split slice
- a schema or RLS slice
- an auth model rewrite
- a progression-engine slice
- an LLM/provider integration slice
- a provider-backed AI integration, onboarding rewrite, or new settings data model

## Current Implementation Goals

- preserve the completed public landing and app icon work
- keep `/` public and shell-free while `/dashboard` remains authenticated
- stop campaign implementation after Slice 9J
- keep schema, RLS, progression, and LLM/provider behavior unchanged

## Recently Completed Slices

Slice 9J, Plan Creation / Settings Polish, is implemented locally.

That slice delivered:

- refreshed `/plans/new` with a stronger creation hero and clearer guided/manual/external-AI path framing
- improved plan setup and AI import step navigation with explicit step context and mobile-sticky actions
- improved the shared plan review/builder presentation with a compact summary strip and mobile-readable exercise field labels
- grouped settings/profile editing into clearer durable-profile sections
- replaced the theme dropdown with a more legible segmented preference control
- preserved the existing setup -> draft -> review/edit -> save contract, profile PATCH behavior, and local theme preference behavior

This slice did not deliver:

- route-boundary rewrites
- schema migrations
- Supabase RLS changes
- auth-model rewrites
- new settings data model
- provider-backed AI or LLM integration
- progression-engine changes

Slice 9I, Workout Execution UX Redesign, is implemented locally.

That slice delivered:

- refreshed the workout execution shell with a dark hero and clearer in-session summary stats
- redesigned the exercise checklist cards with stronger numbering, tap targets, completion state, and coaching details
- refreshed workout selection, check-in controls, suggested next-step display, recent logs, rest timer, and saved-session feedback
- preserved existing local checklist storage, `/api/sessions` save behavior, and server-side progression results

This slice did not deliver:

- plan creation/settings polish
- route-boundary rewrites
- schema migrations
- Supabase RLS changes
- auth-model rewrites
- workout-domain model rewrites
- new exercise catalog work
- LLM/provider integration
- progression-engine changes

Slice 9H, Plans / Phase UX Redesign, is implemented locally.

That slice delivered:

- rebuilt `/plans` with a dark overview hero, active-plan spotlight, saved-plan archive cards, and stronger empty state
- refreshed saved plan detail with a dark plan hero, current phase rules, workout preview, phase blueprint, and management framing
- redesigned `PlanPhaseCard` so each phase shows current/saved status, rules, progress, workouts, schedule days, and exercise counts more clearly
- preserved plan list activation, detail editing, archive action, video-link editing, and phase progress surfaces

This slice did not deliver:

- workout execution redesign
- plan creation/settings polish
- route-boundary rewrites
- schema migrations
- Supabase RLS changes
- auth-model rewrites
- saved-plan contract rewrites
- LLM/provider integration
- progression-engine changes

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

Deferred follow-up from completed Slice 7 QA can be considered for Slice 9J only if it fits the approved plan creation/settings polish scope and does not become a provider-backed AI or plan-builder rewrite.

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

No next implementation slice is approved in the Slice 9F through Slice 9J campaign. The next decision should be a human review/merge decision for the completed redesign branches, plus any manual QA findings that should become future scoped work.

The completed Slice 9J work:

- polish `/plans/new`, plan setup/review presentation, and settings/profile surfaces under the new visual system
- preserve existing manual/guided setup behavior, review-before-save drafts, settings/profile forms, and theme controls
- avoid changing provider-free external AI import contracts unless a narrow visual polish requires it
- preserve the authenticated dashboard at `/dashboard`
- preserve protected-route behavior for `/plans`, `/workout`, `/settings`, `/onboarding`, and related app routes
- avoid changing progression logic, schema, RLS, auth, or LLM/provider behavior

Slice 9J should not:

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
- `app/plans/new/page.tsx`
- plan setup and draft/review components
- `app/settings/page.tsx`
- settings/profile components
- shared display/card primitives if needed

## Constraints

- Do not change the route boundary in this slice unless fixing a narrow bug.
- Do not add LLM/provider integration.
- Do not change schema or Supabase RLS.
- Do not change auth behavior.
- Do not change progression behavior or the server-side progression engine.
- Do not rename database tables, API routes, or compatibility fields such as `plan_phases`, `phase-action`, or `currentPhase`.
- Do not weaken Supabase auth or RLS assumptions.
- Keep deferred Slice 7 QA ideas bounded to approved Slice 9J plan creation/settings polish if touched at all.
- Keep the separation between direct detail edits and setup/regenerate clear.
- Keep alternate/random workouts deferred future workout flexibility work.

## Non-Goals

- No slices beyond 9J in this campaign.
- No schema or RLS changes.
- No auth behavior changes.
- No progression-engine changes.
- No LLM/provider integration.
- No route-boundary rewrite.

## Maintenance Note

Slice 9J is complete locally. The next recommended human decision is whether to review and merge the pushed Slice 9F through Slice 9J branches, and which manual QA findings should become future scoped work.
