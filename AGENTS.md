# AGENTS.md

## Standard Sources Of Truth

Repo docs own durable product and architecture truth. GitHub issues own active development scope, sequencing, acceptance criteria, and implementation discussion.

Read these before broad implementation:

- `docs/product.md`: product identity, guardrails, non-goals, and UX principles
- `docs/architecture.md`: technical architecture, data flow, auth/route boundaries, and durable workflow conventions
- `docs/roadmap.md`: high-level sequencing, completed milestones, and deferred product work
- `docs/current-task.md`: the currently prioritized GitHub issue, next action, and validation expectations
- the active GitHub issue and any explicitly linked child issue

`docs/campaigns/` is deprecated. Historical files there are reference-only and must not be treated as active instructions. Do not create new campaign documents.

`docs/agent-handoff.md` is retired and is not a required source-of-truth file.

## Issue-Driven Development Workflow

- One GitHub issue should own each independently reviewable implementation unit.
- Large umbrella issues should be broken into child issues before broad coding begins.
- Pull requests should reference the issue they implement.
- `docs/current-task.md` should identify the current priority and immediate next issue.
- Do not duplicate issue scope into a new campaign document.
- Durable product or architecture decisions discovered during implementation still belong in the appropriate repo docs.

## Standard Commands

- setup Codex worktree: `.\scripts\setup-codex-worktree.ps1`
- validate: `.\scripts\validate.ps1`
- verify pushed branch: `.\scripts\verify-branch-pushed.ps1`
- dev server: `npm run dev`

## Product Guardrails

Workout App is a progression-based adaptive training system, not a generic workout logger.

Preserve the plan/program -> phase -> workout -> exercise -> session/progression model. Programs should adapt through structured progression signals; they should not merely record workouts.

Plan creation must work without an LLM. AI-assisted flows must remain optional, validated, editable, and review-before-save unless a future approved issue explicitly changes that boundary.

Do not:

- make LLMs required for core functionality
- save AI-generated plans without validation and user review
- weaken deterministic progression behavior
- break auth, RLS, route, plan, phase, workout, session, or progression behavior unless explicitly scoped
- turn the app into a generic exercise logger

## Implementation Expectations

Prefer additive, migration-safe refactors over rewrites.

For large changes:

- inspect the existing repo structure and active issue first
- identify current seams before coding
- propose a migration-safe plan before broad implementation
- split work into small, reviewable issues
- keep the app functional after each issue

When implementing:

- state which GitHub issue is being implemented
- keep changes scoped to that issue
- document tradeoffs
- preserve compatibility names such as `plan_phases` unless a migration-safe rename is explicitly approved
- avoid parallel systems when a clean extension of the existing system will work
- keep types strong and explicit
- prefer deterministic, testable logic over clever heuristics

Branch/worktree completion rule:

- When working in a local worktree, always create or use a named branch, commit changes, push to `origin`, and verify the branch is pushed before the final report.
- Do not report implementation complete for local-only commits.
- If push or branch verification fails, stop and report the failure.

## Documentation Workflow

Codex owns documentation freshness during implementation:

- update `docs/current-task.md` after every implementation issue or docs-only state change
- update the active GitHub issue or child issue when scope or status changes
- update `docs/roadmap.md` when milestone sequencing or major status changes
- update `docs/architecture.md` only when durable technical or workflow architecture changes
- update `docs/product.md` only when durable product truth changes
- preserve useful stale history in `docs/archive/` or Git history rather than keeping it in hot-path docs
- do not create or reactivate campaign documents

Final reports must include:

- issue number and PR reference
- branch name, commit SHA, and pushed remote branch
- validation results
- documentation delta
- compact state packet
- confirmation that branch-push verification passed

The state packet is a transition note. It is not a source of truth; repo docs and GitHub issues remain authoritative.

## Verification Expectations

Before considering code work complete:

- use `npm run check` as the standard validation gate
- run relevant type checks and tests through the repo-standard validation command
- add or update tests when behavior changes
- verify no obvious regressions in existing plan behavior
- summarize what changed, what remains, and follow-up risks

For docs-only changes:

- run `git status`
- run `git diff --stat`
- confirm changed and staged files are documentation only
- no app build/test run is required unless non-doc files are touched accidentally

## Review Expectations

Call out:

- migration risks
- data-model assumptions
- backward-compatibility concerns
- auth/RLS/progression risks
- places where future optional AI integration will plug in

If unsure, preserve compatibility and leave a clear extension point rather than overcommitting to a hard-coded design.

## Local Tooling

Primary development environment:

- Windows native
- PowerShell
- main repo path: `C:\Code\Workout-App`
- Codex app as the Windows-native implementation agent
- VS Code in standard Windows mode, not Remote-WSL
- Codex worktrees under `C:\Users\<user>\.codex\worktrees\...`

The local environment may include `gh`, `jq`, `rg`, `vercel`, and repo-local Supabase CLI via `npx supabase ...`.

Agent guidance:

- prefer `rg` for codebase/text search
- use `gh` when helpful for issue and PR workflows
- use `vercel` for deployment/log/environment workflows when relevant
- verify required CLIs first with `Get-Command <tool>`
- do not assume WSL or bash unless explicitly requested

## Local Development Guardrails

- The local dev port is `3001`.
- Before starting the dev server, check the port with `.\scripts\check-port.ps1` or `Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue`.
- Do not run multiple dev servers for this repo.
- Do not run `npm install`, `npm update`, `npm run build`, and `npm run dev` concurrently.
- Worktrees do not include `.env.local` automatically.
- The local setup script should copy `.env.local` from `C:\Code\Workout-App\.env.local`, validate required public Supabase variables, and run `npm install`.
- `.env.local` remains gitignored and local-only.
- Do not add Tailwind content patterns that scan the whole repo.
- Do not intentionally scan `.next`, `node_modules`, `dist`, `build`, `coverage`, or `.git`.