# AGENTS.md

## Product direction

This repository is being refactored from a rehab-specific phased workout app into a broader goal-based adaptive training platform.

The app should support multiple goal tracks using the same core infrastructure:
- recovery / rehab
- general fitness
- strength
- hypertrophy
- running
- sport performance
- consistency / habit building

The core product idea is:
- users create structured training programs
- programs are divided into phases (current user-facing term; `plan_phases` may remain the compatibility/storage term)
- workouts are completed and logged
- progression is evaluated based on the program’s progression mode
- plan creation must work without an LLM today
- the architecture must allow a future LLM-driven plan drafting path later

## Non-goals

Do not turn this app into a generic exercise logger.
Do not remove the phased/block structure.
Do not make an LLM required for plan creation.
Do not break compatibility with existing plans unless explicitly asked.
Do not perform broad destructive renames without a migration-safe reason.

## Architecture principles

Prefer additive, migration-safe refactors over rewrites.

Preserve these core concepts:
- user profile
- workout plan / program
- phases
- workouts
- exercises
- progression logic
- session logging

Generalize narrow rehab-specific assumptions into reusable abstractions.

Examples:
- use "Phase" in the UI/product language while keeping `plan_phases` and other compatibility/storage names unchanged unless there is a migration-safe reason to change them
- progression should support multiple modes, not only symptom-based rehab logic
- onboarding should store durable profile information
- plan-specific personalization should happen in the plan creation flow

## Required future-ready design

All plan drafting must go through a single abstraction, even before an LLM is added.

Target interface shape:
- draftPlan(context, { strategy })

Supported strategies:
- template
- manual
- llm (stub only for now)

The rest of the app should not care whether a plan was drafted manually, from templates, or eventually by an LLM.

## LLM design constraint

We will add an LLM later to help draft plans based on:
- user profile
- age
- weight
- training experience
- current fitness level
- injuries / limitations
- equipment access
- schedule
- preferences
- current goal

Near-term AI support may arrive first as external structured draft import using the user's own AI assistant before any provider-backed integration exists.

The LLM should eventually help automate exercise selection and phase design.
For now:
- do not integrate a provider
- do not add runtime dependencies on an LLM
- do create interfaces and data structures that make later integration easy

## Preferred product model

Use these concepts:
- GoalTrack
- ProgressionMode
- PlanSource
- PlanCreationContext

GoalTrack should support:
- recovery
- general_fitness
- strength
- hypertrophy
- running
- sport_performance
- consistency

ProgressionMode should support:
- symptom_based
- adherence_based
- performance_based
- hybrid

PlanSource should support:
- template
- manual
- llm

## Implementation expectations

For large changes:
- inspect the existing repo structure first
- identify the current seams before coding
- propose a migration-safe plan before implementation
- work in small, reviewable slices
- keep the app functional after each slice

Prefer this sequence unless the repo strongly suggests a better one:
1. shared types and schema changes
2. onboarding/profile refactor
3. new guided plan creation flow
4. template-based program drafting
5. progression strategy refactor
6. UI terminology refresh
7. LLM-ready draftPlan abstraction
8. docs and cleanup

## Current Planning Priority

The landing page, app icon, full app UX redesign sequence, and Slice 9K-9M AI Draft Plan UX Campaign are complete. The immediate planning priority is Slice 9N, Comprehensive UX Cleanup And AI Draft QA Patch, before Slice 10 Exercise Media And Instruction Layer.

Guardrails for this phase:
- docs first
- work in PR-sized slices
- preserve auth and RLS behavior
- preserve plan, phase, workout, session, and progression behavior
- no LLM/provider integration
- preserve the provider-free Draft with AI setup -> draft -> review/edit -> save contract
- preserve AI draft validation and review before save
- do not start Slice 10 exercise media or instruction-layer work inside Slice 9N
- avoid broad destructive route changes outside the dedicated route-split slice
- use `GPT-5.4` where practical for token efficiency; reserve higher-reasoning models for route/auth regressions or hard architectural conflicts

## Prompt handling expectations

When given a large redesign task:
- first restate the current architecture as you found it
- identify which parts are reusable vs overly specific
- list assumptions
- produce a phased implementation plan
- wait for approval before broad coding if the task is large

When implementing:
- state which slice you are working on
- keep changes scoped
- document tradeoffs
- avoid hidden architecture drift

## Code quality expectations

Use the repository’s existing stack and conventions.
Prefer the smallest change that preserves future extensibility.
Avoid creating parallel systems when a clean extension of the existing one will work.
Keep types strong and explicit.
Prefer deterministic, testable logic over clever heuristics.

## Verification expectations

Before considering work complete:
- run relevant type checks
- run relevant tests
- add or update tests when behavior changes
- verify no obvious regressions in existing plan behavior
- summarize what changed, what remains, and any follow-up risks

## Review expectations

Call out:
- migration risks
- data model assumptions
- backward compatibility concerns
- places where future LLM integration will plug in

If you are unsure, preserve compatibility and leave a clear extension point rather than overcommitting to a hard-coded design.

## Local tooling available

Primary development environment:
- Use the Windows-native local development environment by default.
- Keep the main repository at `C:\Code\Workout-App`.
- Use the Codex app as the Windows-native implementation agent.
- Use VS Code in standard Windows mode, not Remote-WSL.
- Use PowerShell for local commands unless a task explicitly says otherwise.
- Prefer Codex worktrees for implementation slices.

The local development environment may include these CLIs in PowerShell:

- `gh` (GitHub CLI)
- `jq`
- `rg` (ripgrep)
- `vercel`

Supabase CLI is available **in this repository only** and should be run via:

- `npx supabase ...`

Agent guidance:
- Prefer `rg` for codebase/text search over slower generic shell search
- Use `gh` when GitHub CLI is helpful for repo inspection or PR workflows
- Use `vercel` for deployment/log/environment workflows when relevant
- Do not assume Supabase CLI is globally installed; use `npx supabase`
- If a CLI is needed, verify availability first with `Get-Command <tool>`

## Local Execution Assumptions

- Default environment = Windows native.
- Shell = PowerShell.
- Repo path = `C:\Code\Workout-App`.
- Codex runs in worktrees, not the main working directory.
- Codex worktrees are created under `C:\Users\<user>\.codex\worktrees\...`.
- All commands should be Windows-compatible unless otherwise specified.
- WSL-based workflows were previously tested but caused instability with Codex worktrees.
- WSL is no longer the default or recommended environment for this project.
- All autonomous workflows should assume Windows-native execution unless explicitly overridden.

## Codex App Workflow

Codex app is used for:

- slice implementation
- worktree execution
- commit and push workflow

ChatGPT project chat is used for:

- strategy
- roadmap planning
- slice design
- QA triage
- prompt generation

Standard execution flow:

1. Plan the slice in ChatGPT.
2. Generate the Codex prompt.
3. Run the prompt in Codex app using a worktree.
4. Codex creates a branch, implements the slice, runs checks, updates docs, commits, and pushes.
5. Review the branch through the Vercel preview.
6. Merge manually after QA.

## Local development and worktree guardrails

- The local dev port is `3001`.
- Before starting the dev server, check the port with `Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue`.
- Do not run multiple dev servers for this repo.
- Do not run `npm install`, `npm update`, `npm run build`, and `npm run dev` concurrently.
- Worktrees do not include `.env.local` automatically.
- The Codex local environment setup script should copy `.env.local` from `C:\Code\Workout-App\.env.local`, validate `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and run `npm install`.
- `.env.local` remains gitignored and local-only.
- Do not add Tailwind content patterns that scan the whole repo, such as `./**/*`.
- Do not intentionally scan `.next`, `node_modules`, `dist`, `build`, `coverage`, or `.git`.
