# Agent Handoff

Use this file to help the next coding agent understand where work stopped.

## Project Summary

This app is evolving from a recovery-first phased workout app into a broader goal-based adaptive training platform.

The product should support multiple goal tracks while reusing the same core infrastructure:

- recovery / rehab
- general fitness
- strength
- hypertrophy
- running
- sport performance
- consistency / habit building

The differentiated product idea is still structured adaptive programming, not generic workout logging. The app should keep guiding users through plans/programs, progressive phases, workouts, exercises, sessions, check-ins, and intelligent advancement, repetition, or adjustment decisions.

## Current Objective

The approved refactor direction is additive and migration-safe:

1. Domain foundation and draft abstraction.
2. Onboarding/profile separation.
3. `/plans/new` goal-specific plan setup.
4. UI terminology shift toward "Blocks".
4.5. Terminology refinement and lightweight branding polish.
5A. Goal-aware templates, richer exercise metadata, and deterministic defaults.
5B1. Profile/settings editing.
5B2. Guided edit-plan workflow.
5B3. Reusable review/edit flow for existing plans.
6. UI Overhaul Phase 1.
6.5. UI Polish and Theme Refinement.
7. AI-assisted plan draft import.
8. Contextual dashboard and progression UX.
9A. UI Redesign Direction, Public Landing, and App Icon Planning.
9B. Design System Foundation.
9C. Public Landing Route + Dashboard Route Split.
9D. Public Landing Page Implementation.
9E. App Icon / PWA Asset Integration.
9F. Authenticated App Shell Redesign.
9G. Dashboard Redesign.
9H. Plans / Phase UX Redesign.
9I. Workout Execution UX Redesign.
9J. Plan Creation / Settings Polish.
10. Exercise media and instruction layer.
11. Broader polish/branding if still needed.

The docs had previously been aligned on Slice 6 as dashboard/progression work. Product direction then intentionally shifted to prioritize UI Overhaul Phase 1 first, ahead of the previously planned dashboard slice.

Slices 1 through 5B3, UI Overhaul Phase 1, Slice 6.5, Slice 7, and Slice 8 are in place locally. Slice 9A completed the docs/planning work that locked the redesign direction, Slice 9B completed the shared design-system foundation, and Slice 9C implemented the public/authenticated route split. A narrow pre-production 9C follow-up patch restored authenticated app shell/header/nav rendering on app routes. Slice 9D implemented and polished the public landing page, Slice 9E integrated the approved app icon/PWA assets, Slice 9F redesigned the authenticated app shell, Slice 9G redesigned the authenticated dashboard, Slice 9H redesigned plans/phase UX, and Slice 9I redesigned workout execution UX. Slice 9J, Plan Creation / Settings Polish, is the next planned slice after the 9I post-slice review and pushed branch. Deferred Slice 7 plan creation QA learnings may be considered only if they fit the approved 9J polish scope without introducing provider-backed AI or a plan-builder rewrite.

The previously considered narrow Slice 8 dashboard QA follow-up is superseded by the broader redesign program unless a blocking bug requires a tiny patch.

## Selected UI Redesign Direction

- clean premium consumer fitness app aesthetic
- warm white and off-white public surfaces
- dark navy product preview panels
- green primary brand accent
- blue secondary action and accent
- selective coral, orange, and purple goal-category accents
- rounded cards, soft shadows, and clean typography
- mobile-first layout with responsive implementation
- single public landing page outside the authenticated app
- simplified public header with only brand/logo, `Sign in`, `Get started`, and optionally `Demo` later
- no complex marketing sub-navigation for now
- public messaging should highlight structured phased training, check-ins/readiness/progress signals, adaptive recommendations, and support for recovery, general fitness, strength, hypertrophy, running, performance, and consistency

## Public Landing And Route Direction

- `/` is now the public landing page and was polished in Slice 9D.
- `/dashboard` is now the authenticated dashboard route.
- `/plans`, `/plans/new`, `/plans/[planId]`, `/workout`, and `/settings` remain authenticated app routes.
- Protected routes must continue to use the existing auth and `proxy.ts` boundary patterns.
- Shared route classification now lives in `lib/app-route-boundary.ts`, which is used by both the protected-route boundary and the authenticated shell visibility checks.
- Public landing page previews should use static or deterministic marketing mock data, not authenticated user data or live Supabase-dependent personalization.
- The route split is now implemented: `/` is public and `/dashboard` is the authenticated dashboard boundary.

## App Icon Direction

- dark navy rounded-square background
- green or teal geometric A mark
- blue dumbbell as the A crossbar
- no text in the icon
- Slice 9E has now added PWA and app icon assets from the approved reference image.

## Implementation Order

1. `9A`: UI Redesign Direction, Public Landing, and App Icon Planning
2. `9B`: Design System Foundation
3. `9C`: Public Landing Route + Dashboard Route Split
4. `9D`: Public Landing Page Implementation
5. `9E`: App Icon / PWA Asset Integration
6. `9F`: Authenticated App Shell Redesign
7. `9G`: Dashboard Redesign
8. `9H`: Plans / Phase UX Redesign
9. `9I`: Workout Execution UX Redesign
10. `9J`: Plan Creation / Settings Polish

## Current Status

- The current app already has Supabase auth, onboarding, plan creation, structured plans with user-facing phases/workouts/exercises, session tracking, server-side progression evaluation, explicit phase advancement, plan activation, archive/delete management, and YouTube demo links.
- The database engine still uses `workout_plans -> plan_phases -> workout_templates -> exercise_entries -> workout_sessions`.
- Product/UI language now uses concise "Phase" labels in the main plan, workout, progress, and manual-builder surfaces, but the database has not been renamed; `plan_phases` remains the compatibility layer.
- The lightweight working product frame is now "Adaptive Training" with the subtitle "Structured plans that progress with you."
- Manual plan creation remains available and is now a secondary path from `/plans/new?mode=manual` or the guided setup toggle.
- Guided plan creation is now review-before-save: `/plans/new` generates a draft, lets the user edit it, then saves through `/api/plans`.
- Primary saved-plan detail editing is now available from existing plan detail through `/plans/[planId]/edit`.
- Guided setup-driven plan regeneration is now available separately through `/plans/[planId]/edit-setup`; it reuses setup -> draft -> review/edit -> save and does not route through onboarding.
- Guided setup answers can be saved on `workout_plans.setup_context`; older plans without saved setup context are prefilled from safe reconstructed plan/profile context with missing-context copy.
- Saved-plan detail edits and guided regenerate drafts both save back to the same plan through `PATCH /api/plans/[planId]`, replacing live plan structure after snapshotting workout/exercise names for readable history.
- Post-5B3 QA confirmed that `Edit details` is the correct primary path.
- A follow-up cleanup patch simplified the `Edit details` review/save copy, removed the surfaced advanced/manual section from the main plan-detail page, and removed the surfaced `Update setup & regenerate` action from the main plan-detail page.
- That cleanup patch was driven by QA learning after 5B3 released; it should not be described as if 5B3 always intended to remove those surfaced actions.
- Archive remains available on the plan-detail page as a smaller secondary control.
- `/plans/[planId]/edit-setup` still exists as a direct route for setup-driven regeneration, but it is no longer surfaced as a main plan-detail action.
- Settings now has a real profile editing form for durable training context; onboarding remains separate from ongoing profile edits.
- Slice 5B1 QA found that invalid settings values, such as negative age or weight, need clearer field-level validation guidance.
- The app remains fully functional without any LLM provider.
- Near-term AI support is now available as optional external structured draft import, not provider-backed in-app generation.
- Imported AI drafts are validated and reviewed before save; the app remains the system of record.
- Slice 7 is now completed locally, including the narrow QA follow-up fixes needed to stabilize the provider-free AI-assisted draft-import path.
- Slice 8 is implemented locally, including the dashboard active-phase progression source-of-truth fix, and the narrow QA follow-up patch is now accepted.
- The future LLM path should plug into the same setup -> draft -> review/edit -> save flow and never become the system of record.
- Guided template drafts now have a stronger deterministic baseline by goal track before any LLM support exists.
- UI Overhaul Phase 1 added a small theme foundation with semantic tokens, `html[data-theme]`, system-default light/dark support, and a local override in the existing authenticated app shell.
- The saved-plan detail page now has a stronger summary area, clearer plan -> phase -> workout hierarchy, and a cleaner archive management section without resurfacing setup/regenerate.
- `/plans/[planId]/edit` now reads as the clear primary existing-plan edit surface.
- `/plans/[planId]/edit-setup` now shares the same visual language while remaining explicitly secondary and setup-driven.
- Shared plan-surface components such as section cards, badges, review/edit panels, and phase/workout cards were refreshed without changing progression logic, save semantics, or history snapshot behavior.
- The dashboard now reads as a workout home screen with a compact 5-day weekly preview, compact activity/progress summaries, and progression prompts derived from the same active-phase progress source.
- Agents must preserve the existing plan, phase, workout, session, and progression engine and must not convert the app into a generic workout logger during the redesign sequence.
- Slice 9B extended the semantic visual token layer with warm app backgrounds, dark product-preview surfaces, primary/secondary accents, goal accents, soft border variants, premium shadows, and focus-ring tokens while keeping the current theme preference behavior intact.
- Slice 9B added reusable presentational primitives for the redesign sequence: `SurfaceCard`, `MetricCard`, `ProductPreviewCard`, `GoalIconCard`, and `LandingSection`.
- Slice 9B evolved `AppLogo` with backward-compatible variants, including an app-icon-ready mark aligned with the future dark-navy/green/blue icon direction.
- Slice 9B refactored `SectionCard` to use the shared surface primitive and lightly adopted the new foundation in the timer preview and dashboard metric strip.
- Slice 9B did not implement the public landing page, route split, schema changes, RLS changes, auth behavior changes, LLM/provider integration, or progression-engine changes.
- Slice 9C moved the dashboard from `/` to `/dashboard` and replaced `/` with a public landing scaffold that uses static marketing content only.
- Slice 9C preserved protected-route behavior for the authenticated app routes and updated dashboard-intent redirects and links from `/` to `/dashboard`.
- Slice 9C adjusted the app shell so signed-in users visiting `/` still see the public landing scaffold rather than the authenticated shell.
- Slice 9C added `?mode=sign-up` login-page support only to preselect the existing sign-up UI state for landing CTAs.
- A narrow 9C follow-up patch removed the fragile layout pathname-forwarding dependency and restored authenticated shell/header/nav rendering on `/dashboard`, `/plans`, `/workout`, `/settings`, and related app routes.
- The authenticated app shell now renders only on authenticated app routes, while `/` remains shell-free even for signed-in users.
- Signed-in public CTA behavior is accepted for 9C. Improve that UX in 9D with auth-aware public CTAs such as `Continue your plan` or `Dashboard`, not with auth-flow changes in this patch.
- Slice 9C did not implement the full landing page, app icon integration, authenticated shell redesign, dashboard redesign, schema changes, RLS changes, auth-model rewrites, LLM/provider integration, or progression-engine changes.
- Slice 9D replaced the minimal public landing scaffold with a warm off-white public landing page, auth-aware public CTAs, deterministic product mockups, how-it-works cards, goals cards, a returning-user banner, and a trust strip.
- The immediate post-9D polish patch tightened hero scale, product-preview bounds, section spacing, goals card treatment, icon sizing, returning-user banner copy/layout, trust strip layout, and header branding without changing route/auth behavior.
- Slice 9E added high-quality app icon assets from the approved dark-navy rounded-square, green/teal A, and blue dumbbell reference; metadata and manifest now point at PNG/favicon/Apple touch assets.
- Slice 9F replaced the authenticated top navigation card with a dark navy desktop rail, compact mobile header, fixed bottom mobile navigation, icon-backed active states, and shell-specific sign-out treatment.
- Slice 9F kept shell visibility route-aware through `lib/app-route-boundary.ts` and did not change route protection, schema, RLS, auth behavior, progression logic, or LLM/provider behavior.
- Slice 9G rebuilt `/dashboard` around today's workout, current phase progress, weekly rhythm, progression-aware next action, recent activity, and a current-plan snapshot.
- Slice 9G added a real no-active-plan/no-workout dashboard empty state that routes to plan creation or plan review without replacing authenticated app data with static mock data.
- Slice 9H rebuilt `/plans`, saved plan detail, and phase cards around active-plan visibility, current phase clarity, workouts under phases, and discoverable plan actions.
- Slice 9H preserved plan activation, direct detail editing, archive action, video-link editing, phase progress display, saved-plan contracts, and setup/regenerate boundaries.
- Slice 9I refreshed workout execution, exercise checklist cards, rest timer, check-in controls, recent logs, and saved-session feedback while preserving session save behavior and server-side progression results.
- Slice 9D/9E/9F/9G/9H/9I did not implement plan creation/settings polish, schema changes, RLS changes, auth-model rewrites, LLM/provider integration, or progression-engine changes.

## Known local development risk

VS Code Remote WSL disconnects may be caused by dev-server resource pressure rather than repo corruption. This repo should run its local Next dev server on port `3001`; another local Next app may be using `3000`.

Resource checks:

```bash
free -h
ps aux --sort=-%cpu | head -15
ss -ltnp | grep -E ':3000|:3001'
```

Cleanup commands for runaway local Next/PostCSS work:

```bash
pkill -f "next-server"
pkill -f ".next"
pkill -f "postcss"
rm -rf .next
```

Future agents should not add broad Tailwind scanning patterns such as `./**/*`, and should avoid intentionally scanning `.next`, `node_modules`, `dist`, `build`, `coverage`, or `.git`.

## UI Overhaul Phase 1 Completed Locally

Slice 6 added the visual foundation for the broader product direction:

- a small theme foundation with semantic tokens and system-default light/dark detection
- `html[data-theme]` support with a local client-side override in the app shell
- shared mobile-first UI primitives for plan surfaces
- refreshed saved-plan detail, `/plans/[planId]/edit`, and `/plans/[planId]/edit-setup` without changing progression logic or save semantics

QA learning after Slice 6:

- the directional theme support and updated surfaces work well
- dark mode has contrast/readability issues on some already-touched surfaces
- the theme preference toggle should move into Settings rather than staying in the app shell

Slice 6 established the visual foundation that later slices should continue to build on rather than replace.

## Slice 6.5 Completed Locally

This was a narrow follow-up patch after Slice 6, not a redesign.

What changed:

- removed the surfaced theme toggle from the authenticated app shell and moved the single user-facing theme preference control into Settings
- kept the existing local `localStorage` theme preference behavior, `html[data-theme]` application, and no-flash bootstrap script intact
- tightened dark-mode semantic tokens and shared surface styling so the saved-plan detail page, `/plans/[planId]/edit`, and `/plans/[planId]/edit-setup` have better text contrast, calmer card backgrounds, and clearer borders
- improved shared status badge readability in dark mode
- updated Settings styling to use the existing semantic input/button primitives instead of separate hardcoded light-only field styles
- updated `docs/roadmap.md`, `docs/current-task.md`, and `docs/architecture.md` so Slice 6.5 is recorded correctly

Verification after Slice 6.5:

- `npm run test` passed.
- `npm run typecheck` passed.
- `npm run build` passed.

Manual browser verification still needed after Slice 6.5:

- confirm theme preference appears in Settings
- confirm the shell-level theme toggle is gone
- confirm theme selection persists across refresh and navigation
- confirm dark mode is more readable on saved plan detail, `/plans/[planId]/edit`, and `/plans/[planId]/edit-setup`
- confirm edit-vs-regenerate boundaries remain unchanged
- confirm there are no unrelated regressions on the touched plan surfaces

Tiny QA follow-up after Slice 6.5:

- fixed the remaining dark-mode header contrast issue on Settings and Plans by switching those headers to the shared semantic text tokens already used on the Slice 6 plan surfaces
- improved theme selector readability in dark mode so the closed control text and native dropdown option text inherit readable foreground/background colors

Verification after the tiny Slice 6.5 QA follow-up:

- `npm run typecheck` passed.
- `npm run build` passed.

Manual browser verification still needed after the tiny Slice 6.5 QA follow-up:

- confirm Settings header text is clearly readable in dark mode
- confirm Plans header text is clearly readable in dark mode
- confirm the theme selector closed-state text is readable in dark mode
- confirm the theme selector dropdown option text is readable in dark mode
- confirm light mode still looks correct
- confirm no unrelated settings/plans layout changes were introduced

Final tiny Slice 6.5 QA follow-up:

- fixed the remaining dark-mode Settings field-label readability issue by switching the shared settings form labels and helper text onto the same semantic `text-copy` / `text-muted` tokens used elsewhere in the refreshed Settings surface

Verification after the final tiny Slice 6.5 QA follow-up:

- `npm run typecheck` passed.
- `npm run build` passed.

Manual browser verification still needed after the final tiny Slice 6.5 QA follow-up:

- confirm Settings field labels like Age, Weight, and the other field headers are clearly readable in dark mode
- confirm light mode still looks correct
- confirm no unrelated Settings styling changed
- confirm the Appearance/theme section still looks correct

## Slice 7 Completed Locally

Slice 7 added the provider-free AI-assisted draft-import path inside `/plans/new`.

What changed:

- added a visible `Draft with AI` mode alongside guided setup and manual building
- generated deterministic prompts from the v1 prompt contract for use with the user's own external AI assistant
- accepted strict pasted markdown output, validated it locally, and converted it into the existing structured review/edit flow
- introduced `ai_import` as a distinct creation source for imported AI drafts
- kept review-before-save and the existing plan write path intact

Final Slice 7 QA outcome:

- stabilized the create-plan surface and AI flow with the narrow post-QA follow-up fixes
- tightened prompt generation so selected-goal guidance stays narrow and deterministic
- kept imported drafts inside the existing review/edit/save path without introducing provider-backed generation or roadmap drift

## Slice 8 Completed Locally

Slice 8 made the dashboard feel more like a workout home screen and fixed the active-phase progression mismatch.

What changed:

- updated the dashboard around "Your workout for today," a compact "This week" preview, activity dots, phase progress, and a concise next-step prompt
- added deterministic dashboard display helpers in `lib/dashboard.ts`
- extended dashboard data with weekly preview, activity summary, progression prompt, and symptom trend fields
- changed dashboard progression messaging so it derives from `calculatePhaseProgress()` for the active plan and active phase instead of separately counting generic recent clean sessions
- kept progression movement user-confirmed by routing dashboard CTAs to the existing plan progress surface
- added focused Vitest coverage for active-phase mismatch, progression-ready/incomplete/caution copy, and weekly preview fallback behavior

Intentionally not changed:

- no LLM/provider integration
- no schema migrations or Supabase RLS changes
- no onboarding, plan creation, plan editing, setup/regenerate, or workout execution redesign
- no progression-engine rewrite
- no dashboard phase-action mutation path

Verification after Slice 8:

- `npm run test` passed.
- `npm run typecheck` passed.
- `npm run build` passed.

Final accepted Slice 8 QA follow-up:

- reduced the weekly preview from 7 days to a compact 5-day view
- switched the preview to compact date labels with right-aligned date pills
- removed repeated `Keep the streak going` copy from adjacent middle dashboard cards while keeping it as a single section-level heading
- preserved the existing progression title, detail, CTA, and active-phase sync behavior
- kept random/alternate workouts deferred

Verification after the accepted Slice 8 QA follow-up:

- `npm run test` passed.
- `npm run typecheck` passed.
- `npm run build` passed.

Manual QA outcome after the accepted Slice 8 QA follow-up:

- the dashboard looked good overall after the compact preview and copy cleanup
- no further Slice 8 changes are needed before moving to Slice 9

Additional deferred idea surfaced during Slice 8 QA:

- plan-aware alternate/random workout support could be useful later for keeping momentum when a user wants something different on a given day
- this should remain a future roadmap item, not part of the current Slice 8 follow-up patch
- if pursued later, it should preserve structured plans, phase progression, and adaptive training logic rather than becoming a generic workout picker

## Deferred Follow-Up Ideas From Slice 7 QA

These ideas were intentionally deferred so they do not get pulled into active Slice 9 work by accident.

- align Draft with AI more closely with Guided Setup later so `/plans/new` starts with a more consistent plan-type-first structure
- rename or better explain unclear setup terms such as `Preferred split` and `Temporary focus areas`
- improve Draft-with-AI terminology clarity around `Progression mode`
- continue refining AI prompt generation so it stays strongly goal-specific and so assigned-day handling is clearer across prompt generation, import, and review/edit

Additional deferred QA learnings to keep out of the active Slice 7 patch:

- refine helper-text presentation on plan-creation surfaces so extra guidance for fields like `Session structure`, `Plan focus areas`, and `How this plan should progress` can move into a more compact pattern instead of always expanding field/dropdown layout inline
- treat selected-goal-specific prompt generation as a guardrail for the external-AI flow so future prompt work does not reintroduce mixed multi-goal framing in a single prompt
- keep exercise media/video auto-population from generated plan output deferred to the later exercise media and instruction work rather than pulling it into Slice 7 stabilization
- reduce repeated schedule-selection emphasis across Guided Setup, Manual Builder, and Draft with AI so the create-plan flow feels less redundant after schedule choices have already been made
- improve the external-AI export / copy-paste handoff so structured prompt generation and pasted import output are easier to move between the app and the user’s external assistant without committing yet to a specific export format

Verification after Slice 7:

- focused Vitest coverage was added for prompt generation, parser success/failure cases, whitespace normalization, and conversion into the internal structured draft shape
- typecheck and plan-drafting/save-path tests should be rerun after any follow-up edits in this area

## Next Major Slice

Slice 9J, Plan Creation / Settings Polish, is now the docs-aligned next planned major slice after the Slice 9I post-slice review and pushed branch. Do not revisit 9C unless QA finds a regression in the implemented route/app-shell boundary.

Intent:

- polish plan creation and settings under the new shell and visual system
- make `/plans/new`, setup/review presentation, settings/profile forms, and theme controls visually consistent
- preserve the authenticated dashboard at `/dashboard` and the existing protected app boundary
- keep schema changes, auth-model changes, provider-backed AI, onboarding rewrites, new settings data models, and progression-engine changes out of this slice

## Slice 9I Completed Locally

Slice 9I redesigned workout execution while preserving the existing session engine:

- refreshed `WorkoutFlow` with a dark workout hero, clearer recommended-workout selector, semantic-token cards, check-in controls, suggested next-step display, recent logs, saved-session feedback, and progression links
- redesigned `WorkoutChecklist` exercise cards with stronger numbering, larger tap targets, completion summary, and clearer coaching/rest/demo details
- refreshed `TimerCard` to align with the new authenticated visual system
- preserved local checklist storage, selected-workout routing, `/api/sessions` payloads, save behavior, session history merge behavior, and server-side progression result display
- left data loading, auth/proxy behavior, schema/RLS files, API routes, workout-domain models, and progression logic unchanged

Verification for Slice 9I:

- `.next` cleanup was attempted before verification.
- `npm run typecheck` passed.
- `npm run test` passed: 8 files, 48 tests.
- `npm run build` passed and confirmed `/`, `/dashboard`, `/plans`, `/plans/new`, `/workout`, and `/settings` remain in the route list.
- `next-env.d.ts` changed as a generated build artifact and was restored before commit.

Manual QA still recommended after Slice 9I:

- signed-out `/`
- signed-in `/`
- signed-out `/dashboard`
- signed-in `/dashboard`
- `/workout` default recommended workout
- alternate workout selection
- exercise checklist persistence
- finish workout -> check-in flow
- save workout and post-save feedback
- phase-ready progression CTA when applicable
- recent logs
- rest timer
- mobile viewport
- dark mode
- light mode

## Slice 9H Completed Locally

Slice 9H redesigned plans and phase surfaces while preserving the existing plan engine:

- rebuilt `/plans` with a dark overview hero, active-plan spotlight, saved-plan archive cards, and a stronger no-plans empty state
- refreshed saved plan detail with a dark plan hero, current phase rules, workout preview, phase blueprint, and archive management framing
- redesigned `PlanPhaseCard` to make phase number, current status, progression signal, rules, workouts, schedule days, and exercise counts easier to scan
- preserved plan activation, direct detail edit link, archive action, video-link editing, phase progress panel, setup/regenerate boundaries, save paths, and history-snapshot assumptions
- left data loading, auth/proxy behavior, schema/RLS files, API routes, saved-plan write contracts, and progression logic unchanged

Verification for Slice 9H:

- `.next` cleanup was attempted before verification.
- `npm run typecheck` passed.
- `npm run test` passed: 8 files, 48 tests.
- `npm run build` passed and confirmed `/`, `/dashboard`, `/plans`, `/plans/[planId]`, `/plans/new`, `/workout`, and `/settings` remain in the route list.
- `next-env.d.ts` changed as a generated build artifact and was restored before commit.

Manual QA still recommended after Slice 9H:

- signed-out `/`
- signed-in `/`
- signed-out `/dashboard`
- signed-in `/dashboard`
- `/plans` with no plans
- `/plans` with an active plan and saved plans
- `/plans/[planId]` for active and saved plans
- activate saved plan from list
- archive plan from detail
- edit details link from detail
- exercise video link editor
- mobile viewport
- dark mode
- light mode

## Slice 9G Completed Locally

Slice 9G redesigned the authenticated dashboard while preserving the existing dashboard data and progression source of truth:

- rebuilt `/dashboard` around a dark today's-workout hero with real workout, phase, readiness, and workload details
- made current phase progress and progression-aware next action more prominent
- refreshed the 5-day weekly training rhythm, recent activity, pain/symptom trend, and metric presentation
- added a current-plan snapshot with real schedule, phase count, and today-workout exercises
- added a no-active-plan/no-workout empty state that routes users to plan creation or plan review
- left data loading, auth/proxy behavior, schema/RLS files, API routes, and progression logic unchanged

Verification for Slice 9G:

- `.next` cleanup was attempted before verification.
- `npm run typecheck` passed.
- `npm run test` passed: 8 files, 48 tests.
- `npm run build` passed and confirmed `/`, `/dashboard`, `/plans`, `/plans/new`, `/workout`, and `/settings` remain in the route list.
- `next-env.d.ts` changed as a generated build artifact and was restored before commit.

Manual QA still recommended after Slice 9G:

- signed-out `/`
- signed-in `/`
- signed-out `/dashboard`
- signed-in `/dashboard`
- active-plan dashboard state
- no-active-plan dashboard empty state
- `/plans`
- `/plans/new`
- `/workout`
- `/settings`
- mobile viewport
- dark mode
- light mode

## Slice 9F Completed Locally

Slice 9F redesigned the authenticated app shell while keeping the public/authenticated boundary intact:

- kept `/` public and shell-free while authenticated app routes still render through `AppShell`
- added a dark navy desktop navigation rail using the approved icon/landing visual direction
- added a compact mobile header and fixed bottom navigation for Dashboard, Plans, Workout, and Settings
- added inline SVG nav icons with consistent stroke treatment and clear active route states
- allowed `AppLogo` text colors and `SignOutButton` styling to adapt to dark shell surfaces
- left `proxy.ts`, `app/layout.tsx`, `app/page.tsx`, dashboard internals, API routes, schema/RLS files, and progression logic unchanged

Verification for Slice 9F:

- `npm run typecheck` passed after implementation.
- `npm run test` passed: 8 files, 48 tests.
- `npm run build` passed and confirmed `/`, `/dashboard`, `/plans`, `/plans/new`, `/workout`, and `/settings` remain in the route list.
- `.next` cleanup was attempted before verification; `next-env.d.ts` changed as a generated build artifact and was restored before commit.

Manual QA still recommended after Slice 9F:

- signed-out `/`
- signed-in `/`
- signed-out `/dashboard`
- signed-in `/dashboard`
- `/plans`
- `/plans/new`
- `/workout`
- `/settings`
- mobile viewport
- dark mode
- light mode

## Slice 1 Completed Locally

Slice 1 added the foundation for the broader product direction:

- richer profile metadata columns and plan metadata columns additively
- nullable plan-level `progression_mode`
- `source_exercise_id` for catalog-backed exercise entries
- AI-neutral draft-provider boundary at `lib/plan-drafting/plan-draft-provider.ts`
- goal/progression shared types, validation, and default progression-mode selection
- minimal Vitest foundation tests for draft generation, validation, and progression-mode selection

Verification after Slice 1:

- `npm run test` passed.
- `npm run typecheck` passed.
- `npm run build` passed.

## Slice 2 Completed Locally

Slice 2 separated onboarding/profile setup from longer-term goal-specific plan setup:

- onboarding now centers durable profile data: age, weight, training experience, activity level, training environment, limitations detail, exercise preferences, exercise dislikes, sports/interests, equipment, typical availability, and typical session duration
- `planSetupChoice` remains only as temporary onboarding submission state so users can still choose guided plan setup or the manual plan builder after profile save
- the onboarding API saves only durable profile fields and does not write `goal_notes` or infer `primary_goal_type`
- existing non-null profile fields are protected from null/empty overwrites by preserving stored values when optional submitted values are blank
- `lib/data.ts` maps the richer profile fields for future use
- onboarding/profile validation tests were added under `lib/__tests__/`

Verification after Slice 2:

- `npm run test` passed.
- `npm run typecheck` passed.
- `npm run build` passed.

## Slice 3 Completed Locally

Slice 3 moved goal-specific setup into `/plans/new`:

- added a lightweight `PlanSetupInput` model for `goalType`, optional `objectiveSummary`, `daysPerWeek`, `sessionMinutes`, `weeklySchedule`, `preferredSplit`, `focusAreas`, `currentConstraints`, and optional advanced `progressionModeOverride`
- added plan setup validation in `lib/validation.ts`
- refactored `lib/plan-drafting/plan-draft-provider.ts` and `lib/starter-plan-generator.ts` so guided drafts use plan setup input plus optional profile context, not onboarding input
- added `POST /api/plan-drafts` as a non-persistent draft-generation endpoint that requires auth, loads the profile, calls the template draft provider, and returns a structured draft without saving
- added `components/plan-setup-wizard.tsx` with goal selection, minimal plan-specific questions, draft loading/error/retry states, missing-profile fallback copy, and draft review/edit before save
- refactored `components/plan-builder-form.tsx` to accept an optional generated `StructuredPlanInput` while preserving `goalType`, `progressionMode`, and `creationSource`
- updated `/plans/new` to default to guided setup and keep manual setup available through `?mode=manual`
- updated onboarding to redirect to `/plans/new` or `/plans/new?mode=manual` instead of auto-saving a guided starter plan
- updated dashboard/onboarding/workout redirects so completed-profile users without a plan are sent to `/plans/new`
- updated `docs/current-task.md` to describe Slice 3

Verification after Slice 3:

- `npm run test` passed.
- `npm run typecheck` passed.
- `npm run build` passed.

## Slice 4 Completed Locally

Slice 4 made the user-facing terminology shift from "Phase" to "Block" as a scoped presentation-only pass:

- added `lib/plan-labels.ts` with a tiny `formatBlockLabel(phaseNumber)` display helper
- updated the dashboard, plans list, plan detail page, workout flow, phase progress panel, manual plan builder, and plan management controls so visible labels and action copy use "Block"
- updated user-visible progression/session/write-path messages that are rendered in the UI or surfaced as API errors
- kept internal compatibility names unchanged, including `plan_phases`, `phase-action`, `currentPhase`, `PhaseProgressPanel`, phase-shaped TypeScript payloads, route/file names, and progression algorithms/enums/semantics
- lightly updated README product wording so it reflects onboarding/profile setup, guided `/plans/new` plan drafts, and block-based progression
- updated `docs/current-task.md` to point to Slice 5 and added a maintenance note to advance it after each completed slice
- updated `docs/roadmap.md` so Slice 4 is implemented locally and Slice 5 is next

Verification after Slice 4:

- Terminology search was run to separate remaining internal/API/database names from user-facing copy.
- `npm run test` passed.
- `npm run typecheck` passed.
- `npm run build` passed.

## Slice 4.5 Completed Locally

Slice 4.5 refined terminology and light product framing as a presentation-only pass:

- changed the tiny display helper in `lib/plan-labels.ts` from `formatBlockLabel(phaseNumber)` to `formatPhaseLabel(phaseNumber)`
- changed user-visible "Block" copy back to concise "Phase" language across the dashboard, plans list, plan detail page, workout flow, phase progress panel, manual plan builder, plan management controls, progression messages, plan write validation, and management API error text
- updated the app shell, metadata, manifest, and README to the working product frame "Adaptive Training" / "Structured plans that progress with you."
- updated `docs/roadmap.md` to add Slice 4.5 and revise the next sequence to Slice 5A, 5B, 6, 7, 8, and 9
- updated `docs/current-task.md` so the next active implementation task is Slice 5A
- kept internal compatibility names unchanged, including `plan_phases`, `phase-action`, `currentPhase`, `PhaseProgressPanel`, `PhaseProgressSummary`, `PlanPhase`, `StructuredPhaseInput`, phase-shaped payload fields, route/file names, progression algorithms/enums/semantics, the draft provider, guided setup logic, save paths, schema, auth, and RLS assumptions

Verification after Slice 4.5:

- Terminology search was run locally; remaining lowercase `block` hits in app code are Tailwind/CSS display classes, while remaining "Block" docs hits are Slice 4 historical context.
- `npm run test` passed.
- `npm run typecheck` passed.
- `npm run build` passed.

## Slice 5A Completed Locally

Slice 5A improved deterministic guided draft quality without changing schema, API routes, provider strategy, or the `/plans/new` review/edit/save flow:

- expanded `lib/exercise-library.ts` from a tiny rehab-leaning catalog into richer static metadata for movement pattern, goal tags, difficulty tier, caution tags, traits, and preference tags
- added enough deterministic catalog entries to support recovery, general fitness, strength, hypertrophy, running, sport performance, and consistency drafts
- refactored `lib/starter-plan-generator.ts` around the approved bounded draft shapes: `simple_foundation`, `balanced_3_day`, `strength_full_body`, `upper_lower`, and `run_strength`
- added explicit goal-aware draft structures so running plans include run/walk or easy-run work, recovery plans stay conservative, strength/hypertrophy plans use real training patterns, sport performance includes lateral/athletic support, and consistency stays simple
- added coarse deterministic selection for available equipment, exercise dislikes, profile limitations, plan constraints, and preference/sport context
- kept running sessions represented as exercise-like plan items such as "Run/walk intervals" and "Easy run"; this is a temporary model compromise, not the long-term running design
- kept `getPlanDraftProvider("template")` as the guided generation path and left the LLM provider unavailable
- expanded Vitest coverage for all goal tracks, structure differences, goal fidelity, filtering behavior, metadata completeness, validation, and LLM unavailability
- updated `docs/current-task.md` so the next active implementation slice is Slice 5B
- updated `docs/roadmap.md` so Slice 5A is implemented locally and Slice 5B is next

Verification after Slice 5A:

- `npm run test` passed.
- `npm run typecheck` passed.

## Slice 5B1 Completed Locally

Slice 5B1 split profile/settings editing away from the guided edit-plan workflow and added a durable profile ownership surface:

- replaced the read-only `/settings` summary with a client-side profile settings form
- added `PATCH /api/profile` for authenticated profile updates without rerunning onboarding
- added `ProfileSettingsInput`, settings validation, and a pure update-value mapper for partial profile updates
- preserved the onboarding safeguard by keeping onboarding's "blank does not overwrite existing data" behavior unchanged
- made settings PATCH behavior explicit: omitted fields are preserved, while submitted `null`, blank strings, or empty arrays are treated as intentional clears
- extracted shared profile option lists into `lib/profile-options.ts` so onboarding and settings stay aligned
- left `/plans/new`, plan drafting, progression behavior, schema, and LLM/provider integration unchanged
- added Vitest coverage for settings validation and update-value mapping
- updated `docs/current-task.md` and `docs/roadmap.md` to split 5B into 5B1 and 5B2

Verification after Slice 5B1:

- `npm run test` passed.
- `npm run typecheck` passed.
- `npm run build` passed.

Post-QA findings after Slice 5B1:

- Profile/settings editing works, but validation messaging needs a small follow-up UX patch so invalid values such as negative age or weight show clear field-level guidance.
- Profile field ownership remains an open future product question. Training experience, current activity level, and similar fields are currently stored and editable as durable profile fields, but may later be treated as onboarding/setup inputs, plan-context inputs, or last-known context instead.
- No redesign of the profile model has been implemented or approved yet.

## Slice 5B2 Completed Locally

Slice 5B2 added a guided setup-driven update/regenerate workflow for existing plans:

- added `workout_plans.setup_context` through an additive migration and schema update so guided setup answers can be stored with saved plans
- added setup-context helpers that use saved setup context when present and safely reconstruct older plans from plan/profile data when missing
- added `/plans/[planId]/edit-setup` as the guided edit route, with copy explaining that it does not rerun onboarding
- added an "Edit plan setup" primary action on plan detail
- reused `PlanSetupWizard` and `PlanBuilderForm` for edit mode instead of creating a second wizard
- kept manual structure management visible as a separate advanced path
- added a wrapped plan-save payload so guided create/edit can pass both the reviewed `StructuredPlanInput` and its `PlanSetupInput`
- added `PATCH /api/plans/[planId]` and `updateStructuredPlanForUser` to replace the live plan structure after review
- snapshot current workout and exercise names before replacing plan structure so old history remains readable through snapshots
- added Vitest coverage for persisted setup context, older-plan reconstruction, profile fallback defaults, and wrapped save validation
- updated `docs/current-task.md`, `docs/roadmap.md`, and `docs/architecture.md` for the completed slice

Verification after Slice 5B2:

- `npm run typecheck` passed.
- `npm run test` passed: 4 files, 25 tests.
- `npm run build` passed and confirmed `/plans/[planId]/edit-setup` in the Next.js route output.

Manual browser verification still needed after Slice 5B2:

- launch guided edit from a saved plan
- confirm it does not route through onboarding
- confirm known setup fields are prefilled
- confirm missing context is explained and editable for an older plan without `setup_context`
- generate an edited draft, review it, and save back to the same plan
- confirm existing `/plans/new` guided creation still works and persists setup context
- confirm manual plan management remains available as the advanced path
- confirm prior workout history remains readable after saving a guided edit

Post-QA learning after Slice 5B2:

- setup-context persistence and older-plan reconstruction are the right foundation and should be kept
- the current flow is better understood as "update plan setup" / "regenerate from setup" than the main general edit-existing-plan journey
- the next slice should focus on a reusable review/edit experience for existing plans
- do not remove the advanced/manual edit path yet because the new primary edit flow does not exist

## Slice 5B3 Completed Locally

Slice 5B3 made saved-plan detail editing the primary existing-plan edit path:

- added `/plans/[planId]/edit` as the primary existing-plan review/edit route
- changed the top plan-detail actions to `Edit details` and `Update setup & regenerate`
- reused the existing review/edit stage for saved-plan detail edits instead of inventing a second editor
- added a pure saved-plan-to-structured-draft helper so existing plans can open directly in the reusable review/edit flow
- kept detail edits saving through `PATCH /api/plans/[planId]` and preserved existing `setup_context` when it already exists
- confirmed the saved-plan read -> edit -> save path would drop `source_exercise_id`, then patched the read-side mapping so reopening and resaving a plan does not lose catalog traceability
- updated the advanced/manual plan management copy so it reads as clearly secondary and manual
- updated `docs/current-task.md`, `docs/roadmap.md`, and `docs/architecture.md` for the completed slice and next Slice 6 focus

Verification after Slice 5B3:

- `npm run test` passed: 5 files, 26 tests.
- `npm run typecheck` passed.
- `npm run build` passed and confirmed `/plans/[planId]/edit` in the Next.js route output.

Manual browser verification still needed after Slice 5B3:

- open an existing plan and launch `Edit details`
- confirm it opens saved-plan detail editing, not onboarding or setup
- save changes back to the same plan
- confirm `Update setup & regenerate` still works separately
- confirm older-plan regenerate still explains missing setup context only on the regenerate path
- confirm advanced/manual plan editing is still reachable and clearly secondary
- confirm existing `/plans/new` guided creation still works
- confirm prior workout history remains readable after plan edits
- confirm mobile layout is still usable for the changed entry points

## Post-5B3 Cleanup Patch Completed Locally

This was a narrow QA-driven cleanup after Slice 5B3, not a retroactive rewrite of 5B3's original intended scope.

- kept `Edit details` as the single clear main edit action on the plan-detail page
- simplified the review/save copy inside the saved-plan detail edit flow
- removed the surfaced advanced/manual section from the main plan-detail page
- removed the surfaced `Update setup & regenerate` action from the main plan-detail page
- kept archive as a smaller secondary control on the plan-detail page
- kept `/plans/[planId]/edit-setup`, setup-context persistence, and the existing compatible save/write behavior intact

Verification after the cleanup patch:

- `npm run test` passed.
- `npm run typecheck` passed.
- `npm run build` passed.

Manual browser verification still needed after the cleanup patch:

- open an existing plan and launch `Edit details`
- confirm the simplified review/save copy is easy to understand
- confirm the surfaced advanced/manual section is no longer shown on the main plan-detail page
- confirm the surfaced `Update setup & regenerate` action is no longer shown on the main plan-detail page
- confirm archive is still reachable as a smaller secondary control
- save changes back to the same plan
- confirm prior workout history remains readable after plan edits
- confirm existing `/plans/new` guided creation still works
- confirm `/plans/[planId]/edit-setup` still works if visited directly
- confirm mobile layout is still usable for the changed plan-detail actions

## UI Overhaul Phase 1 Completed Locally

This slice intentionally changed the roadmap sequence before implementation: the docs had been aligned on dashboard/progression work as Slice 6, but product direction shifted to land the saved-plan UI foundation first.

What changed:

- updated `docs/roadmap.md`, `docs/current-task.md`, and this handoff so UI Overhaul Phase 1 is the deliberate priority change ahead of dashboard work
- added a small repo-native theme layer with semantic tokens, `html[data-theme]`, system-default theme selection, a local persisted override, and a no-flash bootstrap script in `app/layout.tsx`
- refreshed the authenticated app shell styling and added a compact theme control in the existing shared header rather than creating a larger nav/settings redesign
- refreshed the saved-plan detail page with a stronger summary/hero area, clearer hierarchy, and reusable phase/workout cards
- refreshed `/plans/[planId]/edit` so it reads as the primary saved-plan editing surface
- refreshed `/plans/[planId]/edit-setup` so it stays related but clearly secondary to direct detail editing
- updated `PlanBuilderForm` and `PlanSetupWizard` at the token/primitive level so the edit surfaces inherit the new visual foundation without doing dedicated `/plans/new` route UX work
- kept progression logic, save semantics, setup-context behavior, history snapshotting, schema, auth, and RLS assumptions unchanged

Verification after UI Overhaul Phase 1:

- `npm run typecheck` passed.
- `npm run build` passed.

Manual browser verification still needed after UI Overhaul Phase 1:

- open plan detail in light mode and dark mode
- open `/plans/[planId]/edit` in light mode and dark mode
- open `/plans/[planId]/edit-setup` in light mode and dark mode
- confirm mobile-width behavior on all three saved-plan surfaces
- confirm desktop-width behavior on all three saved-plan surfaces
- confirm `Edit details` still reads as the dominant action on plan detail
- confirm setup/regenerate remains clearly secondary and direct-route only
- confirm the theme override persists locally
- confirm system theme fallback works
- confirm there is no obvious hydration mismatch or flash of the wrong theme on initial load
- save a detail edit back to the same plan
- confirm archive still works
- confirm history remains readable after plan edits

## Schema Drift Recovery Status

After Slice 2, localhost hit a runtime error because the Supabase project in `.env.local` was missing Slice 1 columns such as `profiles.primary_goal_type`.

Recovery status:

- Partial migration-tolerant fallback edits in `lib/data.ts` and `app/api/onboarding/route.ts` were removed before Slice 3.
- The app now expects the clean Slice 1/Slice 2/Slice 3 schema directly.
- `supabase/schema.sql` was inspected and already includes the Slice 1/Slice 2 expected columns.
- Slice 3 did not require database schema changes.
- The repo only uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for Supabase clients.

Remaining recovery work:

- Create or use a Supabase dev project with the current schema applied.
- Update `.env.local` to the dev project's `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Apply `supabase/schema.sql` once to a blank dev project, or ensure these migrations are applied to an existing project:
  - `supabase/migrations/20260412160000_onboarding_progression.sql`
  - `supabase/migrations/20260412170000_phase_session_scoping.sql`
  - `supabase/migrations/20260413120000_training_profile_and_progression_mode.sql`
  - `supabase/migrations/20260414100000_plan_setup_context.sql`
- Restart the dev server and manually verify logged-in flows.

## Next Best Step

Slice 9J, Plan Creation / Settings Polish, is the next campaign slice after the Slice 9I post-slice review and pushed branch.

It should build on the new authenticated shell, dashboard, plans, and workout visual foundation while polishing `/plans/new`, plan setup/review presentation, settings/profile forms, and theme controls. It must preserve provider-free operation, review-before-save plan creation, existing settings/profile behavior, and the core progression engine.

If needed, a small Slice 5B1 follow-up patch is still available for profile/settings field-level validation messaging:

- invalid values such as negative age or weight should show clear guidance near the relevant field
- do not redesign the profile model as part of that patch
- do not move fields between onboarding, settings, and plan setup unless explicitly scoped

## Known Risks And Assumptions

- The Slice 1 migration may still need to be applied in Supabase before deployed code can write the new columns.
- `workout_plans.progression_mode` is intentionally nullable at the database level; app code sets it when plan-goal context is available.
- Slice 3 defaults progression mode from goal type and light profile/constraint context; it does not expand progression algorithms.
- Ambiguous legacy profile goals should not be backfilled to `general_fitness`; only obvious goal text should receive `primary_goal_type`.
- Slice 2 preserves existing non-null profile fields when submitted optional onboarding values are null, empty strings, or empty arrays; Slice 5B1 adds explicit clearing only through settings profile edits.
- Slice 5B1 settings updates use partial PATCH semantics; omitted fields are preserved, while included empty values are intentional clears.
- Slice 5B1 needs a small validation UX follow-up if settings field errors are not clear enough to the user.
- Profile field ownership is not fully settled. Fields such as training experience and activity level may later move conceptually toward onboarding/setup context, plan-context inputs, or last-known context rather than permanent durable settings.
- Slice 5B2 added `workout_plans.setup_context`; Supabase projects need the new migration applied before guided setup context can be saved.
- Older plans may not have saved setup context, so the regenerate path still reconstructs only safe fields and asks users to confirm missing setup details.
- Saved-plan detail edits and setup/regenerate edits both replace the live plan structure after review. Workout and exercise names are snapshotted first, but old sessions should not be treated as progress toward the newly changed structure.
- `/plans/[planId]/edit-setup` still exists even though it is no longer surfaced from the main plan-detail page; a later product call can decide whether to keep that direct route long-term.
- Guided plan update is not fully transactional because the app still uses route-handler Supabase writes rather than a SQL RPC; a future RPC would be safer before broader public use.
- Session save plus phase action updates are not fully atomic yet; a future SQL RPC would be stronger before broader public use.
- Slice 4.5 intentionally did not rename `plan_phases`, `phase-action`, `currentPhase`, `PhaseProgressPanel`, `PhaseProgressSummary`, `PlanPhase`, `StructuredPhaseInput`, existing phase-shaped payload fields, route/file names, or progression algorithm terms used internally.
- Slice 5A uses coarse deterministic filtering only; it is not a medical/PT rules engine and should not be treated as individualized clinical guidance.
- Running drafts still model run/walk and easy-run sessions as exercise entries because the app does not yet have a dedicated running-session domain model.
- Goal-aware template quality is stronger, but the static catalog remains intentionally small and code-owned until a later catalog/admin workflow exists.
- Existing old plans use default structured rule settings and keep old text criteria for display.
- The starter exercise catalog is static TypeScript data for now, not an admin-editable database table.
- Saved phase/workout/exercise deletes and guided setup edits replace or delete live plan structure, so browser testing should confirm history snapshots remain readable.
- Sessions with no recoverable phase snapshot do not count toward live phase progress.
- Logged-in browser testing is still needed for onboarding, guided draft generation, generated draft edit/save with Phase terminology, manual plan creation, plan activation, deletion/archive behavior, and mobile layout.
- Post-QA follow-up is still needed for settings/profile field-level validation messaging if not already patched.

## Important Files

- `app/plans/[planId]/page.tsx`
- `app/plans/[planId]/edit/page.tsx`
- `app/plans/new/page.tsx`
- `app/plans/[planId]/edit-setup/page.tsx`
- `components/plan-archive-action.tsx`
- `components/plan-setup-wizard.tsx`
- `components/plan-builder-form.tsx`
- `components/plan-management-actions.tsx`
- `app/api/plan-drafts/route.ts`
- `app/api/plans/route.ts`
- `app/api/plans/[planId]/route.ts`
- `app/api/profile/route.ts`
- `app/api/onboarding/route.ts`
- `app/settings/page.tsx`
- `app/onboarding/page.tsx`
- `app/page.tsx`
- `components/profile-settings-form.tsx`
- `lib/plan-write.ts`
- `lib/plan-edit-draft.ts`
- `lib/plan-save-input.ts`
- `lib/plan-setup-context.ts`
- `lib/starter-plan-generator.ts`
- `lib/exercise-library.ts`
- `lib/plan-drafting/plan-draft-provider.ts`
- `lib/progression-mode.ts`
- `lib/profile-options.ts`
- `lib/profile-settings.ts`
- `lib/plan-labels.ts`
- `lib/types.ts`
- `lib/validation.ts`
- `lib/__tests__/profile-settings.test.ts`
- `lib/__tests__/plan-edit-draft.test.ts`
- `lib/__tests__/plan-setup-context.test.ts`
- `lib/__tests__/plan-drafting-foundation.test.ts`
- `lib/data.ts`
- `supabase/schema.sql`
- `supabase/migrations/20260413120000_training_profile_and_progression_mode.sql`
- `supabase/migrations/20260414100000_plan_setup_context.sql`
- `docs/architecture.md`
- `docs/current-task.md`
- `docs/roadmap.md`

## Verification Notes

For code changes, usually run:

- `npm run test`
- `npm run typecheck`
- `npm run build`

Most recent Slice 3 verification:

- `npm run test` passed on April 13, 2026.
- `npm run typecheck` passed on April 13, 2026.
- `npm run build` passed on April 13, 2026.

Most recent Slice 4 verification:

- Terminology search run locally; remaining `phase`/`Phase` hits are internal compatibility names, docs context, or unused mock data.
- `npm run test` passed.
- `npm run typecheck` passed.
- `npm run build` passed.

Most recent Slice 4.5 verification:

- Terminology search run locally; remaining lowercase `block` hits in app code are Tailwind/CSS display classes, and remaining "Block" docs hits are Slice 4 historical context.
- `npm run test` passed.
- `npm run typecheck` passed.
- `npm run build` passed.

Most recent Slice 5A verification:

- `npm run test` passed.
- `npm run typecheck` passed.
- `npm run build` passed.

Most recent Slice 5B1 verification:

- `npm run test` passed.
- `npm run typecheck` passed.
- `npm run build` passed.

Most recent Slice 5B2 verification:

- `npm run typecheck` passed.
- `npm run test` passed: 4 files, 25 tests.
- `npm run build` passed.

Most recent Slice 5B3 verification:

- `npm run test` passed: 5 files, 26 tests.
- `npm run typecheck` passed.
- `npm run build` passed.

Most recent post-5B3 cleanup patch verification:

- `npm run test` passed.
- `npm run typecheck` passed.
- `npm run build` passed.

Most recent Slice 9I verification:

- `npm run typecheck` passed.
- `npm run test` passed: 8 files, 48 tests.
- `npm run build` passed and confirmed `/`, `/dashboard`, `/plans`, `/plans/new`, `/workout`, and `/settings` remain in the route list.
- `next-env.d.ts` changed as a generated build artifact and was restored before commit.

Manual browser verification still needed:

- fresh auth and onboarding/profile creation
- guided draft generation and retry/error states
- generated draft quality across recovery, general fitness, strength, hypertrophy, running, sport performance, and consistency
- generated draft edit and save, including visible Phase terminology in the review builder
- saved-plan detail edit launch from an existing plan
- saved-plan detail edit save back to the same plan
- direct visit to guided setup/regenerate from an existing plan
- guided edit setup reconstruction for older plans without saved `setup_context`
- guided edit draft review/save back to the same plan
- history readability after a saved-plan detail edit or guided edit replaces live plan structure
- compact/mobile UI for badges, cards, headers, and progress surfaces with the Phase wording
- manual `/plans/new?mode=manual` save
- dashboard, workout, and onboarding redirects when the user has a profile but no plan
- mobile layout usability
