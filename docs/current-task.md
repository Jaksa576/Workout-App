# Current Task

## Current Priority

GitHub Issue #6 — **Campaign: Overhaul workout execution and exercise recording experience** — is now the top product and development priority.

Although the issue title still uses “Campaign,” development is now issue-driven. No campaign document should be created for this work. The umbrella issue should be broken into independently reviewable child issues, and each pull request should reference the child issue it implements.

## Why This Was Reprioritized

The previous direct AI-guided plan creation work completed only its docs/planning step. Provider-backed implementation has not started.

Workout execution and set-result changes may affect:

- exercise tracking metadata
- prescription snapshots
- supported units and tracking types
- unilateral conventions
- workout/session persistence
- history queries
- deterministic progression inputs
- the structured exercise output expected from future AI-generated plans

For that reason, Issue #6 should establish the durable workout/exercise recording contract before direct AI-generated plan implementation proceeds.

## Immediate Next Action

Create and implement the first child issue under #6:

**Discovery, domain contract, and issue breakdown**

This first step should be docs-first and should not change production workout behavior.

It must:

- inspect the current `/workout` route and execution components
- inspect `/api/sessions`, validation, types, queries, tests, schema migrations, and RLS
- verify the real shape and usage of `workout_sessions` and `exercise_results`
- define the active-session state machine
- define the initial deterministic exercise tracking types
- define unilateral exercise behavior
- define prescription and result snapshot requirements
- define legacy-session compatibility
- define in-progress draft persistence and recovery expectations
- define mobile route/state and information architecture boundaries
- recommend the smallest migration-safe issue sequence

The product owner must approve the resulting domain contract and child issue sequence before schema or broad execution UI implementation begins.

## Queued Work

GitHub Issue #8 — **Feature: Direct AI-guided plan creation** — replaces the former active campaign document and is queued behind the foundational decisions from #6.

Reassess #8 after the first #6 discovery/domain issue is approved. It remains important, but its exercise-output contract should align with the new recording model.

## Workflow Source Of Truth

Active work is issue-driven:

- `AGENTS.md`
- `docs/product.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/current-task.md`
- GitHub Issue #6 and its active child issue

`docs/campaigns/` is deprecated and reference-only. Do not create or update campaign documents.

## Validation Expectations

For code changes, use:

```powershell
npm run check
```

Before a final report from a local worktree, also run:

```powershell
.\scripts\verify-branch-pushed.ps1
```

For docs-only changes, run `git status` and `git diff --stat`, confirm the diff is docs-only, and do not run app build/test unless non-doc files are touched accidentally.

## Stop Conditions

Stop and report before implementation if:

- the database schema or RLS differs from the assumptions in Issue #6
- current code and docs disagree about session/result persistence
- the first child issue requires committing to a schema before the domain contract is approved
- implementation would create a parallel session system rather than migration-safely extending the existing one
- progression behavior would change without an explicitly scoped and reviewed issue
- branch state, push state, or target issue becomes ambiguous