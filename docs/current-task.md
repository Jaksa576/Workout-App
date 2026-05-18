# Current Task

## Current Status

Workflow helper infrastructure has been implemented on branch:

```text
codex/slice-10-exercise-guidance
```

This is not an app feature slice. It adds repo-owned validation and branch-push helpers so future Codex work can reduce repeated setup/context overhead and avoid local-only worktree completions.

Slice 10, AI-Enriched Exercise Instructions And Demo Links, is implemented locally with a pre-merge QA tightening patch on branch:

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

## Pre-Merge QA Patch

Patch summary:

- collapsed Workouts-step cards by default so imported AI plans can be scanned before inspecting details
- added compact workout summaries with workout name, assigned days, focus/summary, exercise count, and a guidance/video indicator
- moved exercise library search and category filtering into each expanded workout card
- kept Add from library, Add blank exercise, Duplicate workout, and Delete workout controls available in the context of the workout being edited
- reduced Coaching note / Guidance duplication in AI-import review:
  - structured Guidance remains the primary coaching area when AI guidance exists
  - the legacy/base note is preserved as an Advanced note inside the guidance section
  - manual and non-guidance exercises still expose the note field directly
- tuned prompt wording so common general exercises should get useful YouTube URLs when the external AI is reasonably confident
- kept specialized rehab, pain-sensitive, return-to-sport, and ambiguous movement variations pointed toward `video_search_query` instead of forced URLs
- preserved strict YouTube URL validation and did not add API calls, scraping, embeds, or automatic search

Follow-up UI polish:

- made each exercise in the Workouts step collapsible, matching the workout-level review pattern
- removed the unclear `Guidance/video` and `Expand to edit` workout summary text
- kept native disclosure arrows visible for workouts, exercises, Guidance, and Advanced note sections
- made Guidance sections start collapsed until the user opens them manually

Known follow-up:

- A dashboard/user timezone issue was noted during QA and remains separate. It is intentionally not part of this Slice 10 patch.

Durable persistence note:

- No database migration was required.
- Text guidance uses the existing `exercise_entries.coaching_note` field with labeled sections.
- Demo URLs use the existing `exercise_entries.video_url` field.
- `video_search_query` is stored as reviewed guidance text only. The app does not run automatic video search.

## Validation Results

Workflow helper validation completed:

```powershell
npm run typecheck
npm test
npm run build
npm run check
.\scripts\validate.ps1
```

Results:

- `npm run typecheck`: passed
- `npm test`: passed, 9 test files and 56 tests
- `npm run build`: passed
- `npm run check`: passed
- `.\scripts\validate.ps1`: passed and delegated to `npm run check`

Commands run so far:

```powershell
npm run typecheck
npm run test
npm run build
```

Results:

- `npm run typecheck`: passed
- `npm run test`: passed, 9 test files and 56 tests
- `npm run build`: passed
- latest UI polish validation repeated `npm run typecheck`, `npm run test`, and `npm run build`: passed

Manual smoke performed:

- started a temporary local dev server on port 3001
- confirmed `/` returns HTTP 200
- confirmed `/login` returns HTTP 200
- confirmed unauthenticated `/plans/new` returns a protected-route redirect
- stopped the temporary dev server and confirmed port 3001 is clear

## Manual QA Expectations

Before merging Slice 10, remaining signed-in browser QA should cover:

- `/plans/new` Draft with AI prompt generation includes the new exercise guidance fields
- Draft with AI prompt generation includes the revised YouTube URL guidance
- valid enriched AI transfer block imports into review
- invalid/non-YouTube imported `youtube_url` does not crash import
- Workouts step starts with collapsed workout cards after import
- expanding a workout reveals editable workout, exercise, guidance, and video fields
- adding from library happens inside the expanded workout card
- review/edit can edit and remove guidance and video fields before save
- coaching note/guidance presentation is not duplicative in AI-import review
- saved plan details show compact exercise guidance
- workout execution shows compact setup/cues/safety/video actions
- complete/save a workout session
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
