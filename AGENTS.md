# Agent Instructions

This repo is a Next.js + Supabase workout app for small real-world use.

## Before Major Changes

- Read `docs/agent-handoff.md`.
- Read `docs/current-task.md`.
- Read `docs/roadmap.md`.
- Summarize the current state in plain English before coding when taking over from another agent.

## While Working

- Keep solutions simple, reliable, and easy to extend.
- Prefer existing project patterns over new abstractions.
- Preserve Supabase auth and row-level security expectations.
- Do not expose server-only secrets to the client.
- Do not make unrelated product changes.
- Explain changes in beginner-friendly plain English.
- Call out risks, tradeoffs, and verification steps.

## After Major Implementation Steps

- Update `docs/agent-handoff.md` with:
  - what changed
  - what was verified
  - what remains
  - any known risks
- Run relevant checks, usually `npm run typecheck` and `npm run build` for code changes.
- Mention anything that still needs manual logged-in testing.

## Current Project Shape

- App routes and API routes live under `app/`.
- Shared UI lives under `components/`.
- Data helpers and validation live under `lib/`.
- Supabase schema and RLS policies live in `supabase/schema.sql`.
- The app deploys from GitHub to Vercel.
