# Workout App

Workout App is a mobile-first workout planner built as a Progressive Web App with Next.js, Tailwind CSS, and Supabase. It is designed for personal training use first: create a plan, run today's workout, check off exercises, and log how the session felt so progression decisions stay grounded in actual results.

## Current state

- Mobile-first app shell with dashboard, plans, plan detail, today's workout, workout check-in, settings, and login screens
- Supabase email authentication with protected app routes
- Supabase-backed plan, phase, workout, exercise, profile, session, and exercise-result data
- Plan creation flow that saves one plan, one phase, one workout, and ordered exercises
- Today's workout view with a checklist, rest timer, exercise video links, and session handoff
- Workout check-in flow that saves completion, pain, difficulty, notes, and completed exercise results
- Recommendation helper for whether to progress, repeat, review, or deload
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
2. Run [`supabase/schema.sql`](./supabase/schema.sql) in the SQL editor.
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

- Add editing flows for existing plans, phases, workouts, and exercises
- Add active-plan switching when more than one plan exists
- Add account/profile editing in Settings
- Add richer session history and progress trend views
- Add exercise substitutions when pain, equipment, or schedule changes
- Add AI-assisted workout plan drafts after the manual workflow feels solid
- Add read-only plan sharing when personal tracking is stable
