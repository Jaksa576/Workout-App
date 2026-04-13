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
