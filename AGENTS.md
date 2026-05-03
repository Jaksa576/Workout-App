# AGENTS.md

## Standard Docs

Repo docs are the source of truth. Read the durable hot-path docs before broad implementation:

- `docs/product.md`: product truth, guardrails, non-goals, and UX principles
- `docs/architecture.md`: technical architecture, data flow, auth/route boundaries, and local workflow
- `docs/roadmap.md`: milestone sequence, completed campaigns, deferred product work
- `docs/current-task.md`: current active state, next action, validation expectations
- `docs/campaigns/`: active campaign briefs when a campaign is in progress

Completed campaigns live in `docs/campaigns/archived/`. Historical context that no longer belongs in the hot path may live in `docs/archive/`.

`docs/agent-handoff.md` is retired and should not be treated as a required source-of-truth file.

## Product Guardrails

Workout App is a progression-based adaptive training system, not a generic workout logger.

Preserve the plan/program -> phase -> workout -> exercise -> session/progression model. Programs should adapt to the user through structured progression signals; they should not merely record workouts.

Plan creation must work without an LLM. AI-assisted import must remain provider-free, validated, editable, and review-before-save unless a future approved slice explicitly changes that boundary.

Do not:

- make LLMs required for core functionality
- add provider-backed LLM integration without explicit approval
- save AI-generated plans without validation and user review
- weaken deterministic progression behavior
- break auth, RLS, route, plan, phase, workout, session, or progression behavior unless explicitly scoped
- turn the app into a generic exercise logger

## Implementation Expectations

Prefer additive, migration-safe refactors over rewrites.

For large changes:

- inspect the existing repo structure first
- identify current seams before coding
- propose a migration-safe plan before broad implementation
- work in small, reviewable slices
- keep the app functional after each slice

When implementing:

- state which slice or task you are working on
- keep changes scoped
- document tradeoffs
- preserve compatibility names such as `plan_phases` unless a migration-safe rename is explicitly approved
- avoid parallel systems when a clean extension of the existing system will work
- keep types strong and explicit
- prefer deterministic, testable logic over clever heuristics

## Documentation Workflow

Codex owns documentation freshness during implementation:

- update `docs/current-task.md` after every implementation slice or docs-only state change
- update the active `docs/campaigns/*.md` brief when campaign status changes
- move completed campaign briefs to `docs/campaigns/archived/`
- update `docs/roadmap.md` when milestone sequencing or major status changes
- update `docs/architecture.md` only when durable technical or workflow architecture changes
- update `docs/product.md` only when durable product truth changes
- preserve useful stale history in `docs/archive/` instead of keeping it in hot-path docs

Final reports must include:

- documentation delta
- compact state packet

The state packet is a transition note for the next human or agent. It is not a source of truth; repo docs remain authoritative.

## Verification Expectations

Before considering work complete:

- run relevant type checks
- run relevant tests
- add or update tests when behavior changes
- verify no obvious regressions in existing plan behavior
- summarize what changed, what remains, and any follow-up risks

For docs-only changes:

- run `git status`
- run `git diff --stat`
- confirm changed and staged files are documentation only
- no app build/test run is required unless non-doc files are touched accidentally

## Review Expectations

Call out:

- migration risks
- data model assumptions
- backward compatibility concerns
- auth/RLS/progression risks
- places where future LLM integration will plug in

If unsure, preserve compatibility and leave a clear extension point rather than overcommitting to a hard-coded design.

## Local Tooling

Primary development environment:

- Windows native
- PowerShell
- main repo path: `C:\Code\Workout-App`
- Codex app as the Windows-native implementation agent
- VS Code in standard Windows mode, not Remote-WSL
- Codex worktrees under `C:\Users\<user>\.codex\worktrees\...`

The local development environment may include:

- `gh`
- `jq`
- `rg`
- `vercel`

Supabase CLI is available in this repository only and should be run via:

- `npx supabase ...`

Agent guidance:

- prefer `rg` for codebase/text search
- use `gh` when helpful for repo inspection or PR workflows
- use `vercel` for deployment/log/environment workflows when relevant
- verify required CLIs first with `Get-Command <tool>`
- do not assume WSL or bash unless explicitly requested

## Local Development Guardrails

- The local dev port is `3001`.
- Before starting the dev server, check the port with `Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue`.
- Do not run multiple dev servers for this repo.
- Do not run `npm install`, `npm update`, `npm run build`, and `npm run dev` concurrently.
- Worktrees do not include `.env.local` automatically.
- The Codex local environment setup script should copy `.env.local` from `C:\Code\Workout-App\.env.local`, validate `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and run `npm install`.
- `.env.local` remains gitignored and local-only.
- Do not add Tailwind content patterns that scan the whole repo, such as `./**/*`.
- Do not intentionally scan `.next`, `node_modules`, `dist`, `build`, `coverage`, or `.git`.
