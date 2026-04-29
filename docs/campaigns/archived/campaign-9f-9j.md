# Autonomous Campaign Brief — Authenticated UX Redesign Campaign: Slices 9F–9J

## Campaign name

Authenticated UX Redesign Campaign: 9F–9J

## Campaign status and starting point

This campaign starts after the public landing page, app icon/PWA asset work, public/authenticated route split, and design-system foundation have been completed.

Expected completed foundation before this campaign:

- Public landing page lives at `/`
- Authenticated dashboard lives at `/dashboard`
- Authenticated app routes remain protected
- Authenticated app shell renders on authenticated app routes only
- Public `/` remains shell-free even for signed-in users
- Landing page has auth-aware CTAs
- Final app icon direction has been integrated across app/PWA/browser surfaces
- Shared design tokens/primitives from Slice 9B are available
- The selected visual direction is now the UX north star for the authenticated app

If the repository docs do not reflect this state, stop before implementation and report the mismatch.

## Why this campaign is approved

The repository roadmap defines a coherent authenticated redesign program from Slice 9F through Slice 9J:

1. Slice 9F — Authenticated App Shell Redesign
2. Slice 9G — Dashboard Redesign
3. Slice 9H — Plans / Phase UX Redesign
4. Slice 9I — Workout Execution UX Redesign
5. Slice 9J — Plan Creation / Settings Polish

These slices modernize the authenticated product experience while preserving the app’s core adaptive-training engine:

- profiles
- plans/programs
- phases/blocks
- workouts
- exercises
- sessions/check-ins
- progression recommendations
- explicit user-confirmed progression/phase movement

The campaign is approved because:

- the sequence is already defined in the roadmap
- the architecture constraints are documented
- the public landing and icon work established a visual direction
- the remaining work is primarily UI/UX, product-flow, and presentation
- each slice can be implemented, verified, reviewed, and merged independently

## Source-of-truth docs

Before every slice, read and reconcile:

- `docs/roadmap.md`
- `docs/current-task.md`
- `docs/agent-handoff.md`
- `docs/architecture.md`
- `AGENTS.md`

If these docs conflict with this campaign brief:

- stop
- report the conflict
- do not silently resolve it
- treat `docs/current-task.md` and `docs/agent-handoff.md` as the tie-breakers for the active slice, unless they are clearly stale relative to an approved human instruction

## Design references and visual source of truth

The authenticated redesign must align with the visual direction established by:

- the implemented public landing page
- the final app icon/PWA assets
- existing design-reference images in `docs/design_references/` or the current documented design reference path
- the shared 9B tokens/primitives

Before each slice, inspect available design references and current implemented UI. If reference file paths differ from the docs, search `docs/` for the actual files and report the paths before coding.

Visual direction:

- premium consumer fitness-tech aesthetic
- mobile-first
- warm white/off-white primary surfaces
- dark navy elevated product panels
- green primary brand accent
- blue secondary accent
- selective coral/orange/purple goal-category accents
- rounded cards
- soft shadows
- clean sans-serif typography
- high-quality icons
- strong product-led dashboard and card design
- no generic SaaS blandness
- no generic workout logger feel
- no random stock photography
- no billing/pricing/trial language

Typography rule:

- Use clean sans-serif typography.
- Do not introduce serif/display fonts unless explicitly approved.
- Preserve readability and consistency across dashboard, plans, workout, plan creation, and settings.

Icon rule:

- Use substantial, consistent icons.
- Avoid tiny low-quality line icons.
- Use existing icon system or inline SVGs where appropriate.
- Keep stroke width, corner radius, and visual scale consistent.

## Approved slice order

Codex may work only through this sequence:

1. Slice 9F — Authenticated App Shell Redesign
2. Slice 9G — Dashboard Redesign
3. Slice 9H — Plans / Phase UX Redesign
4. Slice 9I — Workout Execution UX Redesign
5. Slice 9J — Plan Creation / Settings Polish

Codex must not:

- add unapproved slices
- reorder slices
- merge multiple slices into one oversized PR
- expand into unrelated roadmap areas
- begin a future slice if the current slice has failing checks, unclear docs, or unresolved blockers

## Campaign goals

The campaign should produce an authenticated product that feels consistent with the new landing page and app icon.

Primary goals:

- Redesign the authenticated experience around the selected visual system
- Make the app feel like one coherent product from landing → dashboard → plan → workout → settings
- Preserve the recovery-first, progression-aware roots
- Broaden the UX for recovery, general fitness, strength, hypertrophy, running, performance, and consistency
- Make phase/progression/adaptation more visible and understandable
- Improve mobile usability and layout quality
- Preserve all current persistence, auth, and progression behavior unless explicitly scoped

Product goal:

The app should feel like a structured adaptive training platform, not a generic workout logger.

## Campaign-wide architecture boundaries

Throughout this campaign, preserve:

- `/` as public landing page
- `/dashboard` as authenticated dashboard
- protected-route behavior for:
  - `/dashboard`
  - `/onboarding`
  - `/plans`
  - `/plans/new`
  - `/plans/[planId]`
  - `/plans/[planId]/edit`
  - `/plans/[planId]/edit-setup`
  - `/workout`
  - `/settings`
  - compatibility app routes such as `/today` and `/check-in`, if still present
- current auth assumptions
- current Supabase schema
- current Supabase RLS assumptions
- current plan/program → phase → workout → exercise → session model
- current server-side progression evaluation behavior
- current saved-plan edit versus setup/regenerate boundaries
- provider-free app operation
- manual plan creation availability
- LLM/provider work deferred unless a future approved slice explicitly introduces it

## Campaign-wide non-goals

The campaign must not:

- change database schema
- change Supabase RLS
- rewrite auth behavior
- rewrite protected-route middleware/proxy behavior
- move route boundaries again
- rename database tables
- rename compatibility fields such as `plan_phases`, `phase-action`, or `currentPhase`
- introduce provider-backed LLM integration
- make the app require an LLM to function
- rewrite the progression engine
- change workout/session persistence semantics
- change onboarding persistence contracts
- introduce billing, subscriptions, pricing, trials, or payment language
- perform external dashboard/manual environment setup
- add heavy dependencies without explicit justification
- fetch external images or add random stock photography
- expand into unrelated roadmap items

## Data and behavior safety rules

For every slice:

- Treat data loaders, API calls, server actions, and persistence code as high-risk.
- Prefer presentational changes.
- Preserve existing tests and add focused tests only where logic changes are unavoidable.
- Do not use static/fake data on authenticated app pages unless it is clearly decorative and not replacing real user data.
- Public marketing previews may use static data.
- Authenticated product surfaces must use real existing app data or existing empty states.

If a slice requires a behavior change to achieve the UX:

- stop
- report the need
- explain the tradeoff
- do not implement it unless explicitly approved

## Branch and PR policy

Each slice must be implemented on its own branch.

Branch names:

- `feature/slice-9f-authenticated-app-shell-redesign`
- `feature/slice-9g-dashboard-redesign`
- `feature/slice-9h-plans-phase-ux-redesign`
- `feature/slice-9i-workout-execution-ux-redesign`
- `feature/slice-9j-plan-creation-settings-polish`

Preferred branch lineage:

- If the previous slice has already been merged to `main`, start from latest `main`.
- If the campaign is being stacked before merge, start from the previous successful slice branch.
- Never start from a branch with failing checks or unresolved QA blockers.
- Never continue from an interrupted/crashed branch without a recovery audit.

Before starting a slice:

```bash
git status
git branch --show-current
npm run typecheck
npm run test
npm run build
```

If the working tree is dirty, stop and report.

## Required preflight before each slice

Before implementation, Codex must:

1. Read the source-of-truth docs.
2. Confirm the current branch and working-tree state.
3. Confirm the previous slice is complete or explain why it is safe to proceed.
4. Summarize the current relevant app state.
5. Restate:
   - why this slice is next
   - what is in scope
   - what is out of scope
   - which files are likely to be touched
   - which files should not be touched
6. Confirm the route/auth/schema/progression/LLM boundaries remain unchanged.
7. Confirm whether design-reference files are available.
8. Identify manual QA needed after the slice.

If the docs and campaign brief conflict, stop.

## Required implementation discipline

For every slice:

- Prefer the smallest high-quality change that accomplishes the slice.
- Use shared primitives and semantic tokens where practical.
- Avoid one-off hardcoded styling unless local to a tightly scoped component.
- Do not make sweeping refactors.
- Do not redesign unrelated pages.
- Do not hide layout problems with page-level `overflow-hidden`.
- Preserve dark/light mode readability.
- Preserve mobile usability.
- Use accessible semantic markup.
- Avoid fragile animation.
- Do not add animation libraries.
- If animation is added, respect reduced motion.

## Verification required after each slice

Run:

```bash
rm -rf .next
npm run typecheck
npm run test
npm run build
```

The final report must include:

- whether `/` still exists
- whether `/dashboard` still exists
- whether protected app routes still build
- whether tests passed
- whether the build passed
- whether any generated files changed, such as `next-env.d.ts`

If `next-env.d.ts` changes only as a generated artifact, report it clearly and do not commit it unless it is intentionally required by the repository state.

## Manual QA policy

This is an autonomous implementation campaign, not an autonomous product approval campaign.

Codex may implement a slice autonomously, but should stop at the end of each slice unless the user explicitly approved multi-slice continuation.

Codex may continue to the next slice only if:

- all checks pass
- no blocker or high-confidence regression is found
- docs are aligned
- no manual environment work is required
- the slice did not materially alter roadmap or architecture
- the next slice is clearly documented as next
- the user has explicitly approved continuation beyond the current slice

Human review is required before merge to `main`.

After every slice, Codex must list manual QA checks. If browser QA was not performed, say so directly.

Recommended manual QA after every slice:

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

## Visual QA expectations

For each UI slice, Codex should assess:

- layout spacing
- mobile responsiveness
- dark/light readability
- icon scale and consistency
- typography consistency
- whether the page feels aligned with the landing page
- whether the page still communicates adaptive progression
- whether empty/loading/error states remain usable

If possible, include screenshots or a written visual QA summary. If screenshots are not available, explicitly state that browser visual QA was not performed.

## Required docs updates after each slice

After implementation, update only what is needed:

Always update:

- `docs/current-task.md`
- `docs/agent-handoff.md`

Update if status changes:

- `docs/roadmap.md`

Update only if architectural direction changed:

- `docs/architecture.md`

Update only if user-facing setup/routing docs changed:

- `README.md`

Docs must record:

- slice completed
- files or areas changed
- intentionally unchanged areas
- next slice
- known risks / QA still needed
- confirmation that schema/RLS/auth/progression/LLM boundaries were preserved

Do not over-document implementation details that will quickly become stale.

## Stop rules

Stop immediately if:

- any required check fails
- `/` disappears from the build route list
- `/dashboard` disappears from the build route list
- protected route behavior is changed unintentionally
- app shell disappears from authenticated routes
- the public app shell appears on `/` unexpectedly
- docs contradict the implementation
- the slice touches schema/RLS/auth/progression unexpectedly
- the slice introduces an unapproved dependency
- the slice requires manual environment work, secrets, or dashboard setup
- the visual output is materially worse or clearly off-direction
- a crash/interruption leaves the branch in uncertain state

If a crash/interruption happens:

1. Stop.
2. Create a checkpoint branch if needed.
3. Inspect `git status`, `git diff --stat`, and changed files.
4. Restore from the last clean slice branch if route files are missing.
5. Do not continue visually until typecheck/test/build pass and `/` + `/dashboard` exist.

## Continuation rules

Codex may continue automatically to the next slice only if all are true:

- user explicitly approved multi-slice continuation
- current slice checks pass
- current slice review finds no blocker
- manual QA is not required to resolve uncertainty
- docs are aligned
- next slice is clearly documented
- branch is pushed
- completion report is produced

Otherwise, stop and ask for human review.

## Slice 9F — Authenticated App Shell Redesign

### Goal

Redesign the authenticated shell/header/navigation so the logged-in app visually aligns with the new landing page and app icon.

### Scope

Focus on:

- authenticated layout shell
- header/sidebar/bottom navigation
- app logo/brand treatment
- mobile navigation
- responsive shell structure
- active route states
- light/dark mode shell styling
- preserving route behavior

Likely files:

- `components/app-shell.tsx`
- shared navigation components
- `components/app-logo.tsx`
- shell/layout styling
- possibly shared primitives

Do not touch unless absolutely necessary:

- `proxy.ts`
- `app/layout.tsx`
- `app/page.tsx`
- `app/dashboard/page.tsx`
- protected page internals
- database/API/progression files

### UX acceptance criteria

- Authenticated app feels visually connected to landing page.
- Navigation is easy to access on desktop and mobile.
- Dashboard, Plans, Workout, Settings remain easy to find.
- Active route state is clear.
- App shell is not shown on public `/`.
- App shell remains shown on authenticated app routes.
- Mobile nav is thumb-friendly.
- No route/auth behavior changes.

### Non-goals

Do not turn 9F into:

- dashboard redesign
- plans redesign
- workout redesign
- route-boundary rewrite
- schema/auth/progression/LLM slice

## Slice 9G — Dashboard Redesign

### Goal

Redesign the authenticated dashboard around today’s training guidance, current plan/phase, weekly progress, and progression-aware next actions.

### Scope

Focus on:

- dashboard layout
- current plan / current phase visibility
- next workout card
- recent activity
- weekly preview
- progression prompt/recommendation display
- empty states
- mobile dashboard hierarchy

Use real existing dashboard data. Do not replace app data with static mock data.

Likely files:

- `app/dashboard/page.tsx`
- dashboard-specific components
- existing dashboard helpers only if needed for presentation
- shared card/metric primitives

### UX acceptance criteria

- User can quickly answer: “What should I do today?”
- Current plan and phase are visible.
- Next workout is prominent.
- Progression state/recommendation is clear where existing data supports it.
- Empty/no-active-plan state routes clearly to plan creation.
- Mobile layout is clean and not cramped.
- No progression-engine behavior changes.

### Non-goals

Do not turn 9G into:

- progression engine rewrite
- schema/API/auth work
- plan creation redesign
- workout execution redesign

## Slice 9H — Plans / Phase UX Redesign

### Goal

Redesign plan list/detail and phase UX so the app’s structured progression model is easier to understand and use.

### Scope

Focus on:

- plans list visual hierarchy
- active plan card
- saved plan detail UX
- phase timeline / phase cards
- workouts grouped under phases
- edit/archive/activate actions presentation
- phase progression status framing
- mobile plan detail layout

Likely files:

- `app/plans/page.tsx`
- `app/plans/[planId]/page.tsx`
- plan detail components
- phase/workout display components

### UX acceptance criteria

- Active plan is obvious.
- Phase structure is easy to understand.
- Current phase is clearly highlighted.
- Workouts are easy to find within a plan.
- Edit/archive/setup actions are discoverable but not overwhelming.
- Recovery and broader fitness use cases both still make sense.
- No plan-domain or persistence rewrite.

### Non-goals

Do not turn 9H into:

- schema change
- major plan builder rewrite
- progression engine rewrite
- saved-plan contract rewrite
- manual-builder redesign unless explicitly documented as already in scope

## Slice 9I — Workout Execution UX Redesign

### Goal

Redesign the in-workout experience so users can execute workouts clearly, log results confidently, and understand what happens after completion.

### Scope

Focus on:

- workout session layout
- exercise cards
- set/rep/load/RPE controls if already present
- completion flow
- check-in/pain/effort capture if already present
- post-save result/recommendation display
- mobile-first workout usability
- reducing cognitive load during workout

Likely files:

- `app/workout/page.tsx`
- workout execution components
- check-in/session components
- timer/progress components if already present

### UX acceptance criteria

- User can start and complete a workout without confusion.
- Exercise order and current progress are clear.
- Logging controls are easy on mobile.
- Save/finish behavior is obvious.
- Existing session save behavior remains intact.
- Any progression result shown is based on existing server-side logic.
- No workout-domain model rewrite.

### Non-goals

Do not turn 9I into:

- new workout engine
- schema change
- progression algorithm rewrite
- new exercise catalog project
- timer overreach beyond documented scope

## Slice 9J — Plan Creation / Settings Polish

### Goal

Polish plan creation and settings so they visually match the redesigned authenticated app and preserve the existing setup → draft → review/edit → save contract.

### Scope

Focus on:

- `/plans/new`
- plan setup flow
- draft/review presentation
- settings/profile forms
- theme selector readability
- form/card consistency
- mobile form usability
- final polish across redesigned app surfaces

Likely files:

- `app/plans/new/page.tsx`
- plan setup components
- draft/review components
- `app/settings/page.tsx`
- settings/profile components

### UX acceptance criteria

- Plan creation feels guided and consistent with the redesigned app.
- User can still review before saving.
- Existing manual/guided setup behavior is preserved.
- Settings are readable in light and dark mode.
- Theme/profile controls remain functional.
- No provider-backed LLM requirement is introduced.

### Non-goals

Do not turn 9J into:

- provider-backed AI integration
- new settings data model
- schema/RLS/auth changes
- full onboarding rewrite
- broad roadmap expansion

## Intentionally deferred beyond this campaign

Deferred:

- provider-backed LLM integration
- schema/RLS/auth model changes
- workout-domain model changes
- broad progression engine redesign
- admin-editable exercise catalog
- advanced animation system
- full visual design system documentation site
- new billing/pricing/subscription work
- unrelated future roadmap items

## Required final campaign deliverable

If the campaign reaches its natural stopping point or completes through 9J, produce a final summary including:

- completed slices
- branch names
- pushed branches
- merged PRs, if any
- skipped or blocked slices
- files/areas most changed
- known risks
- manual QA still most important
- recommended next human decision before merge or further roadmap work
- recommended next roadmap area after 9J
