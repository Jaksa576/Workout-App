# Architecture

This app is a mobile-first adaptive training planner built with Next.js, Supabase, and Vercel.

For product truth, read `docs/product.md`. This document owns technical architecture and durable workflow conventions.

## App Platform

- Next.js App Router powers pages and API routes under `app/`.
- Supabase provides email authentication, Postgres storage, and row-level security.
- Vercel deploys the app from GitHub.
- Protected routes use `proxy.ts` plus server-side auth helpers.
- Data loading lives mostly in `lib/data.ts`.
- Writes generally flow through API route handlers, validation helpers, and the authenticated Supabase server client.

## Public And Authenticated Route Boundary

Current route boundary:

- `/` is the public landing page.
- `/dashboard` is the authenticated dashboard.
- `/plans`, `/plans/new`, `/plans/[planId]`, `/workout`, and `/settings` are authenticated app routes.

Boundary rules:

- Public landing components must not depend on Supabase-authenticated user records.
- Public previews should use static or deterministic marketing mock data.
- Protected routes should continue to rely on existing auth helpers and `proxy.ts`.
- Shared route classification lives in `lib/app-route-boundary.ts`.
- Authenticated shell visibility is route-aware inside `AppShell`.

## Data Model

The core database/app model is:

1. `profiles`
2. `workout_plans`
3. `plan_phases`
4. `workout_templates`
5. `exercise_entries`
6. `workout_sessions`
7. `exercise_results`

Compatibility names such as `plan_phases` remain intentionally unchanged unless a migration-safe rename is explicitly approved.

## Plan And Session Architecture

- `workout_plans` is the top-level plan/program structure.
- `plan_phases` stores progressive training phases.
- `workout_templates` stores planned workouts within phases.
- `exercise_entries` stores prescribed exercises.
- `workout_sessions` and `exercise_results` store completed workout history and progression signals.
- Session history should remain readable after plan edits through workout/exercise snapshots.

## Plan Creation And Editing

- Guided plan creation, manual plan creation, and external AI draft import converge on review/edit before save.
- Plan creation should save through `createStructuredPlanForUser` in `lib/plan-write.ts`.
- Saved-plan detail edits and setup/regenerate edits save through `updateStructuredPlanForUser` in `lib/plan-write.ts`.
- The update path snapshots current workout and exercise names before replacing live plan structure.
- Guided setup answers can persist on `workout_plans.setup_context`.
- Older plans without setup context can be reopened with safely reconstructed fields and explicit missing-context guidance.

## Progression Architecture

- Progression remains server-side and deterministic.
- Progression prompts should derive from active plan, active phase, recent sessions, completion, pain flags, effort, and phase snapshots.
- Dashboard progression messaging should use existing progression helpers rather than creating dashboard-only readiness inference.
- User-confirmed progression actions should remain explicit.

## Plan Drafting And AI Boundary

- Plan drafts should flow through `lib/plan-drafting/plan-draft-provider.ts`.
- The enabled in-app draft path is template-based.
- Manual Builder remains available.
- External AI draft import is provider-free and does not make server-side model calls.
- Imported AI output must be validated and converted into the same review/edit/save flow before persistence.
- Provider-backed LLM drafting is deferred and must not become required for core functionality.
- API keys and provider details must stay server-side if provider-backed LLM support is added later.

## UI And Theme Architecture

- Theme styling should prefer semantic tokens and shared primitives over hardcoded page-specific colors.
- Light/dark mode flows through `html[data-theme]` with system preference by default.
- The user-facing theme preference control lives in Settings.
- The theme preference remains a local client-side override rather than a profile-backed setting.
- Public landing and authenticated app surfaces should stay aligned through shared foundations where practical.
- App icon and PWA surfaces use the approved generated assets in `public/` and `app/favicon.ico`.

## Local Development Workflow

Standard local environment:

- Windows native
- PowerShell
- repository: `C:\Code\Workout-App`
- Codex app running as a Windows-native agent
- VS Code in standard Windows mode, not Remote-WSL
- Codex worktrees under `C:\Users\<user>\.codex\worktrees\...`

WSL-based workflows were previously tested but caused instability with Codex worktrees. Do not assume WSL or bash unless explicitly requested.

Worktrees do not include `.env.local` automatically. The Codex local environment setup script copies `.env.local` from `C:\Code\Workout-App\.env.local`, validates `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and runs `npm install`.

## Documentation Workflow

Active source-of-truth docs:

- `AGENTS.md`
- `docs/product.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/current-task.md`
- active `docs/campaigns/*.md` when relevant

Completed campaigns belong in `docs/campaigns/archived/`. Old history that should not stay hot-path can live in `docs/archive/`.

`docs/agent-handoff.md` is retired and is not part of the standard active source-of-truth set.

Codex final reports should include a documentation delta and compact state packet. The state packet is a transition note, not a source of truth.

## Validation Expectations

For code changes, usually run:

- `npm run typecheck`
- `npm run test`
- `npm run build`

Known lint issue:

- `npm run lint` currently fails because the Next 16 setup interprets `next lint` as a project directory named `lint`.

For docs-only changes, run `git status` and `git diff --stat`, confirm the diff is docs-only, and do not run app build/test unless non-doc files are touched accidentally.
