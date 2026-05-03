# Autonomous Campaign Brief — Slice 9N: Comprehensive UX Cleanup And AI Draft QA Patch

## Campaign name

Slice 9N — Comprehensive UX Cleanup And AI Draft QA Patch

## Campaign status

Status: completed and merged to `origin/main`; archived as reference.

Implementation branch:

```text
codex/slice-9n-comprehensive-ux-cleanup
```

Implementation summary:

- Draft with AI now uses a fixed 1-7 days-per-week control and resets selected days to the required default weekday mappings.
- Draft with AI selected weekdays stay aligned with selected days-per-week.
- Draft with AI step navigation scrolls to the active step top and wizard headers are more compact.
- Prompt export tells external LLMs not to include weekdays in workout names and to provide scheduled day separately in the workout `day` field.
- Valid imported workout days are preserved through import/review/structured conversion; invalid days fail validation.
- Dashboard Current Plan snapshot was removed, while today's training, current phase, weekly rhythm, recent activity, progression prompt, and compact metrics remain.
- Touched dashboard, plans, plan detail, plan creation, workout, settings, and login surfaces received copy, typography, desktop rhythm, and dark-mode readability cleanup.

Validation:

- `npm run typecheck` passed.
- `npm run test` passed: 8 files, 52 tests. A sandboxed run hit Windows `spawn EPERM`; approved rerun passed.
- `npm run build` passed. A sandboxed build hit Windows `spawn EPERM`; approved rerun passed.
- `npm run lint` failed with the known Next 16 setup issue where `next lint` is interpreted as a project directory named `lint`.

Manual browser QA was not performed in Codex. Vercel preview review should cover the manual smoke checklist before merge.

Preserved boundaries: no provider-backed LLM integration, no API-key handling, no runtime LLM dependency, no schema migration, no Supabase/RLS changes, no auth changes, no progression-engine changes, no unvalidated AI draft save path, and no Slice 10 exercise media/instruction-layer work.

## Starting point

This campaign starts after the Slice 9K–9M AI Draft Plan UX Campaign has been implemented.

Expected completed foundation before this campaign:

- Slice 9J — Plan Creation / Settings Polish is complete.
- Slice 9K — AI Draft Setup Wizard is complete.
- Slice 9L — External LLM Handoff UX is complete.
- Slice 9M — AI Draft Import Ergonomics is complete.
- The app still supports:
  - Guided Setup.
  - Manual Builder.
  - Draft with AI.
  - setup -> draft -> review/edit -> save.
  - strict validation before saving AI-generated plans.
  - provider-free external AI workflow.
- Slice 10 — Exercise Media And Instruction Layer has not started yet.

If the repository docs do not reflect this state, Codex should stop before implementation and report the mismatch.

## Why this campaign is approved

This campaign is approved because post-9K–9M QA surfaced issues that should be corrected before moving to Slice 10.

The campaign combines two bodies of work:

1. AI Draft Plan Flow QA fixes discovered after Slice 9K–9M.
2. Previously deferred UX polish that is now explicitly rescoped into the immediate pre-Slice-10 cleanup:
   - desktop responsive polish
   - dashboard simplification and content-density cleanup
   - app-wide copy reduction
   - typography consistency
   - theme and dark-mode readability QA

This campaign should be treated as a focused stabilization and UX-quality pass, not a new product direction.

The purpose is to clean up the current experience before adding new Slice 10 exercise-media capabilities.

## Source-of-truth docs

Historical source-of-truth docs for this completed campaign were:

- `docs/roadmap.md`
- `docs/current-task.md`
- `docs/product.md`
- `docs/architecture.md`
- `docs/campaigns/ai-draft-plan-ux.md`
- `docs/campaigns/archived/comprehensive-ux-cleanup.md`
- `AGENTS.md`

At the time of implementation, if these docs conflicted with this campaign brief:

- stop
- report the conflict
- do not silently resolve it
- treat `docs/current-task.md` as the tie-breaker for active work unless it is clearly stale relative to the approved user instruction that Slice 9N should happen before Slice 10

## Project workflow assumptions

This project uses a Windows-native Codex workflow.

Expected execution environment:

- Codex app
- Windows-native agent
- PowerShell
- worktree-based implementation
- main repo path: `C:\Code\Workout-App`
- Codex worktree path: under `C:\Users\<user>\.codex\worktrees\...`

Do not assume WSL.

Use PowerShell-compatible commands.

## Campaign branch

Use one implementation branch:

```text
codex/slice-9n-comprehensive-ux-cleanup
```

This campaign should be implemented as one cohesive cleanup branch, not as a stacked multi-branch campaign.

Human review is required before merge to `main`.

## Campaign goal

Improve the app’s current UX quality before Slice 10 by:

- correcting AI Draft Plan Flow issues from post-9K–9M QA
- simplifying the dashboard
- reducing excessive app copy
- improving desktop layout quality
- making typography more consistent
- improving light/dark readability
- fixing clear dark-mode text issues, especially on sign-in/login
- preserving all existing product, architecture, auth, progression, and provider-free AI guardrails

The result should feel like a cleaner, more focused adaptive training app.

The user should more quickly understand:

- what to do today
- where they are in plan creation
- how to move through Draft with AI
- how to use an external LLM safely
- how to import/review generated plan output
- where to find plan details without redundant dashboard clutter

## Product principle

This app is a structured adaptive training platform, not a generic workout logger.

Preserve the product differentiation:

- structured programs/plans
- phases/blocks
- workouts
- exercises
- sessions/check-ins
- progression logic
- readiness/adaptation behavior
- personalization
- rehab-informed and broader fitness support
- user-confirmed review/edit/save behavior

This campaign should make the app cleaner and easier to use without weakening its adaptive-training model.

## Campaign-wide architecture boundaries

Throughout this campaign, preserve:

- `/` as public landing page
- `/dashboard` as authenticated dashboard
- protected-route behavior for authenticated app routes
- public/authenticated route boundary
- existing auth helpers
- existing Supabase schema
- existing Supabase RLS behavior
- existing plan/program -> phase -> workout -> exercise -> session model
- existing progression engine behavior
- existing saved-plan and active-phase behavior
- existing provider-free app operation
- Guided Setup
- Manual Builder
- Draft with AI
- review/edit before save
- strict validation before save
- theme support through existing semantic tokens/shared primitives where practical

Do not change route boundaries, auth behavior, schema, RLS, or progression logic.

## Campaign-wide non-goals

This campaign must not:

- add provider-backed LLM integration
- add API-key handling
- add runtime LLM dependency
- add schema migrations
- change Supabase RLS
- change auth behavior
- change progression-engine behavior
- weaken AI draft validation
- bypass review-before-save
- save unvalidated AI output
- implement Slice 10 exercise media work
- add a new exercise media/instruction layer
- introduce a parallel plan creation system
- rewrite the dashboard data model
- rewrite the app shell
- restructure route boundaries
- introduce billing, pricing, subscription, trial, or payment language
- add heavy dependencies without explicit justification
- fetch external images or add random stock photography
- perform broad app rewrite
- replace the existing theme system
- make the app require an LLM to function

## Design and UX direction

The campaign should preserve the existing visual direction:

- premium consumer fitness-tech aesthetic
- mobile-first UX
- responsive desktop layouts
- rounded cards
- clean sans-serif typography
- clear hierarchy
- semantic tokens and shared primitives where practical
- warm/off-white light surfaces
- dark navy product surfaces where already established
- green primary accent
- blue secondary accent
- selective goal-category accent colors only where helpful
- no generic SaaS blandness
- no generic workout-logger feel

The app should feel calmer, more visual, and easier to scan.

Primary actions should be visually clearer.

Supporting copy should be shorter.

The user should not have to read long paragraphs to understand what to do next.

## Design references and prior campaign alignment

This campaign should follow the discipline used in prior campaign briefs such as `docs/campaigns/archived/campaign-9f-9j.md`:

- define source-of-truth docs
- define campaign-wide boundaries
- define non-goals
- define implementation discipline
- define verification expectations
- define manual QA expectations
- define docs-update expectations
- define stop rules
- keep changes scoped and reviewable
- preserve architecture and product contracts

This campaign differs from 9F–9J because it is not a new redesign program. It is a cleanup/stabilization pass after the redesign and AI Draft UX campaign.

## Implementation strategy

Implement this as a single cohesive campaign branch.

Priority order within the branch:

1. Fix highest-risk AI Draft functional issue:
   - preserve scheduled day during import/review.
2. Fix remaining AI Draft setup/export/import QA items.
3. Simplify dashboard content hierarchy.
4. Reduce app-wide copy and oversized text.
5. Improve typography consistency.
6. Fix dark-mode readability issues.
7. Improve desktop responsive polish.
8. Update docs after implementation.

Codex should avoid broad rewrites.

Codex should prefer targeted changes that map directly to this document.

If a cleanup item becomes too broad or risky, implement the smallest safe version and record a deferred follow-up.

## Primary workstream A — AI Draft Plan Flow QA fixes

### A1. Days-per-week input should be fixed choice

Current problem:

- On mobile, changing the number of training days per week requires manual number entry.
- There are only seven valid choices.
- Manual numeric entry is unnecessarily awkward.

Required behavior:

- Replace the manual numeric entry with a fixed-choice control.
- Acceptable controls:
  - select/dropdown
  - segmented choice
  - equivalent fixed option control
- Valid options:
  - 1
  - 2
  - 3
  - 4
  - 5
  - 6
  - 7

UX requirements:

- Prioritize mobile ergonomics.
- Do not require the user to type a number.
- Keep the label concise.
- Avoid adding long helper copy.

Acceptance criteria:

- User can select 1–7 training days without typing.
- Selected value updates reliably.
- The control is readable in light and dark mode.
- The control is usable on mobile.
- Existing prompt generation still receives the selected count.

### A2. Selected training days must stay consistent with days-per-week

Current problem:

- When the user lowers the number of training days per week, highlighted training days may remain inconsistent with the selected count.
- Example problem: selected count says 3 days, but 5 days remain highlighted.

Required behavior:

- Selected training days must always match the selected days-per-week count.
- When days-per-week changes, reset selected days to a sensible default mapping.

Default mapping:

- 1 day: Monday
- 2 days: Monday / Thursday
- 3 days: Monday / Wednesday / Friday
- 4 days: Monday / Tuesday / Thursday / Friday
- 5 days: Monday / Tuesday / Wednesday / Thursday / Friday
- 6 days: Monday / Tuesday / Wednesday / Thursday / Friday / Saturday
- 7 days: Monday / Tuesday / Wednesday / Thursday / Friday / Saturday / Sunday

Rationale:

- This keeps the flow moving.
- It avoids forcing extra user work.
- It prevents confusing mismatches between count and highlighted days.

Acceptance criteria:

- Changing from a higher count to a lower count updates selected days immediately.
- Changing from a lower count to a higher count updates selected days immediately.
- Highlighted day count always equals days-per-week.
- Generated prompt uses the selected days.
- No mismatch is possible in the UI state.

### A3. Wizard navigation should scroll to active step top

Current problem:

- When the user presses Next or Back, the next step can load with the viewport still positioned mid-page.
- This makes the flow feel confusing, especially on mobile.

Required behavior:

- On forward or backward step navigation, scroll to the top of the active step content.
- The viewport should place the user near:
  - step indicator
  - step title
  - short instructions

UX requirements:

- Prioritize mobile behavior.
- Avoid jarring scroll if not needed.
- Respect normal browser behavior and avoid fragile animation.
- Do not hide layout problems with `overflow-hidden`.

Acceptance criteria:

- Next moves the user to the top of the next step content.
- Back moves the user to the top of the prior step content.
- User sees the step indicator/title/instructions after navigation.
- Behavior works on mobile and desktop.

### A4. Wizard header/content density should be reduced

Current problem:

- After entering the guided setup flow, each step still includes too much repeated introductory content.
- Repeated “Create plan,” broad flow details, plan setup explanation, or similar content makes the wizard harder to scan.

Required behavior:

- Once the user is inside the Draft with AI guided setup, simplify the top area.
- Keep:
  - compact step indicator
  - current step title
  - short step instructions
  - small option to switch setup mode if appropriate
- Remove, collapse, or avoid repeating:
  - broad setup explanations
  - repeated page-level intro copy
  - redundant “current plan” or flow-detail framing
  - oversized helper text

Acceptance criteria:

- Each Draft with AI step has a compact, focused top area.
- The user can tell where they are and what to do next.
- Repeated setup copy is removed or meaningfully reduced.
- The setup flow still feels guided.
- Guided Setup and Manual Builder remain available.

### A5. AI prompt export should prevent weekday duplication in workout names

Current problem:

- AI-generated workout names may include the scheduled weekday.
- Example bad output:
  - `Tuesday Lower Body Strength`
- This is redundant because the workout day is already represented separately.

Required behavior:

- Update the generated prompt instructions to explicitly tell the external LLM not to include scheduled weekdays in workout names.
- The scheduled day should appear in the workout day field only.

Required prompt rule:

> Do not include the scheduled day of the week in the workout name. The scheduled day should be provided separately in the workout’s day field.

Desired output example:

- Workout name:
  - `Lower Body Strength`
- Workout day:
  - `Tuesday`

Avoid:

- Workout name:
  - `Tuesday Lower Body Strength`

Acceptance criteria:

- Generated prompt includes the explicit no-weekday-in-workout-name instruction.
- Prompt examples, if present, follow the rule.
- Prompt still requests scheduled day separately.
- No provider-backed LLM integration is added.

### A6. Import/review should preserve scheduled day from valid AI output

Current problem:

- If AI output includes a scheduled day for a workout, the imported/reviewed workout may not preserve that day.
- This loses structured scheduling information.

Priority:

- Highest-priority functional fix in this campaign.

Required behavior:

- If valid AI draft output includes a workout scheduled day, preserve it through import/review.
- The reviewed/imported plan should assign the workout to the same scheduled day.

Example:

- AI output says:
  - workout name: `Lower Body Strength`
  - day: `Tuesday`
- Import/review should show:
  - workout assigned to Tuesday

Constraints:

- Preserve strict validation.
- Do not weaken parsing just to accept messy output.
- Do not save unvalidated AI output.
- Review/edit before save remains mandatory.
- Do not require schema changes unless explicitly approved.
- If scheduled-day preservation cannot be done without schema changes, stop and report.

Testing expectations:

- Add or update tests for scheduled-day preservation if the current test structure supports it.
- At minimum, test that a valid AI draft with scheduled days preserves those days through import normalization/review data.

Acceptance criteria:

- Valid AI output with scheduled days preserves those days.
- Invalid scheduled-day output fails safely or is normalized according to existing validation rules.
- Review/edit/save remains mandatory.
- Strict validation remains in place.
- No schema/RLS/auth/progression changes are introduced.

## Primary workstream B — Dashboard simplification and content-density cleanup

### B1. Dashboard product intent

The dashboard should help the user quickly answer:

- What should I do today?
- What phase am I in?
- What does my week look like?
- What have I done recently?
- Is there a progression-related next action?

The dashboard should not be a redundant plan overview page.

Detailed plan information belongs in the Plans section.

### B2. Dashboard sections to keep

Keep and improve:

1. Today’s training / primary workout action
   - This should remain dominant.
   - The next action should be visually obvious.

2. Current phase near the top
   - This is useful because it contextualizes today’s work.
   - Keep it close to the primary training section.

3. Calendar / weekly rhythm
   - Keep the weekly preview/calendar concept.
   - Make sure it is compact and easy to scan.

4. Recent activity / progress history
   - Keep recent activity.
   - Showing progress and completed work is valuable.

5. Progression prompt/recommendation where existing data supports it
   - Preserve existing logic.
   - Do not create new dashboard-only readiness inference.

### B3. Dashboard sections to remove or simplify

Remove or meaningfully simplify:

1. Current Plan dashboard block
   - Rationale:
     - It repeats information available in Plans.
     - It duplicates current phase and plan-progress access.
     - It makes the dashboard too verbose.
   - Preferred outcome:
     - Remove the block entirely if safe.
     - If removal is risky, reduce it to a minimal link/action to view plan details.

2. Keep the streak going reminder block
   - Rationale:
     - It is redundant when today’s workout is already prominent at the top.
     - It adds noise without clear extra value.
   - Preferred outcome:
     - Remove the block entirely if safe.
     - If removal is risky, fold any important CTA into the primary today’s training card.

3. Repeated current-plan explanations
   - Avoid explaining the current plan multiple times.
   - Use Plans section for deeper plan overview.

4. Oversized dashboard copy
   - Reduce overly large headings/subtitles.
   - Use shorter labels and more compact supporting text.

### B4. Dashboard acceptance criteria

- Today’s training remains the clearest dashboard action.
- Current phase remains visible near the top.
- Calendar/weekly rhythm remains available.
- Recent activity remains available.
- Current Plan dashboard block is removed or materially simplified.
- Keep the streak going block is removed or materially simplified.
- Dashboard copy is less oversized.
- Dashboard is easier to scan.
- Dashboard progression logic is unchanged.
- Dashboard still uses real existing data or existing empty states.
- No schema/API/auth/progression changes are introduced.

## Primary workstream C — App-wide copy reduction

### C1. General copy principle

The app currently has too much verbiage in multiple places.

This campaign should reduce unnecessary explanatory text so each page feels more visual and action-oriented.

Users should not need to read repeated paragraphs to know what to do.

### C2. Copy reduction targets

Review these surfaces:

- `/dashboard`
- `/plans`
- `/plans/[planId]`
- `/plans/new`
- `/workout`
- `/settings`
- `/login` or sign-in route, if present

Reduce:

- repeated helper paragraphs
- oversized explanatory copy
- redundant subtitles
- repeated page-level introductions
- duplicate current-plan explanations
- helper text that restates obvious controls
- long descriptions where a short label works

Keep:

- safety guidance
- validation guidance
- AI import/review instructions
- plan creation instructions where the user genuinely needs help
- empty-state guidance
- high-consequence action explanations
- error messages and validation messages

### C3. Copy examples and preferred style

Prefer:

- short headings
- direct action labels
- compact helper text
- scannable labels
- `Start workout`
- `Review plan`
- `Copy prompt`
- `Import draft`
- `Current phase`

Avoid:

- long paragraphs explaining obvious page structure
- repeating the same plan status in multiple places
- verbose descriptions that compete with the primary action
- generic marketing language inside authenticated app screens

### C4. App-wide copy acceptance criteria

- Touched screens have less redundant copy.
- Primary actions are easier to identify.
- Safety/validation guidance remains intact.
- Plan creation and AI import remain understandable.
- Empty states remain useful.
- No important user guidance is removed just to reduce text.

## Primary workstream D — Typography consistency

### D1. Problem

Typography scale and hierarchy are inconsistent in parts of the app.

Some dashboard copy is too large.

Some supporting text competes with primary actions.

### D2. Required typography direction

Normalize:

- page titles
- page subtitles
- section headings
- card titles
- body copy
- helper text
- metadata text
- badge/status text
- form labels
- form descriptions
- button text scale

The goal is not to invent a new design system.

The goal is to make the existing visual system feel consistent.

### D3. Typography rules

Use clean sans-serif typography.

Do not introduce serif/display fonts.

Avoid one-off font sizes and weights where existing conventions can be reused.

Keep mobile readability.

Keep desktop hierarchy balanced.

Make page-level copy smaller where it currently overwhelms the interface.

### D4. Typography acceptance criteria

- Dashboard copy is less oversized.
- Section/card hierarchy is consistent across touched screens.
- Helper text is clearly secondary.
- Metadata text is readable but not dominant.
- Form labels/descriptions are consistent.
- Typography remains readable in light and dark mode.

## Primary workstream E — Theme and dark-mode readability QA

### E1. Specific known issue

The sign-in/login page has black text in dark mode.

This must be fixed.

### E2. Required dark-mode review surfaces

Review light and dark mode for:

- `/login` or sign-in page
- `/dashboard`
- `/plans`
- `/plans/[planId]`
- `/plans/new`
- `/workout`
- `/settings`

### E3. Elements to check

Check:

- page titles
- body copy
- helper text
- muted text
- form labels
- input text
- placeholder text
- textareas
- selects/dropdowns
- cards
- borders
- badges
- status pills
- empty states
- buttons
- navigation labels
- mobile bottom navigation
- desktop navigation/rail if present

### E4. Theme implementation guidance

Use semantic tokens and shared primitives where practical.

Avoid hardcoded page-specific colors unless necessary and consistent with the existing design system.

Do not replace the theme system.

Do not change how theme preference is stored unless explicitly approved.

### E5. Theme acceptance criteria

- Sign-in/login text is readable in dark mode.
- Touched screens remain readable in light and dark mode.
- Muted/helper text has sufficient contrast.
- Inputs/selects/textareas are readable in dark mode.
- Cards and borders remain visually distinct.
- Buttons remain visually clear.
- No theme-system rewrite is introduced.

## Primary workstream F — Desktop responsive polish

### F1. Problem

Some authenticated app screens still feel like stretched mobile layouts on desktop.

### F2. Required desktop review surfaces

Review desktop presentation for:

- `/dashboard`
- `/plans`
- `/plans/[planId]`
- `/plans/new`
- `/workout`
- `/settings`

### F3. Desktop polish goals

Improve:

- max-widths
- layout rhythm
- grid usage
- card sizing
- spacing between sections
- spacing inside cards
- scanability
- text line length
- empty-space balance
- primary-action prominence

Avoid:

- giant cards with sparse content
- overly wide text blocks
- cramped multi-column layouts
- unnecessary desktop-only complexity
- route/data-loading restructuring
- desktop changes that break mobile

### F4. Desktop acceptance criteria

- Desktop layouts feel intentional.
- Mobile-first layout remains intact.
- Cards and sections have better rhythm.
- Text line lengths are reasonable.
- Primary actions remain easy to find.
- No route restructuring is introduced.
- No new data dependencies are introduced.

## Likely files and areas to inspect

Codex should inspect first and decide exact files, but likely areas include:

AI Draft:

- `components/ai-plan-draft-wizard.tsx`
- `lib/plan-drafting/ai-draft-import.ts`
- AI prompt generation helpers
- AI draft import/normalization tests
- plan draft validation tests

Dashboard:

- `app/dashboard/page.tsx`
- dashboard-specific components
- `lib/dashboard.ts`
- shared dashboard card/metric primitives

Plan surfaces:

- `app/plans/page.tsx`
- `app/plans/[planId]/page.tsx`
- plan list/detail components
- phase/workout display components

Plan creation:

- `app/plans/new/page.tsx`
- plan setup/review components
- Guided Setup components
- Manual Builder components
- Draft with AI components

Workout:

- `app/workout/page.tsx`
- workout execution components

Settings:

- `app/settings/page.tsx`
- settings/profile/theme controls

Auth/sign-in:

- `app/login/page.tsx`
- sign-in/auth form components
- public/auth route components if applicable

Shared UI/theme:

- shared UI primitives
- global styles
- theme token files
- layout/shell components if typography or readability requires it

Docs:

- `docs/current-task.md`
- `docs/product.md`
- `docs/roadmap.md`
- `docs/campaigns/ai-draft-plan-ux.md`
- `docs/campaigns/archived/comprehensive-ux-cleanup.md`
- `docs/architecture.md` only if a durable architecture convention changes

## Files and areas to avoid unless absolutely necessary

Avoid touching:

- Supabase migrations
- Supabase RLS policies
- auth helpers
- route middleware/proxy unless a visual issue truly requires it
- progression engine logic
- workout/session persistence logic
- plan persistence schema contracts
- provider/LLM integration code
- package dependencies
- environment files
- payment/billing code if any
- public landing page unless dark-mode/auth route polish requires a tiny shared style fix

If any avoided area appears necessary, stop and report before changing it.

## Required preflight before implementation

Before coding, Codex must run or verify:

```powershell
git status
git fetch origin
git branch --show-current
git remote -v
node -v
npm -v
Get-Command git
Get-Command node
Get-Command npm
Get-Command rg
```

Environment checks:

- confirm `.env.local` exists
- confirm `NEXT_PUBLIC_SUPABASE_URL` exists in `.env.local`
- confirm `NEXT_PUBLIC_SUPABASE_ANON_KEY` exists in `.env.local`

If `.env.local` is missing in the Codex worktree, copy it from:

```text
C:\Code\Workout-App\.env.local
```

Do not commit `.env.local`.

Stop before implementation if:

- working tree has unrelated uncommitted changes
- branch/base state is ambiguous
- required env variables are missing
- local docs contradict the campaign sequence
- local docs do not show 9K–9M as complete or otherwise make status ambiguous
- the campaign would require schema/RLS/auth/progression/provider-backed LLM changes

## Required implementation discipline

Codex must:

- keep the campaign in one branch
- prefer targeted cleanup over broad rewrites
- reuse existing components and semantic tokens
- preserve mobile-first UX
- improve desktop only where it does not harm mobile
- preserve light/dark readability
- preserve accessible semantic markup
- avoid fragile animation
- avoid adding animation libraries
- keep each change traceable to this campaign brief
- add or update focused tests only where behavior changes
- update docs after implementation
- report any deferred follow-ups

Codex must not:

- use fake/static data on authenticated surfaces
- replace real dashboard data with mock content
- hide layout issues with broad `overflow-hidden`
- remove important safety or validation guidance
- weaken validation
- introduce provider-backed AI
- introduce broad route or data refactors

## Verification required after implementation

Run:

```powershell
npm run typecheck
npm run test
npm run build
npm run lint
```

Known lint note:

If `npm run lint` fails only because the current Next setup interprets `next lint` as a project directory named `lint`, report that as the known lint-script issue rather than treating it as a product regression.

If any other check fails, fix failures caused by this campaign.

If a failure appears unrelated and pre-existing, report it clearly.

## Required manual smoke QA

Codex should perform or document the following manual smoke checks where practical.

If browser QA is not performed, Codex must say so directly.

### AI Draft flow

Check:

- `/plans/new` opens.
- Guided Setup still opens and proceeds.
- Manual Builder still opens and proceeds.
- Draft with AI opens.
- Draft with AI Goal step works.
- Draft with AI Schedule step uses fixed 1–7 days-per-week control.
- Changing days-per-week updates selected days to the required default mapping.
- Next/Back step navigation scrolls to the active step top.
- Later steps do not repeat bulky introductory setup content.
- Prompt generation still works.
- Prompt includes the no-weekday-in-workout-name rule.
- Prompt still requests scheduled day separately.
- Valid AI output with scheduled days imports and preserves scheduled days.
- Invalid AI output fails safely.
- Review/edit/save remains mandatory.
- No provider-backed LLM behavior exists.

### Dashboard

Check:

- `/dashboard` loads authenticated state.
- Today’s training / primary action remains prominent.
- Current phase remains visible near the top.
- Calendar/weekly preview remains available.
- Recent activity remains available.
- Current Plan block is removed or materially simplified.
- Keep the streak going block is removed or materially simplified.
- Dashboard copy is less oversized.
- Dashboard remains readable in mobile and desktop layouts.
- Dashboard remains readable in light and dark mode.

### App-wide UX

Check:

- `/plans` mobile and desktop.
- `/plans/[planId]` mobile and desktop where possible.
- `/plans/new` mobile and desktop.
- `/workout` mobile and desktop.
- `/settings` mobile and desktop.
- `/login` or sign-in page in dark mode.
- Primary action on each page is clear.
- Excess copy has been reduced where safe.
- Typography hierarchy is consistent.
- Dark-mode text is readable.

## Required docs updates after implementation

After implementation, update only what is needed.

Always update:

- `docs/current-task.md`

Update if status changes:

- `docs/roadmap.md`
- `docs/campaigns/archived/comprehensive-ux-cleanup.md`
- `docs/campaigns/ai-draft-plan-ux.md`, only if useful to record AI Draft QA closure

Update only if architectural direction changes:

- `docs/architecture.md`

Do not update README unless user-facing setup or workflow guidance changed.

Docs must record:

- Slice 9N completed
- areas changed
- AI Draft QA fixes completed
- dashboard cleanup completed
- app-wide UX polish completed
- intentionally unchanged areas
- validation run
- manual QA performed or not performed
- known remaining risks/follow-ups
- next planned major roadmap item: Slice 10 — Exercise Media And Instruction Layer
- confirmation that schema/RLS/auth/progression/provider-backed LLM boundaries were preserved

Do not over-document implementation details that will quickly become stale.

## Acceptance criteria

Campaign is successful if:

### AI Draft QA

- Days-per-week is fixed-choice, not awkward manual numeric entry.
- Selected training days always match selected days-per-week.
- Step navigation scrolls to the top of active step content.
- Draft with AI steps have compact, non-redundant headers.
- Prompt export tells the external LLM not to include weekdays in workout names.
- Prompt export asks for scheduled day separately.
- Import/review preserves valid scheduled day fields.
- Invalid output fails safely.
- Review/edit/save remains mandatory.
- Strict validation is preserved.

### Dashboard

- Today’s training / primary workout action remains dominant.
- Current phase remains near the top.
- Calendar/weekly rhythm remains available.
- Recent activity/progress history remains available.
- Current Plan block is removed or materially simplified.
- Keep the streak going block is removed or materially simplified.
- Repeated current-plan explanations are reduced.
- Dashboard copy is smaller, clearer, and less dense.
- Dashboard progression logic is unchanged.

### App-wide UX

- Excessive verbiage is reduced across touched surfaces.
- Primary actions are clearer and more visual.
- Typography hierarchy is more consistent.
- Sign-in/login dark-mode text is readable.
- Dark-mode readability is improved on touched surfaces.
- Desktop layouts are cleaner without breaking mobile-first UX.
- Existing visual system remains intact.

### Guardrails

- Guided Setup still works.
- Manual Builder still works.
- Draft with AI still works.
- Public/authenticated route boundary is unchanged.
- No provider-backed LLM integration is introduced.
- No API-key handling is introduced.
- No runtime LLM dependency is introduced.
- No schema migration is introduced.
- No Supabase/RLS changes are introduced.
- No auth changes are introduced.
- No progression engine changes are introduced.
- No unvalidated AI draft save path is introduced.
- Slice 10 exercise media work is not implemented.

## Stop rules

Stop immediately and report if:

- scheduled-day preservation requires schema changes
- import validation would need to be weakened
- dashboard cleanup requires progression logic changes
- desktop cleanup requires route restructuring
- dark-mode fixes require replacing the theme system
- provider-backed LLM integration appears necessary
- unrelated app behavior begins changing broadly
- validation fails and cannot be fixed safely within this campaign
- local docs conflict with campaign status
- branch state becomes ambiguous
- working tree contains unrelated changes
- required env variables are missing
- route/auth behavior changes unexpectedly
- public `/` or authenticated `/dashboard` build behavior changes unexpectedly
- changes begin expanding into Slice 10 exercise-media scope

If a crash/interruption happens:

1. Stop.
2. Inspect `git status`.
3. Inspect `git diff --stat`.
4. Report changed files.
5. Do not continue until the working tree state is understood.
6. Restore from the last clean branch if route files or core app files are missing unexpectedly.

## Final reporting requirements

At the end of implementation, Codex must report:

- branch name
- commit hash
- files changed
- AI Draft QA fixes completed
- dashboard cleanup completed
- app-wide UX polish completed
- validation commands run
- validation results
- manual smoke checks performed
- manual smoke checks not performed
- docs updated
- known lint issue status
- guardrails preserved
- deferred follow-ups
- whether branch was pushed

The final report must explicitly confirm:

- no provider-backed LLM integration
- no API-key handling
- no runtime LLM dependency
- no schema migration
- no Supabase/RLS changes
- no auth changes
- no progression engine changes
- no unvalidated AI draft save path
- Guided Setup preserved
- Manual Builder preserved
- Draft with AI preserved
- Slice 10 not implemented

## Recommended merge/review process

After Codex pushes:

1. Review the Vercel preview.
2. QA the AI Draft flow first.
3. QA dashboard second.
4. QA dark mode/sign-in third.
5. QA desktop layouts fourth.
6. Merge manually only after QA is acceptable.
7. Proceed to Slice 10 after this campaign is merged and docs are aligned.
