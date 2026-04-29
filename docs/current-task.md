# Current Task

## Goal

Current implementation target: continue the AI Draft Plan UX Campaign before Slice 10.

Slice 9J, Plan Creation / Settings Polish, is implemented locally. Slice 9K, AI Draft Setup Wizard, is implemented and pushed. Slice 9L, External LLM Handoff UX, is implemented locally on `codex/slice-9l-external-llm-handoff-ux`. Before beginning Slice 10, Exercise Media And Instruction Layer, the next roadmap priority is completing Slice 9M.

The campaign should improve the existing provider-free Draft with AI flow in `/plans/new`:

- Slice 9K: AI Draft Setup Wizard.
- Slice 9L: External LLM Handoff UX.
- Slice 9M: AI Draft Import Ergonomics.

This campaign should preserve the existing setup -> draft -> review/edit -> save contract and must not add provider-backed LLM integration.

## Current Slice

Current campaign status: Slice 9K is implemented and pushed. Slice 9L is implemented locally. Slice 9M, AI Draft Import Ergonomics, is next.

Slice 9K delivered:

- converted Draft with AI setup from one long details page into focused Goal, Schedule, Context, and Optional steps
- aligned the AI setup interaction model more closely with Guided Setup step navigation
- preserved existing prompt generation, import validation, review/edit, and save behavior
- preserved Guided Setup and Manual Builder
- avoided provider-backed LLM integration

Slice 9L delivered:

- clearer copy/paste handoff instructions
- ChatGPT as the recommended external option
- Claude and Gemini as alternatives
- simple outbound links that do not imply provider integration
- copy-prompt as the primary action
- a clear round trip from prompt copy to external tool to import

Slice 9M should focus on:

- improving the import step so users can easily paste or upload the generated plan
- updating generated prompt instructions so external LLMs return a cleaner transfer format
- considering fenced markdown block and/or downloadable markdown file guidance
- improving paste/import instructions and validation error guidance
- preserving strict validation and review-before-save behavior

Slice 9J remains completed background context. It focused on:

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

- improve Draft with AI setup, external LLM handoff, and import ergonomics before Slice 10
- preserve the provider-free copy/paste workflow with external LLMs
- preserve Guided Setup and Manual Builder as existing plan creation paths
- preserve the existing setup -> draft -> review/edit -> save contract
- preserve strict validation before imported AI output reaches review/edit/save
- keep schema, RLS, progression, and LLM/provider behavior unchanged

## Recently Completed Slices

Slice 9L, External LLM Handoff UX, is implemented locally.

That slice delivered:

- added clearer handoff copy after prompt generation
- presented ChatGPT as the recommended external option, with Claude and Gemini as alternatives
- made copy-prompt the primary action
- added a plain-language round-trip checklist for using an external tool and returning to import
- preserved the 9K setup wizard and the existing prompt/import/review/save contract
- added no provider SDK, API key handling, runtime LLM dependency, schema change, RLS change, auth change, or progression change

Verification after Slice 9L:

- `npm run typecheck` passed.
- `npm run test` passed: 8 files, 48 tests. The first sandboxed run hit Windows `spawn EPERM`; rerun with approval passed.
- `npm run build` passed and confirmed `/`, `/dashboard`, `/plans`, `/plans/new`, `/workout`, and `/settings` remain in the route list. The first sandboxed run hit Windows `spawn EPERM`; rerun with approval passed.
- `npm run lint` is not functional with the current Next 16 setup: `next lint` is interpreted as a project directory named `lint`.

Manual smoke notes for Slice 9L:

- Draft with AI setup wizard still works.
- Prompt generation still works.
- Copy-prompt action works.
- External handoff instructions are understandable on mobile and desktop.
- Guided Setup still opens and proceeds.
- Manual Builder still opens and proceeds.
- No provider-backed LLM behavior exists.

Slice 9K, AI Draft Setup Wizard, is implemented locally.

That slice delivered:

- split the Draft with AI setup form into a mobile-first wizard with Goal, Schedule, Context, and Optional steps
- kept the generated prompt, strict markdown import parser, review/edit stage, and compatible save path unchanged
- kept Guided Setup and Manual Builder reachable from `/plans/new`
- preserved the provider-free external AI workflow without API keys, provider SDKs, schema changes, RLS changes, auth changes, or progression changes

Verification after Slice 9K:

- `npm run typecheck` passed.
- `npm run test` passed: 8 files, 48 tests. The first sandboxed run hit Windows `spawn EPERM`; rerun with approval passed.
- `npm run build` passed and confirmed `/`, `/dashboard`, `/plans`, `/plans/new`, `/workout`, and `/settings` remain in the route list. The first sandboxed run hit Windows `spawn EPERM`; rerun with approval passed.
- `npm run lint` is not functional with the current Next 16 setup: `next lint` is interpreted as a project directory named `lint`.

Manual smoke notes for Slice 9K:

- Guided Setup still opens and proceeds.
- Manual Builder still opens and proceeds.
- Draft with AI proceeds through the new setup wizard.
- Prompt generation still works from the completed AI setup.
- No provider-backed LLM behavior exists.

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

Deferred follow-up from completed Slice 7 QA can be considered for the AI Draft Plan UX Campaign only if it fits Draft with AI setup, external LLM handoff, or import ergonomics and does not become a provider-backed AI or plan-builder rewrite.

- broader `/plans/new` flow alignment and terminology cleanup
- assigned-day / prompt-specificity polish
- helper-text layout refinement
- reducing repeated schedule-selection emphasis across Guided Setup, Manual Builder, and Draft with AI
- improving external-AI export / copy-paste ergonomics for the structured prompt-and-import handoff

Exercise-media auto-population from generated plan output remains deferred to Slice 10 or later exercise media work, not Slice 9K-9M.

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

The next major planned work is the AI Draft Plan UX Campaign before Slice 10, Exercise Media And Instruction Layer.

The campaign should improve the existing provider-free Draft with AI path in `/plans/new`:

- Slice 9K: convert Draft with AI setup into a guided, mobile-first setup wizard closer to Guided Setup.
- Slice 9L: clarify the external LLM handoff with direct copy/paste instructions, recommended ChatGPT usage, and Claude/Gemini alternatives.
- Slice 9M: improve import ergonomics so generated output is easier to paste or upload while preserving strict validation.

The Draft with AI flow should remain:

- setup -> draft -> review/edit -> save
- user-directed copy/paste with an external LLM
- provider-free, with no API keys or runtime LLM dependency
- validated before review/edit/save

Broader dashboard, desktop, typography, copy-reduction, and dark-mode cleanup should be tracked separately as future UX polish unless explicitly rescoped.

Completed Slice 9J background context:

- polish `/plans/new`, plan setup/review presentation, and settings/profile surfaces under the new visual system
- preserve existing manual/guided setup behavior, review-before-save drafts, settings/profile forms, and theme controls
- avoid changing provider-free external AI import contracts unless a narrow visual polish requires it
- preserve the authenticated dashboard at `/dashboard`
- preserve protected-route behavior for `/plans`, `/workout`, `/settings`, `/onboarding`, and related app routes
- avoid changing progression logic, schema, RLS, auth, or LLM/provider behavior

The AI Draft Plan UX Campaign should not:

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
- `docs/campaigns/ai-draft-plan-ux.md`
- `AGENTS.md`
- `app/plans/new/page.tsx`
- plan setup and draft/review components
- AI prompt generation and import parser helpers
- shared plan setup/review components if needed

## Constraints

- Do not change the route boundary in this slice unless fixing a narrow bug.
- Do not add LLM/provider integration.
- Do not change schema or Supabase RLS.
- Do not change auth behavior.
- Do not change progression behavior or the server-side progression engine.
- Do not rename database tables, API routes, or compatibility fields such as `plan_phases`, `phase-action`, or `currentPhase`.
- Do not weaken Supabase auth or RLS assumptions.
- Keep deferred Slice 7 QA ideas bounded to Draft with AI setup, handoff, or import ergonomics if touched at all.
- Keep the separation between direct detail edits and setup/regenerate clear.
- Keep alternate/random workouts deferred future workout flexibility work.
- Run future Codex implementation slices in Windows-native Codex app worktrees unless a task explicitly overrides the environment.
- Do not assume WSL or bash for autonomous workflows.

## Non-Goals

- No provider-backed LLM integration.
- No broad dashboard, desktop, typography, or dark-mode cleanup inside the AI Draft Plan UX campaign unless explicitly rescoped.
- No schema or RLS changes.
- No auth behavior changes.
- No progression-engine changes.
- No route-boundary rewrite.

## Maintenance Note

Slice 9J is complete locally. The next planning target is the AI Draft Plan UX Campaign before Slice 10, with broader visual polish tracked separately unless explicitly rescoped.
