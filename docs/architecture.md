# Architecture

This app is a mobile-first workout planner built with Next.js, Supabase, and Vercel.

## Next.js

Next.js runs the web app. It handles:

- Pages such as the dashboard, plans, workout flow, settings, and login.
- API routes such as plan creation and workout session saving.
- Server-rendered data loading for protected app pages.

The app uses the Next.js App Router, so routes live under `app/`.

## Supabase

Supabase provides:

- Email authentication.
- A Postgres database.
- Row-level security policies that keep each user's data private.

The main tables are:

- `profiles`
- `workout_plans`
- `plan_phases`
- `workout_templates`
- `exercise_entries`
- `workout_sessions`
- `exercise_results`

The schema and RLS policies live in `supabase/schema.sql`.
Incremental database changes also live in `supabase/migrations/`.

## Vercel

Vercel deploys the app from GitHub. It reads environment variables for Supabase:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Pushing to the connected GitHub branch should trigger a new Vercel deployment.

## Routing And Auth

- Protected app routes use `proxy.ts` plus server auth helpers.
- Signed-out users are redirected to `/login`.
- Backward-compatible routes like `/today` and `/check-in` redirect into the newer `/workout` flow.

## Data Flow

Most writes follow this pattern:

1. A user fills out a form in a React component.
2. The component sends data to a Next.js API route.
3. The API route checks the signed-in user.
4. The API route validates the input.
5. Supabase writes the data using the authenticated server client.
6. A page reload or refresh reads updated data through `lib/data.ts`.

## Major App Systems

- Onboarding: collects goal, limitations, equipment, schedule, and first-plan choice before a new user reaches the dashboard.
- Plan creation: creates a structured plan with phases, workouts, scheduled days, exercises, and preset progression rules.
- Plan detail: shows phase rules and workout exercises.
- Workout flow: selects a workout, checks off exercises, saves check-in data, evaluates progression, and shows progress.
- Dashboard: shows the next session, current plan, and quick progress metrics.
- Settings: shows profile inputs and upcoming roadmap items.

## AI Draft Boundary

AI plan drafting is intentionally disabled by default. The app has a provider boundary for future AI drafts, but the first-user flow currently uses the guided starter plan generator so no paid token calls happen silently.
