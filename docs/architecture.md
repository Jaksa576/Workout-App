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
- Optional reviewed exercise guidance is stored migration-free in existing exercise fields: labeled text guidance in `exercise_entries.coaching_note` and reviewed YouTube demo links in `exercise_entries.video_url`.
- `workout_sessions` and `exercise_results` store completed workout history and progression signals.
- Session history should remain readable after plan edits through workout/exercise snapshots.
- Issue #6 owns discovery and future migration-safe extension of the workout/session/result model for set-level recording. Do not assume a final set schema until that issue’s domain-contract child issue is approved.

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
- Set-level recording may provide richer future inputs, but Issue #6 must not silently alter progression rules. Any new progression signal requires an explicit issue, tests, and product approval.

## Plan Drafting And AI Boundary

- Plan drafts should flow through `lib/plan-drafting/plan-draft-provider.ts`.
- The enabled in-app draft path is template-based.
- Manual Builder remains available.
- External AI draft import is provider-free and does not make server-side model calls.
- Imported AI output must be validated and converted into the same review/edit/save flow before persistence.
- AI-imported exercise guidance and demo links are optional metadata. They must be normalized, reviewed, and saved through the structured plan flow rather than bypassing validation.
- Optional provider-backed plan drafting is queued in GitHub Issue #8.
- Direct AI generation must remain feature-gated and unavailable when server config or quota does not allow it; Guided Setup, Manual Builder, and external AI import must continue to work.
- Provider adapters should live behind the plan-drafting boundary rather than in UI components, and provider keys/details must remain server-only.
- Model output must be parsed, normalized, and strictly validated before it can enter app state.
- Direct AI generation must not write plan tables until a user reviews and saves through the structured plan write path.
- AI-assisted active-plan mutation, phase alternatives, and automatic next-phase replacement remain deferred.
- Issue #8 must be reconciled with the exercise tracking and prescription contract approved through Issue #6 before implementation resumes.

## UI And Theme Architecture

- Theme styling should prefer semantic tokens and shared primitives over hardcoded page-specific colors.
- Light/dark mode flows through `html[data-theme]` with system preference by default.
- The user-facing theme preference control lives in Settings.
- The theme preference remains a local client-side override rather than a profile-backed setting.
- User-facing “today” behavior uses the browser-detected IANA timezone when available.
- Authenticated routes persist that timezone in the `workout-app-time-zone` cookie and localStorage key so server-rendered data and client-side date inputs share the same local-date basis.
- Public landing and authenticated app surfaces should stay aligned through shared foundations where practical.
- App icon and PWA surfaces use the approved generated assets in `public/` and `app/favicon.ico`.

## Issue-Driven Delivery Workflow

GitHub issues own active implementation scope and sequencing.

- Large umbrella issues should be decomposed into independently reviewable child issues.
- Pull requests should reference the issue they implement.
- `docs/current-task.md` identifies the current priority and immediate next issue.
- `docs/product.md`, `docs/architecture.md`, and `docs/roadmap.md` should only be updated when durable truth or sequencing changes.
- `docs/campaigns/` is deprecated and reference-only. Do not create new campaign documents.
- Historical campaign files may remain temporarily for archaeology, but they are not active instructions.

Codex final reports should include the issue number, branch, commit SHA, pushed remote branch, validation results, documentation delta, compact state packet, and branch-push verification result.

The state packet is a transition note, not a source of truth.

## Local Development Workflow

Standard local environment:

- Windows native
- PowerShell
- repository: `C:\Code\Workout-App`
- Codex app running as a Windows-native agent
- VS Code in standard Windows mode, not Remote-WSL
- Codex worktrees under `C:\Users\<user>\.codex\worktrees\...`

WSL-based workflows were previously tested but caused instability with Codex worktrees. Do not assume WSL or bash unless explicitly requested.

Worktrees do not include `.env.local` automatically. The local setup script copies `.env.local` from `C:\Code\Workout-App\.env.local`, validates required public Supabase variables, and runs `npm install`.

## Validation Expectations

For code changes, use the standard validation gate:

- `npm run check`

The wrapper runs:

- `npm run typecheck`
- `npm run test`
- `npm run build`

Known lint issue:

- `npm run lint` currently fails because the Next 16 setup interprets `next lint` as a project directory named `lint`.

For docs-only changes, run `git status` and `git diff --stat`, confirm the diff is docs-only, and do not run app build/test unless non-doc files are touched accidentally.