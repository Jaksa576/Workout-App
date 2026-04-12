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
  schedule_summary text not null default '',
  is_active boolean not null default false,
  current_phase_id uuid,
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

alter table public.workout_plans
  add column if not exists schedule_summary text not null default '';

alter table public.workout_plans
  add column if not exists current_phase_id uuid;

alter table public.workout_plans
  alter column schedule_summary set default '';

alter table public.workout_plans
  drop constraint if exists workout_plans_current_phase_id_fkey;

alter table public.workout_plans
  add constraint workout_plans_current_phase_id_fkey
  foreign key (current_phase_id)
  references public.plan_phases(id)
  on delete set null;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, goal, injuries, equipment, days_per_week, session_minutes)
  values (
    new.id,
    'Build a sustainable routine.',
    '{}',
    '{}',
    3,
    45
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.handle_updated_at();

drop trigger if exists workout_plans_set_updated_at on public.workout_plans;
create trigger workout_plans_set_updated_at
before update on public.workout_plans
for each row
execute function public.handle_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.workout_plans enable row level security;
alter table public.plan_phases enable row level security;
alter table public.progression_rules enable row level security;
alter table public.workout_templates enable row level security;
alter table public.exercise_entries enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.exercise_results enable row level security;

drop policy if exists "profiles are private to owner" on public.profiles;
create policy "profiles are private to owner"
  on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "plans are private to owner" on public.workout_plans;
create policy "plans are private to owner"
  on public.workout_plans
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "phases follow plan ownership" on public.plan_phases;
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

drop policy if exists "progression rules follow phase ownership" on public.progression_rules;
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

drop policy if exists "templates follow phase ownership" on public.workout_templates;
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

drop policy if exists "exercises follow template ownership" on public.exercise_entries;
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

drop policy if exists "sessions are private to owner" on public.workout_sessions;
create policy "sessions are private to owner"
  on public.workout_sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "exercise results follow session ownership" on public.exercise_results;
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
