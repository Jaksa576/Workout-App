# Current Task

## Current Status

Slice 9N, Comprehensive UX Cleanup And AI Draft QA Patch, is merged to `origin/main`.

Current docs-only task: amend `codex/docs-workflow-alignment` so the repo adopts the standard documentation structure.

## Active / Next Work

No implementation campaign is active in this branch.

Next major implementation target: Slice 10, Exercise Media And Instruction Layer.

Recommended future implementation branch:

```text
codex/slice-10-exercise-media-instruction-layer
```

## Next Action

Finish and review this docs-only structure cleanup, then merge it if acceptable.

After that, plan Slice 10 before coding.

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

For this docs-only cleanup:

- run `git status`
- run `git diff --stat`
- confirm changed files are documentation only
- confirm no non-doc files are staged
- confirm docs agree on current status, next action, source-of-truth file set, and retired handoff status

No app build/test run is required unless non-doc files are touched accidentally.

## Manual QA Expectations

No browser QA is required for this docs-only cleanup.

Before merging Slice 10 later, perform browser QA appropriate to the implemented exercise media/instruction changes.

## Stop Conditions

Stop and report before editing further if:

- non-doc changes become necessary
- Slice 9N status becomes ambiguous
- docs disagree that Slice 10 is the next implementation target
- `docs/archive/agent-handoff-history-2026-05-03.md` is missing and handoff removal would lose important context
- product truth cannot be safely separated from architecture or roadmap
- branch state becomes ambiguous

## Final Report Expectations

Include:

- documentation delta
- whether `docs/product.md` was created
- whether `docs/agent-handoff.md` was deleted, retired, or retained
- final hot-path source-of-truth docs
- compact state packet
