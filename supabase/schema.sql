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

alter table public.workout_plans
  add column if not exists schedule_summary text not null default '';

alter table public.workout_plans
  add column if not exists current_phase_id uuid;

alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz;

alter table public.profiles
  add column if not exists goal_notes text;

alter table public.profiles
  add column if not exists primary_goal_type text check (
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
  );

alter table public.profiles
  add column if not exists limitations_detail text;

alter table public.profiles
  add column if not exists age integer check (age is null or (age between 13 and 120));

alter table public.profiles
  add column if not exists weight numeric(6,2) check (weight is null or weight > 0);

alter table public.profiles
  add column if not exists training_experience text check (
    training_experience is null or
    training_experience in ('new', 'returning', 'intermediate', 'advanced')
  );

alter table public.profiles
  add column if not exists activity_level text check (
    activity_level is null or
    activity_level in ('mostly_sedentary', 'lightly_active', 'moderately_active', 'very_active')
  );

alter table public.profiles
  add column if not exists training_environment text check (
    training_environment is null or
    training_environment in ('home', 'gym', 'outdoors', 'mixed')
  );

alter table public.profiles
  add column if not exists exercise_preferences text[] not null default '{}';

alter table public.profiles
  add column if not exists exercise_dislikes text[] not null default '{}';

alter table public.profiles
  add column if not exists sports_interests text[] not null default '{}';

alter table public.workout_plans
  add column if not exists weekly_schedule text[] not null default '{}';

alter table public.workout_plans
  add column if not exists goal_type text check (
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
  );

alter table public.workout_plans
  add column if not exists progression_mode text check (
    progression_mode is null or
    progression_mode in ('symptom_based', 'adherence_based', 'performance_based', 'hybrid')
  );

alter table public.workout_plans
  add column if not exists creation_source text check (
    creation_source is null or
    creation_source in ('manual', 'guided_template', 'llm_draft', 'ai_import')
  );

alter table public.workout_plans
  add column if not exists setup_context jsonb;

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

alter table public.exercise_entries
  add column if not exists source_exercise_id text;

alter table public.workout_sessions
  add column if not exists phase_id_at_completion uuid references public.plan_phases(id) on delete set null;

alter table public.workout_sessions
  add column if not exists progression_decision text check (progression_decision in ('advance', 'repeat', 'review', 'deload'));

alter table public.workout_sessions
  add column if not exists progression_reason text;

update public.workout_sessions sessions
set phase_id_at_completion = templates.phase_id
from public.workout_templates templates
where sessions.workout_template_id = templates.id
  and sessions.phase_id_at_completion is null;

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

update public.profiles
set primary_goal_type = case
  when lower(goal) ~ '\m(rehab|prehab|recover|recovery|injury|pain)\M'
    then 'recovery'
  when lower(goal) ~ '\m(run|running|runner|5k|10k|marathon)\M'
    then 'running'
  when lower(goal) ~ '\m(hypertrophy|muscle|bodybuilding)\M'
    then 'hypertrophy'
  when lower(goal) ~ '\m(strength|strong|powerlifting)\M'
    then 'strength'
  when lower(goal) ~ '\m(sport|sports|athletic|athlete|performance)\M'
    then 'sport_performance'
  when lower(goal) ~ '\m(consistency|consistent)\M'
    then 'consistency'
  when lower(goal) like '%general fitness%' or lower(goal) ~ '\mfitness\M'
    then 'general_fitness'
  else primary_goal_type
end
where primary_goal_type is null
  and (
    lower(goal) ~ '\m(rehab|prehab|recover|recovery|injury|pain)\M' or
    lower(goal) ~ '\m(run|running|runner|5k|10k|marathon)\M' or
    lower(goal) ~ '\m(hypertrophy|muscle|bodybuilding)\M' or
    lower(goal) ~ '\m(strength|strong|powerlifting)\M' or
    lower(goal) ~ '\m(sport|sports|athletic|athlete|performance)\M' or
    lower(goal) ~ '\m(consistency|consistent)\M' or
    lower(goal) like '%general fitness%' or
    lower(goal) ~ '\mfitness\M'
  );

alter table public.workout_plans
  alter column schedule_summary set default '';

create index if not exists workout_sessions_user_completed_idx
  on public.workout_sessions (user_id, completed_on desc, created_at desc);

create index if not exists workout_sessions_template_completed_idx
  on public.workout_sessions (workout_template_id, completed_on desc, created_at desc);

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
-- Issue #10: reset disposable execution/history rows and install durable set-result schema.
-- Reset scope: deletes only exercise_set_results (if present), exercise_results, and workout_sessions.
-- Preserves auth.users, profiles, workout_plans, plan_phases, workout_templates, exercise_entries, and guidance fields.
-- The exercise_entries backfill below is a one-time reviewed snapshot of the static TypeScript exercise catalog metadata for existing rows.

create extension if not exists "pgcrypto";

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

delete from public.exercise_results;
delete from public.workout_sessions;

drop table if exists public.exercise_set_results;

alter table public.exercise_entries
  add column if not exists tracking_type text not null default 'completion',
  add column if not exists unilateral_mode text not null default 'bilateral',
  add column if not exists load_unit text,
  add column if not exists distance_unit text,
  add column if not exists primary_value_label text,
  add column if not exists secondary_value_label text;

alter table public.exercise_entries drop constraint if exists exercise_entries_tracking_type_check;
alter table public.exercise_entries add constraint exercise_entries_tracking_type_check
  check (tracking_type in ('weight_reps','reps_only','duration','distance','distance_duration','completion'));
alter table public.exercise_entries drop constraint if exists exercise_entries_unilateral_mode_check;
alter table public.exercise_entries add constraint exercise_entries_unilateral_mode_check
  check (unilateral_mode in ('bilateral','same_each_side','independent_sides'));
alter table public.exercise_entries drop constraint if exists exercise_entries_load_unit_check;
alter table public.exercise_entries add constraint exercise_entries_load_unit_check
  check (load_unit is null or load_unit in ('lb','kg'));
alter table public.exercise_entries drop constraint if exists exercise_entries_distance_unit_check;
alter table public.exercise_entries add constraint exercise_entries_distance_unit_check
  check (distance_unit is null or distance_unit in ('mi','km','m'));
alter table public.exercise_entries drop constraint if exists exercise_entries_tracking_units_check;
alter table public.exercise_entries add constraint exercise_entries_tracking_units_check check (
  (tracking_type = 'weight_reps' and load_unit is not null and distance_unit is null) or
  (tracking_type in ('distance','distance_duration') and distance_unit is not null and load_unit is null) or
  (tracking_type not in ('weight_reps','distance','distance_duration') and load_unit is null and distance_unit is null)
);

update public.exercise_entries set
  tracking_type = case
    when nullif(source_exercise_id,'') in ('goblet-squat','barbell-back-squat','romanian-deadlift','dumbbell-floor-press','dumbbell-shoulder-press','dumbbell-row','farmer-carry','dumbbell-lateral-raise','dumbbell-curl','lateral-lunge') then 'weight_reps'
    when nullif(source_exercise_id,'') in ('brisk-walk','easy-run') then 'distance_duration'
    when nullif(source_exercise_id,'') in ('low-impact-cardio-march','run-walk-intervals','stride-drills','side-plank','lateral-shuffle') then 'duration'
    when nullif(source_exercise_id,'') in ('bodyweight-squat','box-squat','hip-hinge-drill','glute-bridge','reverse-lunge','step-up','walking-lunge','incline-push-up','push-up','band-row','dead-bug','bird-dog','calf-raise','tibialis-raise','hip-flexor-rockback','thoracic-rotation','ankle-rock','skater-hop') then 'reps_only'
    else 'completion'
  end,
  unilateral_mode = case
    when nullif(source_exercise_id,'') in ('reverse-lunge','step-up','walking-lunge','dumbbell-row','dead-bug','side-plank','hip-flexor-rockback','thoracic-rotation','ankle-rock','lateral-lunge','skater-hop') then 'same_each_side'
    else 'bilateral'
  end,
  load_unit = case
    when nullif(source_exercise_id,'') in ('goblet-squat','barbell-back-squat','romanian-deadlift','dumbbell-floor-press','dumbbell-shoulder-press','dumbbell-row','farmer-carry','dumbbell-lateral-raise','dumbbell-curl','lateral-lunge') then 'lb'
    else null
  end,
  distance_unit = case when nullif(source_exercise_id,'') in ('brisk-walk','easy-run') then 'mi' else null end,
  primary_value_label = case
    when nullif(source_exercise_id,'') in ('goblet-squat','barbell-back-squat','romanian-deadlift','dumbbell-floor-press','dumbbell-shoulder-press','dumbbell-row','farmer-carry','dumbbell-lateral-raise','dumbbell-curl','lateral-lunge') then 'Load'
    when nullif(source_exercise_id,'') in ('brisk-walk','easy-run') then 'Distance'
    when nullif(source_exercise_id,'') in ('low-impact-cardio-march','run-walk-intervals','stride-drills','side-plank','lateral-shuffle') then 'Duration'
    when nullif(source_exercise_id,'') in ('bodyweight-squat','box-squat','hip-hinge-drill','glute-bridge','reverse-lunge','step-up','walking-lunge','incline-push-up','push-up','band-row','dead-bug','bird-dog','calf-raise','tibialis-raise','hip-flexor-rockback','thoracic-rotation','ankle-rock','skater-hop') then 'Reps'
    else 'Completion'
  end,
  secondary_value_label = case
    when nullif(source_exercise_id,'') in ('goblet-squat','barbell-back-squat','romanian-deadlift','dumbbell-floor-press','dumbbell-shoulder-press','dumbbell-row','farmer-carry','dumbbell-lateral-raise','dumbbell-curl','lateral-lunge') then 'Reps'
    when nullif(source_exercise_id,'') in ('brisk-walk','easy-run') then 'Duration'
    else null
  end;

alter table public.workout_sessions
  add column if not exists source_plan_id uuid references public.workout_plans(id) on delete set null,
  add column if not exists source_phase_id uuid references public.plan_phases(id) on delete set null,
  add column if not exists phase_name_snapshot text,
  add column if not exists started_at timestamptz not null default timezone('utc', now()),
  add column if not exists finished_at timestamptz not null default timezone('utc', now()),
  add column if not exists elapsed_seconds integer not null default 0,
  add column if not exists elapsed_source text not null default 'client_timer',
  add column if not exists updated_at timestamptz not null default timezone('utc', now());
alter table public.workout_sessions drop constraint if exists workout_sessions_elapsed_seconds_check;
alter table public.workout_sessions add constraint workout_sessions_elapsed_seconds_check check (elapsed_seconds >= 0);
alter table public.workout_sessions drop constraint if exists workout_sessions_finished_after_started_check;
alter table public.workout_sessions add constraint workout_sessions_finished_after_started_check check (finished_at >= started_at);
alter table public.workout_sessions drop constraint if exists workout_sessions_elapsed_source_check;
alter table public.workout_sessions add constraint workout_sessions_elapsed_source_check check (elapsed_source in ('client_timer','server_timestamp','manual_adjustment'));

alter table public.exercise_results
  drop column if exists actual_reps,
  drop column if exists actual_load,
  drop column if exists actual_duration,
  drop column if exists completed,
  drop column if exists pain_flag;
alter table public.exercise_results
  add column if not exists source_workout_template_id uuid references public.workout_templates(id) on delete set null,
  add column if not exists source_exercise_id text,
  add column if not exists exercise_order integer not null default 0,
  add column if not exists tracking_type text not null default 'completion',
  add column if not exists unilateral_mode text not null default 'bilateral',
  add column if not exists load_unit text,
  add column if not exists distance_unit text,
  add column if not exists primary_value_label text,
  add column if not exists secondary_value_label text,
  add column if not exists prescribed_target_text text,
  add column if not exists completion_status text not null default 'incomplete',
  add column if not exists notes text,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());
alter table public.exercise_results drop constraint if exists exercise_results_tracking_type_check;
alter table public.exercise_results add constraint exercise_results_tracking_type_check check (tracking_type in ('weight_reps','reps_only','duration','distance','distance_duration','completion'));
alter table public.exercise_results drop constraint if exists exercise_results_unilateral_mode_check;
alter table public.exercise_results add constraint exercise_results_unilateral_mode_check check (unilateral_mode in ('bilateral','same_each_side','independent_sides'));
alter table public.exercise_results drop constraint if exists exercise_results_units_check;
alter table public.exercise_results add constraint exercise_results_units_check check (((tracking_type='weight_reps')=(load_unit is not null)) and ((tracking_type in ('distance','distance_duration'))=(distance_unit is not null)) and (load_unit is null or load_unit in ('lb','kg')) and (distance_unit is null or distance_unit in ('mi','km','m')));
alter table public.exercise_results drop constraint if exists exercise_results_order_check;
alter table public.exercise_results add constraint exercise_results_order_check check (exercise_order >= 0);
alter table public.exercise_results drop constraint if exists exercise_results_completion_status_check;
alter table public.exercise_results add constraint exercise_results_completion_status_check check (completion_status in ('completed','partial','skipped','incomplete'));
alter table public.exercise_results drop constraint if exists exercise_results_session_order_key;
alter table public.exercise_results add constraint exercise_results_session_order_key unique (workout_session_id, exercise_order);

create table public.exercise_set_results (
  id uuid primary key default gen_random_uuid(),
  exercise_result_id uuid not null references public.exercise_results(id) on delete cascade,
  set_order integer not null check (set_order >= 0),
  prescribed_set_index integer check (prescribed_set_index is null or prescribed_set_index >= 0),
  set_kind text not null check (set_kind in ('prescribed','added')),
  status text not null check (status in ('completed','skipped','incomplete')),
  prescribed_load numeric(8,2) check (prescribed_load is null or prescribed_load >= 0),
  prescribed_reps integer check (prescribed_reps is null or prescribed_reps >= 0),
  prescribed_duration_seconds integer check (prescribed_duration_seconds is null or prescribed_duration_seconds >= 0),
  prescribed_distance numeric(10,3) check (prescribed_distance is null or prescribed_distance >= 0),
  actual_load numeric(8,2) check (actual_load is null or actual_load >= 0),
  actual_reps integer check (actual_reps is null or actual_reps >= 0),
  actual_duration_seconds integer check (actual_duration_seconds is null or actual_duration_seconds >= 0),
  actual_distance numeric(10,3) check (actual_distance is null or actual_distance >= 0),
  actual_left_load numeric(8,2) check (actual_left_load is null or actual_left_load >= 0),
  actual_left_reps integer check (actual_left_reps is null or actual_left_reps >= 0),
  actual_left_duration_seconds integer check (actual_left_duration_seconds is null or actual_left_duration_seconds >= 0),
  actual_left_distance numeric(10,3) check (actual_left_distance is null or actual_left_distance >= 0),
  actual_right_load numeric(8,2) check (actual_right_load is null or actual_right_load >= 0),
  actual_right_reps integer check (actual_right_reps is null or actual_right_reps >= 0),
  actual_right_duration_seconds integer check (actual_right_duration_seconds is null or actual_right_duration_seconds >= 0),
  actual_right_distance numeric(10,3) check (actual_right_distance is null or actual_right_distance >= 0),
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (exercise_result_id, set_order),
  check ((status = 'completed' and completed_at is not null) or (status in ('skipped','incomplete') and completed_at is null)),
  check (set_kind = 'added' or prescribed_set_index is not null)
);

create or replace function public.validate_exercise_set_result()
returns trigger
language plpgsql
as $$
declare parent_tracking text; parent_unilateral text;
begin
  select tracking_type, unilateral_mode into parent_tracking, parent_unilateral from public.exercise_results where id = new.exercise_result_id;
  if parent_tracking is null then raise exception 'parent exercise_result % not found', new.exercise_result_id; end if;
  if new.set_kind = 'prescribed' and new.prescribed_set_index is null then raise exception 'prescribed sets require prescribed_set_index'; end if;
  if new.set_kind = 'added' and new.prescribed_set_index is not null then raise exception 'added sets must not have prescribed_set_index'; end if;
  if new.status in ('skipped','incomplete') and new.completed_at is not null then raise exception 'skipped or incomplete sets must not retain completed_at'; end if;
  if parent_unilateral = 'same_each_side' and (new.actual_left_load is not null or new.actual_left_reps is not null or new.actual_left_duration_seconds is not null or new.actual_left_distance is not null or new.actual_right_load is not null or new.actual_right_reps is not null or new.actual_right_duration_seconds is not null or new.actual_right_distance is not null) then raise exception 'same_each_side stores scalar actual values only'; end if;
  if parent_unilateral = 'independent_sides' and (new.actual_load is not null or new.actual_reps is not null or new.actual_duration_seconds is not null or new.actual_distance is not null) then raise exception 'independent_sides requires side-specific actual values'; end if;
  if parent_tracking <> 'weight_reps' and (new.actual_load is not null or new.actual_left_load is not null or new.actual_right_load is not null) then raise exception 'load values are only valid for weight_reps'; end if;
  if parent_tracking not in ('weight_reps','reps_only') and (new.actual_reps is not null or new.actual_left_reps is not null or new.actual_right_reps is not null) then raise exception 'rep values are not valid for this tracking type'; end if;
  if parent_tracking not in ('duration','distance_duration') and (new.actual_duration_seconds is not null or new.actual_left_duration_seconds is not null or new.actual_right_duration_seconds is not null) then raise exception 'duration values are not valid for this tracking type'; end if;
  if parent_tracking not in ('distance','distance_duration') and (new.actual_distance is not null or new.actual_left_distance is not null or new.actual_right_distance is not null) then raise exception 'distance values are only valid for distance tracking'; end if;
  if parent_unilateral = 'independent_sides' then
    if (new.actual_left_load is null) <> (new.actual_right_load is null) then raise exception 'independent_sides requires both load sides when load is supplied'; end if;
    if (new.actual_left_reps is null) <> (new.actual_right_reps is null) then raise exception 'independent_sides requires both rep sides when reps are supplied'; end if;
    if (new.actual_left_duration_seconds is null) <> (new.actual_right_duration_seconds is null) then raise exception 'independent_sides requires both duration sides when duration is supplied'; end if;
    if (new.actual_left_distance is null) <> (new.actual_right_distance is null) then raise exception 'independent_sides requires both distance sides when distance is supplied'; end if;
  end if;
  return new;
end;
$$;

drop trigger if exists exercise_set_results_validate on public.exercise_set_results;
create trigger exercise_set_results_validate before insert or update on public.exercise_set_results for each row execute function public.validate_exercise_set_result();

drop trigger if exists workout_sessions_set_updated_at on public.workout_sessions;
create trigger workout_sessions_set_updated_at before update on public.workout_sessions for each row execute function public.handle_updated_at();
drop trigger if exists exercise_results_set_updated_at on public.exercise_results;
create trigger exercise_results_set_updated_at before update on public.exercise_results for each row execute function public.handle_updated_at();
drop trigger if exists exercise_set_results_set_updated_at on public.exercise_set_results;
create trigger exercise_set_results_set_updated_at before update on public.exercise_set_results for each row execute function public.handle_updated_at();

create index if not exists workout_sessions_user_finished_idx on public.workout_sessions (user_id, finished_at desc, created_at desc);
create index if not exists workout_sessions_template_finished_idx on public.workout_sessions (workout_template_id, finished_at desc, created_at desc);
create index if not exists exercise_results_session_order_idx on public.exercise_results (workout_session_id, exercise_order);
create index if not exists exercise_results_entry_history_idx on public.exercise_results (exercise_entry_id, source_workout_template_id, created_at desc);
create index if not exists exercise_results_source_history_idx on public.exercise_results (source_exercise_id, created_at desc) where source_exercise_id is not null;
create index if not exists exercise_set_results_parent_order_idx on public.exercise_set_results (exercise_result_id, set_order);

alter table public.exercise_set_results enable row level security;
drop policy if exists "set results follow session ownership" on public.exercise_set_results;
create policy "set results follow session ownership" on public.exercise_set_results for all using (
  exists (select 1 from public.exercise_results er join public.workout_sessions ws on ws.id = er.workout_session_id where er.id = exercise_set_results.exercise_result_id and ws.user_id = auth.uid())
) with check (
  exists (select 1 from public.exercise_results er join public.workout_sessions ws on ws.id = er.workout_session_id where er.id = exercise_set_results.exercise_result_id and ws.user_id = auth.uid())
);


create or replace function public.finalize_workout_session(p_session jsonb, p_exercise_results jsonb, p_set_results jsonb default '[]'::jsonb)
returns public.workout_sessions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  saved public.workout_sessions;
  actor uuid := auth.uid();
  selected_workout_template_id uuid := (p_session->>'workout_template_id')::uuid;
  authoritative_workout record;
begin
  -- SECURITY DEFINER is required so the session header, exercise rows, and set rows share one transaction.
  -- Because it bypasses table RLS, this function compensates with explicit auth.uid() ownership checks and
  -- rejects caller-supplied child IDs unless they belong to the selected workout and the newly saved session.
  -- Snapshot metadata is derived from workout_templates, plan_phases, workout_plans, and exercise_entries;
  -- caller JSON supplies only new child IDs, exercise_entry_id, completion status, and set status rows.
  if actor is null then raise exception 'authenticated user required'; end if;
  if selected_workout_template_id is null then raise exception 'workout_template_id is required'; end if;
  if jsonb_typeof(p_exercise_results) <> 'array' then raise exception 'exercise results payload must be an array'; end if;
  if jsonb_typeof(p_set_results) <> 'array' then raise exception 'set results payload must be an array'; end if;

  select wt.id as workout_template_id, wt.name as workout_name, wt.phase_id, pp.plan_id, pp.phase_number, pp.goal
  into authoritative_workout
  from public.workout_templates wt
  join public.plan_phases pp on pp.id = wt.phase_id
  join public.workout_plans wp on wp.id = pp.plan_id
  where wt.id = selected_workout_template_id and wp.user_id = actor and wp.archived_at is null;

  if authoritative_workout.workout_template_id is null then raise exception 'workout is not owned by authenticated user'; end if;

  if exists (select 1 from jsonb_array_elements(p_exercise_results) as r(value) where nullif(value->>'id','') is null) then
    raise exception 'exercise result id is required';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_exercise_results) as r(value) group by value->>'id' having count(*) > 1
  ) then raise exception 'duplicate exercise result ids are not allowed'; end if;
  if exists (
    select 1 from public.exercise_results er join jsonb_array_elements(p_exercise_results) as r(value) on er.id = (value->>'id')::uuid
  ) then raise exception 'exercise result ids must be new'; end if;
  if exists (select 1 from jsonb_array_elements(p_exercise_results) as r(value) where nullif(value->>'exercise_entry_id','') is null) then
    raise exception 'exercise_entry_id is required';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_exercise_results) as r(value) group by value->>'exercise_entry_id' having count(*) > 1
  ) then raise exception 'duplicate exercise_entry_id values are not allowed'; end if;
  if exists (
    select 1 from jsonb_array_elements(p_exercise_results) as r(value)
    where nullif(value->>'source_workout_template_id','') is not null and (value->>'source_workout_template_id')::uuid <> selected_workout_template_id
  ) then raise exception 'source_workout_template_id must match selected workout'; end if;
  if exists (
    select 1
    from jsonb_array_elements(p_exercise_results) as r(value)
    left join public.exercise_entries ee on ee.id = (value->>'exercise_entry_id')::uuid and ee.workout_template_id = selected_workout_template_id
    where ee.id is null
  ) then raise exception 'exercise_entry_id must belong to selected workout'; end if;
  if exists (
    select 1 from jsonb_array_elements(p_exercise_results) as r(value)
    where coalesce(value->>'completion_status','incomplete') not in ('completed','partial','skipped','incomplete')
  ) then raise exception 'invalid exercise completion_status'; end if;

  if exists (select 1 from jsonb_array_elements(p_set_results) as r(value) where nullif(value->>'exercise_result_id','') is null) then
    raise exception 'set exercise_result_id is required';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_set_results) as sr(value)
    left join jsonb_array_elements(p_exercise_results) as er(value) on (er.value->>'id') = (sr.value->>'exercise_result_id')
    where er.value is null
  ) then raise exception 'set rows must reference exercise results created by this finalize call'; end if;
  if exists (select 1 from jsonb_array_elements(p_set_results) as r(value) where (value->>'set_kind') = 'prescribed' and nullif(value->>'prescribed_set_index','') is null) then raise exception 'prescribed rows require prescribed_set_index'; end if;
  if exists (select 1 from jsonb_array_elements(p_set_results) as r(value) where (value->>'set_kind') = 'added' and nullif(value->>'prescribed_set_index','') is not null) then raise exception 'added rows must not include prescribed_set_index'; end if;
  if exists (select 1 from jsonb_array_elements(p_set_results) as r(value) where (value->>'status') = 'completed' and nullif(value->>'completed_at','') is null) then raise exception 'completed set rows require completed_at'; end if;
  if exists (select 1 from jsonb_array_elements(p_set_results) as r(value) where (value->>'status') <> 'completed' and nullif(value->>'completed_at','') is not null) then raise exception 'incomplete set rows must not include completed_at'; end if;
  if exists (select 1 from jsonb_array_elements(p_set_results) as r(value) group by value->>'exercise_result_id', value->>'set_order' having count(*) > 1) then raise exception 'duplicate set_order values are not allowed'; end if;
  if exists (select 1 from jsonb_array_elements(p_set_results) as r(value) where (value->>'set_kind') = 'prescribed' group by value->>'exercise_result_id', value->>'prescribed_set_index' having count(*) > 1) then raise exception 'duplicate prescribed_set_index values are not allowed'; end if;
  if exists (
    select 1
    from jsonb_array_elements(p_set_results) as sr(value)
    join jsonb_array_elements(p_exercise_results) as erj(value) on erj.value->>'id' = sr.value->>'exercise_result_id'
    join public.exercise_entries ee on ee.id = (erj.value->>'exercise_entry_id')::uuid
    where (ee.tracking_type = 'reps_only' and nullif(sr.value->>'actual_load','') is not null)
       or (ee.tracking_type <> 'weight_reps' and nullif(sr.value->>'actual_load','') is not null)
       or (ee.tracking_type not in ('weight_reps','reps_only') and nullif(sr.value->>'actual_reps','') is not null)
  ) then raise exception 'set metrics are invalid for exercise tracking type'; end if;

  insert into public.workout_sessions (id, user_id, workout_template_id, source_plan_id, source_phase_id, completed_on, completed, pain_occurred, perceived_difficulty, notes, recommendation, phase_id_at_completion, phase_name_snapshot, workout_name_snapshot, started_at, finished_at, elapsed_seconds, elapsed_source)
  values ((p_session->>'id')::uuid, actor, selected_workout_template_id, authoritative_workout.plan_id, authoritative_workout.phase_id, (p_session->>'completed_on')::date, (p_session->>'completed')::boolean, (p_session->>'pain_occurred')::boolean, p_session->>'perceived_difficulty', coalesce(p_session->>'notes',''), p_session->>'recommendation', authoritative_workout.phase_id, coalesce('Phase ' || authoritative_workout.phase_number::text || ': ' || authoritative_workout.goal, authoritative_workout.goal), authoritative_workout.workout_name, (p_session->>'started_at')::timestamptz, (p_session->>'finished_at')::timestamptz, coalesce((p_session->>'elapsed_seconds')::integer,0), coalesce(p_session->>'elapsed_source','server_timestamp'))
  returning * into saved;

  insert into public.exercise_results (id, workout_session_id, source_workout_template_id, exercise_entry_id, source_exercise_id, exercise_name_snapshot, exercise_order, tracking_type, unilateral_mode, load_unit, distance_unit, primary_value_label, secondary_value_label, prescribed_target_text, completion_status)
  select (r.value->>'id')::uuid, saved.id, selected_workout_template_id, ee.id, ee.source_exercise_id, ee.name, ee.sort_order, ee.tracking_type, ee.unilateral_mode, ee.load_unit, ee.distance_unit, ee.primary_value_label, ee.secondary_value_label, (ee.sets::text || ' sets × ' || ee.reps), coalesce(r.value->>'completion_status','incomplete')
  from jsonb_array_elements(p_exercise_results) as r(value)
  join public.exercise_entries ee on ee.id = (r.value->>'exercise_entry_id')::uuid and ee.workout_template_id = selected_workout_template_id;

  insert into public.exercise_set_results (exercise_result_id, set_order, prescribed_set_index, set_kind, status, prescribed_load, prescribed_reps, prescribed_duration_seconds, prescribed_distance, actual_load, actual_reps, actual_duration_seconds, actual_distance, actual_left_load, actual_left_reps, actual_left_duration_seconds, actual_left_distance, actual_right_load, actual_right_reps, actual_right_duration_seconds, actual_right_distance, completed_at)
  select (value->>'exercise_result_id')::uuid, (value->>'set_order')::integer, nullif(value->>'prescribed_set_index','')::integer, value->>'set_kind', value->>'status', nullif(value->>'prescribed_load','')::numeric, nullif(value->>'prescribed_reps','')::integer, nullif(value->>'prescribed_duration_seconds','')::integer, nullif(value->>'prescribed_distance','')::numeric, nullif(value->>'actual_load','')::numeric, nullif(value->>'actual_reps','')::integer, nullif(value->>'actual_duration_seconds','')::integer, nullif(value->>'actual_distance','')::numeric, nullif(value->>'actual_left_load','')::numeric, nullif(value->>'actual_left_reps','')::integer, nullif(value->>'actual_left_duration_seconds','')::integer, nullif(value->>'actual_left_distance','')::numeric, nullif(value->>'actual_right_load','')::numeric, nullif(value->>'actual_right_reps','')::integer, nullif(value->>'actual_right_duration_seconds','')::integer, nullif(value->>'actual_right_distance','')::numeric, nullif(value->>'completed_at','')::timestamptz
  from jsonb_array_elements(p_set_results) as r(value);

  return saved;
end;
$$;

revoke all on function public.finalize_workout_session(jsonb,jsonb,jsonb) from public;
grant execute on function public.finalize_workout_session(jsonb,jsonb,jsonb) to authenticated;
