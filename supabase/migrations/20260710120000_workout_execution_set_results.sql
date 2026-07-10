-- Issue #10: reset disposable execution/history rows and install durable set-result schema.
-- Reset scope: deletes only exercise_set_results (if present), exercise_results, and workout_sessions.
-- Preserves auth.users, profiles, workout_plans, plan_phases, workout_templates, exercise_entries, and guidance fields.

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
  check (tracking_type in ('weight_reps','reps_only','duration','distance_duration','completion'));
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
  (tracking_type = 'distance_duration' and distance_unit is not null and load_unit is null) or
  (tracking_type not in ('weight_reps','distance_duration') and load_unit is null and distance_unit is null)
);

update public.exercise_entries set
  tracking_type = case
    when source_exercise_id in ('goblet-squat','barbell-back-squat','romanian-deadlift','dumbbell-floor-press','dumbbell-shoulder-press','dumbbell-row','farmer-carry','dumbbell-lateral-raise','dumbbell-curl','lateral-lunge') then 'weight_reps'
    when source_exercise_id in ('brisk-walk','easy-run') then 'distance_duration'
    when source_exercise_id in ('low-impact-cardio-march','run-walk-intervals','stride-drills','side-plank','farmer-carry','lateral-shuffle') then 'duration'
    when source_exercise_id is not null then 'reps_only'
    else 'completion'
  end,
  unilateral_mode = case
    when source_exercise_id in ('reverse-lunge','step-up','walking-lunge','dumbbell-row','dead-bug','side-plank','hip-flexor-rockback','thoracic-rotation','ankle-rock','lateral-lunge','skater-hop') then 'same_each_side'
    else 'bilateral'
  end,
  load_unit = case
    when source_exercise_id in ('goblet-squat','barbell-back-squat','romanian-deadlift','dumbbell-floor-press','dumbbell-shoulder-press','dumbbell-row','farmer-carry','dumbbell-lateral-raise','dumbbell-curl','lateral-lunge') then 'lb'
    else null
  end,
  distance_unit = case when source_exercise_id in ('brisk-walk','easy-run') then 'mi' else null end,
  primary_value_label = case
    when source_exercise_id in ('goblet-squat','barbell-back-squat','romanian-deadlift','dumbbell-floor-press','dumbbell-shoulder-press','dumbbell-row','farmer-carry','dumbbell-lateral-raise','dumbbell-curl','lateral-lunge') then 'Load'
    when source_exercise_id in ('brisk-walk','easy-run') then 'Distance'
    when source_exercise_id in ('low-impact-cardio-march','run-walk-intervals','stride-drills','side-plank','lateral-shuffle') then 'Duration'
    when source_exercise_id is not null then 'Reps'
    else 'Completion'
  end,
  secondary_value_label = case
    when source_exercise_id in ('goblet-squat','barbell-back-squat','romanian-deadlift','dumbbell-floor-press','dumbbell-shoulder-press','dumbbell-row','farmer-carry','dumbbell-lateral-raise','dumbbell-curl','lateral-lunge') then 'Reps'
    when source_exercise_id in ('brisk-walk','easy-run') then 'Duration'
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
alter table public.exercise_results add constraint exercise_results_tracking_type_check check (tracking_type in ('weight_reps','reps_only','duration','distance_duration','completion'));
alter table public.exercise_results drop constraint if exists exercise_results_unilateral_mode_check;
alter table public.exercise_results add constraint exercise_results_unilateral_mode_check check (unilateral_mode in ('bilateral','same_each_side','independent_sides'));
alter table public.exercise_results drop constraint if exists exercise_results_units_check;
alter table public.exercise_results add constraint exercise_results_units_check check (((tracking_type='weight_reps')=(load_unit is not null)) and ((tracking_type='distance_duration')=(distance_unit is not null)) and (load_unit is null or load_unit in ('lb','kg')) and (distance_unit is null or distance_unit in ('mi','km','m')));
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
  if parent_unilateral = 'same_each_side' and (new.actual_left_load is not null or new.actual_left_reps is not null or new.actual_left_duration_seconds is not null or new.actual_left_distance is not null or new.actual_right_load is not null or new.actual_right_reps is not null or new.actual_right_duration_seconds is not null or new.actual_right_distance is not null) then raise exception 'same_each_side stores scalar actual values only'; end if;
  if new.status = 'completed' then
    if parent_unilateral = 'independent_sides' then
      if parent_tracking = 'weight_reps' and (new.actual_left_load is null or new.actual_left_reps is null or new.actual_right_load is null or new.actual_right_reps is null) then raise exception 'completed independent weight_reps requires left/right load and reps'; end if;
      if parent_tracking = 'reps_only' and (new.actual_left_reps is null or new.actual_right_reps is null) then raise exception 'completed independent reps_only requires left/right reps'; end if;
      if parent_tracking = 'duration' and (new.actual_left_duration_seconds is null or new.actual_right_duration_seconds is null) then raise exception 'completed independent duration requires left/right duration'; end if;
      if parent_tracking = 'distance_duration' and (new.actual_left_distance is null or new.actual_left_duration_seconds is null or new.actual_right_distance is null or new.actual_right_duration_seconds is null) then raise exception 'completed independent distance_duration requires left/right distance and duration'; end if;
    else
      if parent_tracking = 'weight_reps' and (new.actual_load is null or new.actual_reps is null) then raise exception 'completed weight_reps requires load and reps'; end if;
      if parent_tracking = 'reps_only' and new.actual_reps is null then raise exception 'completed reps_only requires reps'; end if;
      if parent_tracking = 'duration' and new.actual_duration_seconds is null then raise exception 'completed duration requires duration'; end if;
      if parent_tracking = 'distance_duration' and (new.actual_distance is null or new.actual_duration_seconds is null) then raise exception 'completed distance_duration requires distance and duration'; end if;
    end if;
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
