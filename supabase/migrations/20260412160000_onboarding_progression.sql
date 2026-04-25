create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  goal text not null,
  goal_notes text,
  primary_goal_type text check (
    primary_goal_type is null or
    primary_goal_type in (
      'recovery',
      'general_fitness',
      'strength',
      'hypertrophy',
      'running',
      'sport_performance',
      'consistency'
    )
  ),
  injuries text[] not null default '{}',
  limitations_detail text,
  equipment text[] not null default '{}',
  age integer check (age is null or (age between 13 and 120)),
  weight numeric(6,2) check (weight is null or weight > 0),
  training_experience text check (
    training_experience is null or
    training_experience in ('new', 'returning', 'intermediate', 'advanced')
  ),
  activity_level text check (
    activity_level is null or
    activity_level in ('mostly_sedentary', 'lightly_active', 'moderately_active', 'very_active')
  ),
  training_environment text check (
    training_environment is null or
    training_environment in ('home', 'gym', 'outdoors', 'mixed')
  ),
  exercise_preferences text[] not null default '{}',
  exercise_dislikes text[] not null default '{}',
  sports_interests text[] not null default '{}',
  days_per_week integer not null check (days_per_week between 1 and 7),
  session_minutes integer not null check (session_minutes between 10 and 180),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  goal_type text check (
    goal_type is null or
    goal_type in (
      'recovery',
      'general_fitness',
      'strength',
      'hypertrophy',
      'running',
      'sport_performance',
      'consistency'
    )
  ),
  progression_mode text check (
    progression_mode is null or
    progression_mode in ('symptom_based', 'adherence_based', 'performance_based', 'hybrid')
  ),
  creation_source text check (
    creation_source is null or
    creation_source in ('manual', 'guided_template', 'llm_draft', 'ai_import')
  ),
  setup_context jsonb,
  schedule_summary text not null default '',
  weekly_schedule text[] not null default '{}',
  is_active boolean not null default false,
  current_phase_id uuid,
  completed_at timestamptz,
  archived_at timestamptz,
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
  advancement_preset text not null default 'clean_sessions_in_window',
  advancement_settings jsonb not null default '{"sessions":4,"weeks":2}',
  deload_preset text not null default 'pain_flags_in_window',
  deload_settings jsonb not null default '{"painFlags":2,"days":7}',
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
  day_order integer not null default 1,
  scheduled_days text[] not null default '{}'
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
  source_exercise_id text,
  sort_order integer not null default 1
);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_template_id uuid references public.workout_templates(id) on delete set null,
  workout_name_snapshot text not null default '',
  completed_on date not null default current_date,
  completed boolean not null default false,
  pain_occurred boolean not null default false,
  perceived_difficulty text not null check (perceived_difficulty in ('too_easy', 'appropriate', 'too_hard')),
  notes text not null default '',
  recommendation text not null default '',
  phase_id_at_completion uuid references public.plan_phases(id) on delete set null,
  progression_decision text check (progression_decision in ('advance', 'repeat', 'review', 'deload')),
  progression_reason text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.exercise_results (
  id uuid primary key default gen_random_uuid(),
  workout_session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_entry_id uuid references public.exercise_entries(id) on delete set null,
  exercise_name_snapshot text not null default '',
  completed boolean not null default false,
  actual_reps text,
  actual_load text,
  actual_duration text,
  pain_flag boolean not null default false
);

alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz;

alter table public.workout_plans
  add column if not exists weekly_schedule text[] not null default '{}';

alter table public.workout_plans
  add column if not exists completed_at timestamptz;

alter table public.workout_plans
  add column if not exists archived_at timestamptz;

alter table public.workout_sessions
  add column if not exists workout_name_snapshot text not null default '';

alter table public.exercise_results
  add column if not exists exercise_name_snapshot text not null default '';

alter table public.plan_phases
  add column if not exists advancement_preset text not null default 'clean_sessions_in_window';

alter table public.plan_phases
  add column if not exists advancement_settings jsonb not null default '{"sessions":4,"weeks":2}';

alter table public.plan_phases
  add column if not exists deload_preset text not null default 'pain_flags_in_window';

alter table public.plan_phases
  add column if not exists deload_settings jsonb not null default '{"painFlags":2,"days":7}';

alter table public.workout_templates
  add column if not exists scheduled_days text[] not null default '{}';

alter table public.workout_sessions
  add column if not exists phase_id_at_completion uuid references public.plan_phases(id) on delete set null;

alter table public.workout_sessions
  add column if not exists progression_decision text check (progression_decision in ('advance', 'repeat', 'review', 'deload'));

alter table public.workout_sessions
  add column if not exists progression_reason text;

update public.workout_sessions sessions
set workout_name_snapshot = templates.name
from public.workout_templates templates
where sessions.workout_template_id = templates.id
  and sessions.workout_name_snapshot = '';

update public.exercise_results results
set exercise_name_snapshot = exercises.name
from public.exercise_entries exercises
where results.exercise_entry_id = exercises.id
  and results.exercise_name_snapshot = '';

alter table public.workout_sessions
  alter column workout_template_id drop not null;

alter table public.exercise_results
  alter column exercise_entry_id drop not null;

alter table public.workout_sessions
  drop constraint if exists workout_sessions_workout_template_id_fkey;

alter table public.workout_sessions
  add constraint workout_sessions_workout_template_id_fkey
  foreign key (workout_template_id)
  references public.workout_templates(id)
  on delete set null;

alter table public.exercise_results
  drop constraint if exists exercise_results_exercise_entry_id_fkey;

alter table public.exercise_results
  add constraint exercise_results_exercise_entry_id_fkey
  foreign key (exercise_entry_id)
  references public.exercise_entries(id)
  on delete set null;

update public.profiles profiles
set onboarding_completed_at = timezone('utc', now())
where onboarding_completed_at is null
  and exists (
    select 1
    from public.workout_plans plans
    where plans.user_id = profiles.id
      and plans.is_active = true
  );

create index if not exists workout_sessions_user_completed_idx
  on public.workout_sessions (user_id, completed_on desc, created_at desc);

create index if not exists workout_sessions_template_completed_idx
  on public.workout_sessions (workout_template_id, completed_on desc, created_at desc);
