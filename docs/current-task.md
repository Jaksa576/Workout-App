# Current Task

## Current Status

Slice 10, AI-Enriched Exercise Instructions And Demo Links, is implemented locally on branch:

```text
codex/slice-10-exercise-guidance
```

This slice keeps the AI Draft boundary provider-free and review-before-save. No schema, RLS, auth, route-boundary, workout-session save, or progression-engine changes were introduced.

## Implemented Slice

Slice 10 improves the `/plans/new` Draft with AI path by carrying optional exercise-level guidance through the existing draft -> review/edit -> structured save -> saved plan/workout display flow.

Implementation summary:

- expanded the generated external-AI prompt to request optional exercise guidance fields:
  - `setup`
  - `execution_cues`
  - `common_mistakes`
  - `modifications`
  - `safety_notes`
  - `youtube_url`
  - `video_search_query`
- preserved the fenced `adaptive-training-plan` transfer format, required plan/phase/workout/exercise fields, assigned-day guidance, and review-before-save flow
- extended AI import parsing to accept optional guidance fields after required exercise fields
- normalized guidance strings/lists with bounded lengths and list counts
- normalized safe YouTube links and rejected unsupported video URL formats during save validation
- dropped invalid imported `youtube_url` values without rejecting otherwise valid plans
- added review/edit controls for exercise guidance and video links in the reusable plan builder
- persisted reviewed text guidance through existing `exercise_entries.coaching_note` serialization and reviewed videos through existing `exercise_entries.video_url`
- parsed saved serialized guidance back into structured app types for edit/display
- surfaced guidance on saved plan phase/workout details and workout execution exercise cards
- left Guided Setup, Manual Builder, existing saved plans, workout session save, and deterministic progression behavior unchanged

Durable persistence note:

- No database migration was required.
- Text guidance uses the existing `exercise_entries.coaching_note` field with labeled sections.
- Demo URLs use the existing `exercise_entries.video_url` field.
- `video_search_query` is stored as reviewed guidance text only. The app does not run automatic video search.

## Validation Results

Commands run so far:

```powershell
npm run typecheck
npm run test
```

Results:

- `npm run typecheck`: passed
- `npm run test`: passed, 9 test files and 56 tests

Still required before final handoff:

```powershell
npm run build
```

## Manual QA Expectations

Before merging Slice 10, browser QA should cover:

- `/plans/new` Draft with AI prompt generation includes the new exercise guidance fields
- valid enriched AI transfer block imports into review
- invalid/non-YouTube imported `youtube_url` does not crash import
- review/edit can edit and remove guidance and video fields before save
- saved plan details show compact exercise guidance
- workout execution shows compact setup/cues/safety/video actions
- exercises without guidance still render normally
- light and dark mode remain readable on touched surfaces

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

## Stop Conditions

Stop and report before editing further if:

- a durable schema or RLS change becomes necessary for richer exercise guidance
- provider-backed AI, API keys, automatic YouTube search, video scraping, or media storage becomes necessary
- validation reveals unrelated failures that cannot be confidently attributed to this slice
- branch state becomes ambiguous

## Final Report Expectations

Include:

- summary of implemented Slice 10 behavior
- files changed
- validation results
- documentation delta
- migration/auth/RLS/progression risk notes
- compact state packet
