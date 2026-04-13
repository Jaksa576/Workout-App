# Workout App

Workout App is a mobile-first workout planner built as a Progressive Web App with Next.js, Tailwind CSS, and Supabase. It is designed for personal training use first: create a plan, run a workout, check off exercises, and log how the session felt so progression decisions stay grounded in actual results.

## Current state

- Mobile-first app shell with dashboard, plans, plan detail, workout, settings, and login screens
- Supabase email authentication with protected app routes
- Supabase-backed plan, phase, workout, exercise, profile, session, and exercise-result data
- First-user onboarding that captures goal, limitations, equipment, days per week, session length, and first-plan choice
- Guided starter plan generation that creates a usable first plan without AI token usage
- Structured plan creation flow that supports multiple phases, multiple workouts per phase, weekly schedule chips, starter exercise library picks, and ordered exercises
- Connected workout flow with a checklist, rest timer, same-page check-in, exercise video links, and saved completion summary
- Plan detail flow for adding or updating YouTube demo links on existing exercises
- Workout logging that saves completion date, pain, difficulty, notes, completed exercise results, and structured progression decisions
- Explicit phase progression workflow for moving forward, moving back, or marking a plan complete
- SQL schema, profile creation trigger, updated-at triggers, and row-level security policies for private user data
- User-facing copy pass that removes developer/prototype language from normal app screens

## Local setup

1. Install Node.js LTS from [nodejs.org](https://nodejs.org/).
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env.local` and fill in your Supabase project values:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Start the local dev server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000).

## Supabase setup

1. Create or open a Supabase project.
2. Run [`supabase/schema.sql`](./supabase/schema.sql) in the SQL editor for a fresh setup.
   - For an existing database, apply [`supabase/migrations/20260412160000_onboarding_progression.sql`](./supabase/migrations/20260412160000_onboarding_progression.sql).
3. Enable Email auth in Supabase Authentication settings.
4. Copy the project URL and anon key into `.env.local`.
5. Create an account from the app login screen. The database trigger creates the starter profile row automatically.

## Verification

Run these before deploying or after a larger implementation pass:

```bash
npm run typecheck
npm run build
```

The app currently uses protected routes, so signed-out visits to the dashboard and planner screens redirect to `/login`.

## Vercel setup

1. Import the GitHub repo into Vercel.
2. Add these environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy from the `main` branch.
4. Open the deployed URL on your phone and use `Add to Home screen` if you want the PWA installed.

## Recommended next steps

- Finish logged-in testing for onboarding, starter plan creation, and structured progression
- Add editing flows for existing plans, phases, workouts, and exercises
- Add active-plan switching when more than one plan exists
- Add account/profile editing in Settings
- Add richer session history and progress trend views
- Add read-only plan sharing when personal tracking is stable
- Add AI-assisted workout plan drafts after the manual workflow feels solid
- Add exercise substitutions when pain, equipment, or schedule changes
