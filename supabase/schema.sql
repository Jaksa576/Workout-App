create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  goal text not null,
  injuries text[] not null default '{}',
  equipment text[] not null default '{}',
  days_per_week integer not null check (days_per_week between 1 and 7),
  session_minutes integer not null check (session_minutes between 10 and 180),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  is_active boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.plan_phases (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.workout_plans(id) on delete cascade,
  phase_number integer not null check (phase_number >= 1),
  goal text not null,
  advance_criteria text not null,
  deload_criteria text not null,
  unique(plan_id, phase_number)
);

create table if not exists public.progression_rules (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references public.plan_phases(id) on delete cascade,
  rule_type text not null check (rule_type in ('advance', 'repeat', 'review', 'deload')),
  rule_description text not null
);

create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references public.plan_phases(id) on delete cascade,
  name text not null,
  focus text not null,
  summary text not null default '',
  day_order integer not null default 1
);

create table if not exists public.exercise_entries (
  id uuid primary key default gen_random_uuid(),
  workout_template_id uuid not null references public.workout_templates(id) on delete cascade,
  name text not null,
  sets integer not null check (sets >= 1),
  reps text not null,
  rest text not null,
  coaching_note text not null default '',
  video_url text,
  sort_order integer not null default 1
);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_template_id uuid not null references public.workout_templates(id) on delete cascade,
  completed_on date not null default current_date,
  completed boolean not null default false,
  pain_occurred boolean not null default false,
  perceived_difficulty text not null check (perceived_difficulty in ('too_easy', 'appropriate', 'too_hard')),
  notes text not null default '',
  recommendation text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.exercise_results (
  id uuid primary key default gen_random_uuid(),
  workout_session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_entry_id uuid not null references public.exercise_entries(id) on delete cascade,
  completed boolean not null default false,
  actual_reps text,
  actual_load text,
  actual_duration text,
  pain_flag boolean not null default false
);

alter table public.profiles enable row level security;
alter table public.workout_plans enable row level security;
alter table public.plan_phases enable row level security;
alter table public.progression_rules enable row level security;
alter table public.workout_templates enable row level security;
alter table public.exercise_entries enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.exercise_results enable row level security;

create policy "profiles are private to owner"
  on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "plans are private to owner"
  on public.workout_plans
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "phases follow plan ownership"
  on public.plan_phases
  for all
  using (
    exists (
      select 1
      from public.workout_plans plans
      where plans.id = plan_phases.plan_id
        and plans.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.workout_plans plans
      where plans.id = plan_phases.plan_id
        and plans.user_id = auth.uid()
    )
  );

create policy "progression rules follow phase ownership"
  on public.progression_rules
  for all
  using (
    exists (
      select 1
      from public.plan_phases phases
      join public.workout_plans plans on plans.id = phases.plan_id
      where phases.id = progression_rules.phase_id
        and plans.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.plan_phases phases
      join public.workout_plans plans on plans.id = phases.plan_id
      where phases.id = progression_rules.phase_id
        and plans.user_id = auth.uid()
    )
  );

create policy "templates follow phase ownership"
  on public.workout_templates
  for all
  using (
    exists (
      select 1
      from public.plan_phases phases
      join public.workout_plans plans on plans.id = phases.plan_id
      where phases.id = workout_templates.phase_id
        and plans.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.plan_phases phases
      join public.workout_plans plans on plans.id = phases.plan_id
      where phases.id = workout_templates.phase_id
        and plans.user_id = auth.uid()
    )
  );

create policy "exercises follow template ownership"
  on public.exercise_entries
  for all
  using (
    exists (
      select 1
      from public.workout_templates templates
      join public.plan_phases phases on phases.id = templates.phase_id
      join public.workout_plans plans on plans.id = phases.plan_id
      where templates.id = exercise_entries.workout_template_id
        and plans.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.workout_templates templates
      join public.plan_phases phases on phases.id = templates.phase_id
      join public.workout_plans plans on plans.id = phases.plan_id
      where templates.id = exercise_entries.workout_template_id
        and plans.user_id = auth.uid()
    )
  );

create policy "sessions are private to owner"
  on public.workout_sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "exercise results follow session ownership"
  on public.exercise_results
  for all
  using (
    exists (
      select 1
      from public.workout_sessions sessions
      where sessions.id = exercise_results.workout_session_id
        and sessions.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.workout_sessions sessions
      where sessions.id = exercise_results.workout_session_id
        and sessions.user_id = auth.uid()
    )
  );

