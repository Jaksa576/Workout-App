# Adaptive Training

Adaptive Training is a mobile-first Progressive Web App for structured plans that progress with you. It guides new users through profile setup, helps them create goal-based training plans, tracks phase-based progression, and supports plan management for ongoing fitness goals.

## Built With

- Next.js 16.2.3
- React 19
- TypeScript
- Tailwind CSS
- Supabase for authentication and database
- Vercel for deployment

## Features

- **Onboarding Flow**: New users complete profile setup so plan creation can reuse durable training context.
- **Guided Plan Setup**: Create goal-based plan drafts from `/plans/new`, review and edit them, then save when ready.
- **Guided Setup Regeneration**: Reopen saved plan setup context for an existing plan, regenerate a draft, review it, and save back to the same plan.
- **Structured Plans**: Create multi-phase plans with workouts, exercises, and preset progression rules.
- **Phase Progression**: Automatic evaluation of workout sessions for advancement, repeats, or deloads based on clean sessions and pain flags.
- **Workout Tracking**: Log exercises, track progress, and view recommendations for next steps.
- **Plan Management**: Activate plans, delete mistakes, archive completed ones, and use advanced/manual structure edits when needed.
- **Exercise Videos**: Add YouTube demo links to exercises for better guidance.
- **Mobile-First UI**: Responsive design optimized for phones and tablets.

## What's Implemented

The app currently includes:

- Supabase email/password sign-in and account creation
- Public landing scaffold at `/` with the authenticated dashboard moved to `/dashboard`
- Protected app routes using Next.js proxy.ts
- Onboarding page for new users
- Dashboard with active plan and progress metrics at `/dashboard`
- Plans listing and detail pages
- Goal-based guided plan creation with review-before-save drafts
- Guided setup regeneration for existing plans with review-before-save drafts
- Plan creation with structured phases and workouts
- Workout flow with recommendations and check-in
- Phase progress tracking and manual advancement
- Plan management (activate, archive, delete phases/workouts/exercises)
- Exercise video link editing
- Settings/profile editing page
- Real Supabase-backed data loading
- API routes for onboarding, plans, sessions, and management
- Static exercise catalog for guided plans
- Progression evaluation server-side after check-ins

## Key Files

### Pages
- `app/onboarding/page.tsx` - Onboarding flow
- `app/page.tsx` - Public landing scaffold
- `app/dashboard/page.tsx` - Authenticated dashboard
- `app/plans/page.tsx` - Plans listing
- `app/plans/[planId]/page.tsx` - Plan detail
- `app/plans/new/page.tsx` - Plan creation
- `app/workout/page.tsx` - Workout flow

### API Routes
- `app/api/onboarding/route.ts` - Onboarding API
- `app/api/plans/route.ts` - Plan creation API
- `app/api/sessions/route.ts` - Session logging API
- `app/api/plans/[planId]/phase-action/route.ts` - Phase advancement API; route name is kept for compatibility

### Components
- `components/onboarding-flow.tsx` - Onboarding UI
- `components/workout-flow.tsx` - Workout UI
- `components/phase-progress-panel.tsx` - Phase progress display

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
## Local Development Workflow

The standard local development environment is now Windows-native.

- Repository location: `C:\Code\Workout-App`
- Primary agent/tool: Codex app running as a Windows-native agent
- Editor: VS Code in standard Windows mode, not Remote-WSL
- Terminal: PowerShell
- Preferred execution model for Codex-driven implementation: git worktrees

WSL-based workflows were previously tested, but they caused instability with Codex worktrees. WSL is no longer the default or recommended environment for this project. All autonomous workflows should assume Windows-native tooling unless a task explicitly overrides that assumption.

### Codex App Usage Pattern

Codex app is used for implementation execution:

- slice implementation
- worktree execution
- commit and push workflow

ChatGPT project chat is used for planning work:

- strategy
- roadmap planning
- slice design
- QA triage
- prompt generation

Standard slice workflow:

1. Plan the slice in ChatGPT.
2. Generate the Codex prompt.
3. Run the prompt in Codex app using a worktree.
4. Codex creates a branch, implements the slice, runs checks, updates docs, commits, and pushes.
5. Review the branch through the Vercel preview.
6. Merge manually after QA.

### Codex Worktrees And Local Environment

Codex worktrees are created under:

```powershell
C:\Users\<user>\.codex\worktrees\...
```

Worktrees do not include `.env.local` automatically. This is intentional because `.env.local` remains gitignored and local-only.

The Codex local environment setup script is responsible for:

- copying `.env.local` from `C:\Code\Workout-App\.env.local`
- validating required variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- running `npm install`

### Windows Tooling Notes

Run project commands from PowerShell in the repo or active Codex worktree. Before starting a local dev server, check whether port `3001` is already in use:

```powershell
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
```

If local Next.js processes need inspection:

```powershell
Get-Process node -ErrorAction SilentlyContinue
```

Do not run multiple dev servers for this repo at the same time, and do not run `npm install`, `npm update`, `npm run build`, and `npm run dev` concurrently.

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

```powershell
npm install
```

Run locally:

```powershell
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

Run type checking:

```powershell
npm run typecheck
```

Run a production build:

```powershell
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

```powershell
git status
git add .
git commit -m "Update workout app"
git push
```

Then Vercel should redeploy automatically.
