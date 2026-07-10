# Current Task

## Current Priority

GitHub Issue #6 — **Campaign: Overhaul workout execution and exercise recording experience** — remains the top product and development priority.

Issue #9 — **Discovery: Define workout execution and set-result domain contract** — has produced the docs-first domain contract in `docs/architecture.md`. No production workout behavior, schema, or API behavior changed in that discovery step.

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

Implement the next child issue under #6:

**Issue #10 — Set-result data foundation and execution/history reset**

This next step should implement the approved Supabase data foundation from the Issue #9 domain contract before broad active-workout UI work begins. It must:

- commit timestamped Supabase migration SQL for resetting disposable `workout_sessions` and `exercise_results` data and creating the durable session/exercise/set-result model
- keep `supabase/schema.sql` canonical with the timestamped migrations
- update generated database types in-repo
- preserve auth users, profiles, plans, phases, workout templates, exercise entries, setup context, guidance, and current phase pointers
- define RLS ownership through `workout_sessions.user_id` for session, exercise-result, and set-result rows
- add required parent/order/history indexes and a transaction or RPC save boundary
- update API/data access only as needed for the new schema foundation while avoiding a broad UI rewrite
- include the Supabase change handoff section required by the Issue #9 contract

Do not start the broad active-workout UI replacement until #10 lands and the preview migration/QA path is verified.

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