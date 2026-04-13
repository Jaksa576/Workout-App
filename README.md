# Workout App

Workout App is a mobile-first Progressive Web App for personal workout planning, tracking, and progression management. It guides new users through onboarding to create structured workout plans, tracks phase-based progression, and supports plan management for ongoing fitness goals.

## Built With

- Next.js 16.2.3
- React 19
- TypeScript
- Tailwind CSS
- Supabase for authentication and database
- Vercel for deployment

## Features

- **Onboarding Flow**: New users complete guided setup to create personalized starter plans based on goals, equipment, and schedule.
- **Structured Plans**: Create multi-phase plans with workouts, exercises, and preset progression rules.
- **Phase Progression**: Automatic evaluation of workout sessions for advancement, repeats, or deloads based on clean sessions and pain flags.
- **Workout Tracking**: Log exercises, track progress, and view recommendations for next steps.
- **Plan Management**: Edit plans, delete mistakes, activate different plans, and archive completed ones.
- **Exercise Videos**: Add YouTube demo links to exercises for better guidance.
- **Mobile-First UI**: Responsive design optimized for phones and tablets.

## What's Implemented

The app currently includes:

- Supabase email/password sign-in and account creation
- Protected app routes using Next.js proxy.ts
- Onboarding page for new users
- Dashboard with active plan and progress metrics
- Plans listing and detail pages
- Plan creation with structured phases and workouts
- Workout flow with recommendations and check-in
- Phase progress tracking and manual advancement
- Plan management (activate, archive, delete phases/workouts/exercises)
- Exercise video link editing
- Settings/profile page
- Real Supabase-backed data loading
- API routes for onboarding, plans, sessions, and management
- Static exercise catalog for guided plans
- Progression evaluation server-side after check-ins

## Key Files

### Pages
- `app/onboarding/page.tsx` - Onboarding flow
- `app/page.tsx` - Dashboard
- `app/plans/page.tsx` - Plans listing
- `app/plans/[planId]/page.tsx` - Plan detail
- `app/plans/new/page.tsx` - Plan creation
- `app/workout/page.tsx` - Workout flow

### API Routes
- `app/api/onboarding/route.ts` - Onboarding API
- `app/api/plans/route.ts` - Plan creation API
- `app/api/sessions/route.ts` - Session logging API
- `app/api/plans/[planId]/phase-action/route.ts` - Phase advancement API

### Components
- `components/onboarding-flow.tsx` - Onboarding UI
- `components/workout-flow.tsx` - Workout UI
- `components/phase-progress-panel.tsx` - Progress display

### Libraries
- `lib/data.ts` - Data loading helpers
- `lib/progression.ts` - Progression logic
- `lib/plan-write.ts` - Plan creation helpers
- `lib/starter-plan-generator.ts` - Guided plan generation
- `lib/exercise-library.ts` - Exercise catalog

### Database
- `supabase/schema.sql` - Database schema
- `supabase/migrations/` - Incremental schema changes

## Supabase Setup

The app expects these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=https://workout-app-seven-delta.vercel.app
```

For local development, place them in `.env.local`.

For Vercel, add them in the Vercel project's Environment Variables settings.

In Supabase Auth URL Configuration, set the Site URL and add this redirect URL for email confirmations:

```
https://workout-app-seven-delta.vercel.app/
```

## Database Schema

The current schema lives in `supabase/schema.sql`.

During early development, it is acceptable to reset the app database tables if the test data is not useful.

To reset app data only, run this in the Supabase SQL Editor:

```sql
drop table if exists public.exercise_results cascade;
drop table if exists public.workout_sessions cascade;
drop table if exists public.exercise_entries cascade;
drop table if exists public.workout_templates cascade;
drop table if exists public.progression_rules cascade;
drop table if exists public.plan_phases cascade;
drop table if exists public.workout_plans cascade;
drop table if exists public.profiles cascade;
```

Then run the full contents of `supabase/schema.sql`.

Do not drop Supabase's `auth.users` table.

If existing auth users need new profile rows after resetting profiles, run:

```sql
insert into public.profiles (id, goal, injuries, equipment, days_per_week, session_minutes)
select
  id,
  'Build a sustainable routine.',
  '{}',
  '{}',
  3,
  45
from auth.users
on conflict (id) do nothing;
```

## Local Development

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Run type checking:

```bash
npm run typecheck
```

Run a production build:

```bash
npm run build
```

The app has previously passed `npm run typecheck` and `npm run build`.

If `npm run build` fails locally with spawn EPERM on Windows, rerun the build outside the sandbox or in a normal terminal. That issue was seen once as an environment restriction, not an app type error.

## Deployment

The app is deployed through Vercel from GitHub.

Before deploying, confirm:

- `package.json` uses Next.js 16.2.3 or newer
- `package-lock.json` is committed after dependency updates
- Vercel has the same Supabase environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL`
- The GitHub repo points to the correct project root

Commit and push:

```bash
git status
git add .
git commit -m "Update workout app"
git push
```

Then Vercel should redeploy automatically.
