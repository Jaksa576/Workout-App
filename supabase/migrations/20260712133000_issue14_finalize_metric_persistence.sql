-- Issue #14: persist duration, distance, and approved left/right metric fields through finalize_workout_session.
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
  if parent_tracking <> 'distance_duration' and (new.actual_distance is not null or new.actual_left_distance is not null or new.actual_right_distance is not null) then raise exception 'distance values are only valid for distance_duration'; end if;
  if new.status = 'completed' then
    if parent_unilateral = 'independent_sides' then
      if parent_tracking = 'weight_reps' and (new.actual_left_load is null or new.actual_left_reps is null or new.actual_right_load is null or new.actual_right_reps is null) then raise exception 'completed independent weight_reps requires left/right load and reps'; end if;
      if parent_tracking = 'reps_only' and (new.actual_left_reps is null or new.actual_right_reps is null) then raise exception 'completed independent reps_only requires left/right reps'; end if;
      if parent_tracking = 'duration' and (new.actual_left_duration_seconds is null or new.actual_right_duration_seconds is null) then raise exception 'completed independent duration requires left/right duration'; end if;
      if parent_tracking = 'distance_duration' and (new.actual_left_distance is null or new.actual_left_duration_seconds is null or new.actual_right_distance is null or new.actual_right_duration_seconds is null) then raise exception 'completed independent distance_duration requires left/right distance and duration'; end if;
    else
      if parent_tracking = 'duration' and new.actual_duration_seconds is null then raise exception 'completed duration requires duration'; end if;
      if parent_tracking = 'distance_duration' and (new.actual_distance is null or new.actual_duration_seconds is null) then raise exception 'completed distance_duration requires distance and duration'; end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists exercise_set_results_validate on public.exercise_set_results;

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
