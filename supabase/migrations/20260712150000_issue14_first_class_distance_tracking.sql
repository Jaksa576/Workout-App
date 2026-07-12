-- Issue #14: add first-class distance tracking without requiring duration.

alter table public.exercise_entries drop constraint if exists exercise_entries_tracking_type_check;
alter table public.exercise_entries add constraint exercise_entries_tracking_type_check
  check (tracking_type in ('weight_reps','reps_only','duration','distance','distance_duration','completion'));

alter table public.exercise_entries drop constraint if exists exercise_entries_tracking_units_check;
alter table public.exercise_entries add constraint exercise_entries_tracking_units_check check (
  (tracking_type = 'weight_reps' and load_unit is not null and distance_unit is null) or
  (tracking_type in ('distance','distance_duration') and distance_unit is not null and load_unit is null) or
  (tracking_type not in ('weight_reps','distance','distance_duration') and load_unit is null and distance_unit is null)
);

alter table public.exercise_results drop constraint if exists exercise_results_tracking_type_check;
alter table public.exercise_results add constraint exercise_results_tracking_type_check
  check (tracking_type in ('weight_reps','reps_only','duration','distance','distance_duration','completion'));

alter table public.exercise_results drop constraint if exists exercise_results_units_check;
alter table public.exercise_results add constraint exercise_results_units_check check (
  ((tracking_type='weight_reps')=(load_unit is not null))
  and ((tracking_type in ('distance','distance_duration'))=(distance_unit is not null))
  and (load_unit is null or load_unit in ('lb','kg'))
  and (distance_unit is null or distance_unit in ('mi','km','m'))
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

