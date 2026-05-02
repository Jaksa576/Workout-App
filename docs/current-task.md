# Current Task

## Goal

Current implementation target: Slice 9N, Comprehensive UX Cleanup And AI Draft QA Patch.

Slice 9J, Plan Creation / Settings Polish, is complete. Slice 9K, AI Draft Setup Wizard, is complete. Slice 9L, External LLM Handoff UX, is complete. Slice 9M, AI Draft Import Ergonomics, is complete. The Slice 9K-9M AI Draft Plan UX Campaign is now complete and archived as reference material.

Slice 9N is intentionally scheduled before Slice 10, Exercise Media And Instruction Layer. Slice 10 remains the next major roadmap item after Slice 9N.

Slice 9N combines:

- post-9K-9M AI Draft Plan Flow QA fixes
- explicitly rescoped deferred UX polish for dashboard density, app-wide copy, typography, dark-mode readability, and desktop responsiveness

This is a stabilization and UX-quality pass, not a new architecture direction.

## Current Slice

Slice 9N should use `docs/campaigns/comprehensive-ux-cleanup.md` as the detailed campaign source of truth.

Implementation goals:

- fix AI Draft schedule control and selected-day consistency
- fix AI Draft wizard scroll and header density
- fix prompt workout naming guidance so weekday names are not duplicated in workout names
- preserve scheduled day during AI draft import/review
- simplify dashboard by removing or reducing Current Plan and Keep the streak going blocks
- reduce oversized dashboard copy
- reduce app-wide verbiage
- normalize typography across touched screens
- fix dark-mode readability, especially sign-in/login
- improve desktop responsive polish without harming mobile-first behavior

## Guardrails

Slice 9N must preserve:

- no schema changes
- no Supabase/RLS changes
- no auth changes
- no progression-engine changes
- no provider-backed LLM integration
- no API-key handling
- no runtime LLM dependency
- no unvalidated AI draft save path
- no Slice 10 exercise media or instruction-layer work

Preserve the existing structured adaptive-training model:

- public `/` landing page
- authenticated `/dashboard`
- protected app routes
- Guided Setup
- Manual Builder
- Draft with AI
- setup -> draft -> review/edit -> save
- strict validation before saving AI-generated plans
- plan, phase, workout, exercise, session, and progression behavior

## Recently Completed

Slice 9K-9M, AI Draft Plan UX Campaign, is complete.

Delivered:

- Slice 9K split Draft with AI setup into focused Goal, Schedule, Context, and Optional steps.
- Slice 9L made external LLM copy/paste handoff clearer and presented ChatGPT, Claude, and Gemini as external options without provider integration.
- Slice 9M improved fenced `adaptive-training-plan` transfer import ergonomics while preserving strict validation and review-before-save.

The archived AI Draft campaign document remains reference context. Remaining AI Draft QA cleanup is handled by Slice 9N rather than reopening Slice 9K-9M.

## Next Major Slice

After Slice 9N, the next major planned roadmap item is Slice 10, Exercise Media And Instruction Layer.

Slice 10 remains planned and is not canceled or replaced by Slice 9N. Do not begin Slice 10 work inside Slice 9N.

## Likely Files To Inspect For Slice 9N

Start with docs:

- `docs/campaigns/comprehensive-ux-cleanup.md`
- `docs/campaigns/archived/ai-draft-plan-ux.md`
- `docs/current-task.md`
- `docs/agent-handoff.md`
- `docs/roadmap.md`
- `docs/architecture.md`
- `AGENTS.md`

Then inspect implementation areas as needed:

- `components/ai-plan-draft-wizard.tsx`
- AI prompt generation helpers
- AI draft import and normalization helpers/tests
- `app/dashboard/page.tsx`
- dashboard components and `lib/dashboard.ts`
- `app/plans/page.tsx`
- `app/plans/[planId]/page.tsx`
- `app/plans/new/page.tsx`
- `app/workout/page.tsx`
- `app/settings/page.tsx`
- `app/login/page.tsx`
- shared UI, typography, theme, and shell primitives

## Stop Conditions

Stop and report before implementation if:

- local docs make Slice 9K-9M completion status ambiguous
- local docs disagree about Slice 9N being before Slice 10
- scheduled-day preservation requires schema changes
- import validation would need to be weakened
- dashboard cleanup requires progression logic changes
- desktop cleanup requires route restructuring
- dark-mode fixes require replacing the theme system
- provider-backed LLM integration appears necessary
- working tree or branch state becomes ambiguous

## Verification Expectations For Slice 9N

Because Slice 9N changes app behavior and UI, the implementation pass should run:

- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run lint`

If `npm run lint` fails only because the current Next setup interprets `next lint` as a project directory named `lint`, report that known lint-script issue.

Manual QA should cover Draft with AI, dashboard, light/dark readability, sign-in/login dark mode, and responsive mobile/desktop behavior on touched screens.
