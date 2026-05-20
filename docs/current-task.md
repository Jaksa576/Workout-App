# Current Task

## Current Status

Direct AI-Guided Plan Creation is the active campaign.

Slice 10, AI-Enriched Exercise Instructions And Demo Links, is complete and merged into `main`. The follow-up user-timezone dashboard/date patch is also complete and merged into `main`.

Slice 1, Campaign docs and AI boundary approval, is complete. It approved optional provider-backed direct AI plan drafting for this campaign while preserving non-AI plan creation, strict validation, review-before-save, deterministic progression, and phase-based plan structure.

## Completed Context

Slice 10 improved the provider-free `/plans/new` Draft with AI path:

- external AI prompts now request optional exercise guidance fields and optional YouTube demo/search fields
- AI import accepts bounded optional guidance fields without weakening required plan/phase/workout/exercise validation
- invalid or unsupported imported YouTube URLs are safely dropped instead of becoming saved links
- users can review, edit, or remove exercise guidance and video links before saving
- saved plan details and workout execution show compact setup, cues, safety notes, search text, and demo links when present
- reviewed guidance persists migration-free through `exercise_entries.coaching_note`
- reviewed demo links persist through `exercise_entries.video_url`

The timezone follow-up fixed user-facing local-date behavior:

- dashboard today/current-workout logic, weekly preview, activity summary, and workout progress summaries use the browser-detected IANA timezone when available
- completed-on defaults and validation use the same local-date basis
- timezone is persisted client-side in the `workout-app-time-zone` cookie/localStorage key
- no schema, auth/RLS, session payload, AI, or progression-engine changes were introduced

## Validation Summary

Slice 10 validation completed before merge:

- `npm run typecheck`: passed
- `npm run test`: passed, 9 test files and 56 tests
- `npm run build`: passed
- `npm run check`: passed
- `.\scripts\validate.ps1`: passed and delegated to `npm run check`

Timezone patch validation completed before merge:

- `npm run typecheck`: passed
- `npm run test`: passed, 10 test files and 61 tests
- `npm run build`: passed
- `npm run check`: passed
- user review confirmed the timezone behavior works as expected

## Active Campaigns

The active campaign doc is `docs/campaigns/direct-ai-plan-creation.md`.

No other active campaign doc should exist outside `docs/campaigns/archived/`.

## Next Action

Proceed to Slice 2: AI-first `/plans/new` UX shell, feature-gated, without provider calls.

Do not implement Gemini integration, migrations, `/plans/new` behavior changes, or new environment variables in Slice 1.

## Source Of Truth

Active hot-path docs:

- `AGENTS.md`
- `docs/product.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/current-task.md`
- active `docs/campaigns/*.md` when relevant

Archived reference:

- `docs/campaigns/archived/`
- `docs/archive/`

`docs/agent-handoff.md` is retired and is not required hot-path context.

## Validation Expectations

For code changes, use:

```powershell
npm run check
```

For docs-only changes, run `git status` and `git diff --stat`, confirm the diff is docs-only, and do not run app build/test unless non-doc files are touched accidentally.

## Stop Conditions

Stop and report before editing further if:

- docs conflict about whether Slice 10 or the timezone patch is complete
- another active campaign doc appears outside `docs/campaigns/archived/`
- campaign scope requires implementation decisions beyond docs alignment
- branch state becomes ambiguous
