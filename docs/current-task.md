# Current Task

## Goal

Current implementation status: Slice 9N, Comprehensive UX Cleanup And AI Draft QA Patch, is implemented locally on `codex/slice-9n-comprehensive-ux-cleanup`.

Slice 9J, Plan Creation / Settings Polish, is complete. Slice 9K, AI Draft Setup Wizard, is complete. Slice 9L, External LLM Handoff UX, is complete. Slice 9M, AI Draft Import Ergonomics, is complete. The Slice 9K-9M AI Draft Plan UX Campaign is now complete and archived as reference material.

Slice 9N was intentionally scheduled before Slice 10, Exercise Media And Instruction Layer. Slice 10 remains the next major roadmap item after Slice 9N.

Slice 9N combines:

- post-9K-9M AI Draft Plan Flow QA fixes
- explicitly rescoped deferred UX polish for dashboard density, app-wide copy, typography, dark-mode readability, and desktop responsiveness

This is a stabilization and UX-quality pass, not a new architecture direction.

## Completed Slice

Slice 9N used `docs/campaigns/comprehensive-ux-cleanup.md` as the detailed campaign source of truth.

Implemented:

- Draft with AI schedule control now uses fixed 1-7 choices instead of numeric typing.
- Days-per-week changes reset selected weekdays to the required default mappings.
- Draft with AI selected weekdays stay count-aligned with selected days-per-week.
- Draft with AI step navigation scrolls back to the active step top.
- Draft with AI headers and supporting copy were compacted.
- Prompt export now tells external LLMs not to include weekdays in workout names and to provide scheduled day separately.
- AI import now preserves valid workout `day` fields through review/structured conversion and rejects invalid day values.
- Dashboard Current Plan snapshot was removed; today, current phase, week rhythm, recent activity, and compact metrics remain.
- Dashboard and touched app surfaces received copy, typography, desktop rhythm, and dark-mode readability cleanup.
- Login form dark-mode readability was fixed by moving old hardcoded text/input styling to semantic UI tokens.

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

Preserved in implementation:

- no schema changes
- no Supabase/RLS changes
- no auth changes
- no progression-engine changes
- no provider-backed LLM integration
- no API-key handling
- no runtime LLM dependency
- no unvalidated AI draft save path
- no Slice 10 exercise media or instruction-layer work

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

Slice 9N validation run:

- `npm run typecheck` passed.
- `npm run test` passed: 8 files, 52 tests. The sandboxed test run hit Windows `spawn EPERM`; rerun with approval passed.
- `npm run build` passed. The sandboxed build compiled and then hit Windows `spawn EPERM`; rerun with approval passed.
- `npm run lint` failed with the known Next 16 setup issue: `next lint` is interpreted as a project directory named `lint`.

Manual browser QA was not performed in Codex during implementation. Vercel preview review should smoke test Draft with AI, dashboard hierarchy, sign-in dark mode, and touched responsive routes before merge.

Next implementation target after this branch is reviewed and merged: Slice 10, Exercise Media And Instruction Layer.
