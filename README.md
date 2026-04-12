# Workout App

Workout App is a mobile-first workout planner built as a Progressive Web App with Next.js, Tailwind, and Supabase. The project is shaped for personal use first, with a clear path to add sharing and AI-generated workout drafts later.

## What is implemented

- Mobile-first PWA shell for Pixel-friendly use
- Dashboard, plans, plan detail, today, check-in, and settings screens
- Structured progression model with phase goals, advancement criteria, and deload criteria
- Built-in workout checklist UI
- Post-workout recommendation flow based on completion, pain, and effort
- Supabase-ready client helper
- SQL schema and row-level security policies for private user data
- Vercel and local environment variable strategy

## Local setup

1. Install Node.js LTS from [nodejs.org](https://nodejs.org/).
2. In this project folder, install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Run the app:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000).

## Supabase setup

1. Open your Supabase SQL editor.
2. Run [`supabase/schema.sql`](./supabase/schema.sql).
3. Enable Email auth in Supabase Authentication settings.
4. Copy the project URL and anon key into `.env.local`.

## GitHub setup

1. Create a GitHub repository.
2. Add it as the remote for this folder:

```bash
git remote add origin <your-repo-url>
git branch -M main
git add .
git commit -m "Initial Workout App scaffold"
git push -u origin main
```

## Vercel setup

1. Import the GitHub repo into Vercel.
2. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy from the `main` branch.
4. Open the deployed URL in Chrome on your Pixel and use `Add to Home screen`.

## Recommended next implementation steps

- Replace mock data in `lib/data.ts` with Supabase queries
- Wire login and session handling to `supabase.auth`
- Add create/edit forms for plans, phases, workouts, and exercises
- Save check-in results to `workout_sessions`
- Add YouTube links and an exercise library
- Add plan sharing after personal workflow feels solid
