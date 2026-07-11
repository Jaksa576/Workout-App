-- Issue #10 transactional QA for finalize_workout_session.
-- Run only in a safe test database/context. The script writes deterministic test rows and rolls back at the end.
-- Supabase SQL editor users may replace the UUID constants below if they collide with local test data.
-- The script simulates authenticated callers by setting request.jwt.claim.sub, which is what auth.uid() reads.

begin;

-- Required test identities and deterministic row ids.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000101', true);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-4000-8000-000000000101', 'authenticated', 'authenticated', 'issue10-owner@example.test', '', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000202', 'authenticated', 'authenticated', 'issue10-foreign@example.test', '', now(), now(), now())
on conflict (id) do nothing;

insert into public.workout_plans (id, user_id, name, description, schedule_summary)
values
  ('00000000-0000-4000-8000-000000001001', '00000000-0000-4000-8000-000000000101', 'Issue 10 owner plan', '', ''),
  ('00000000-0000-4000-8000-000000002001', '00000000-0000-4000-8000-000000000202', 'Issue 10 foreign plan', '', '')
on conflict (id) do nothing;

insert into public.plan_phases (id, plan_id, phase_number, goal, advance_criteria, deload_criteria)
values
  ('00000000-0000-4000-8000-000000001002', '00000000-0000-4000-8000-000000001001', 1, 'QA', 'QA', 'QA'),
  ('00000000-0000-4000-8000-000000002002', '00000000-0000-4000-8000-000000002001', 1, 'QA', 'QA', 'QA')
on conflict (id) do nothing;

insert into public.workout_templates (id, phase_id, name, focus, summary, day_order)
values
  ('00000000-0000-4000-8000-000000001003', '00000000-0000-4000-8000-000000001002', 'Issue 10 owner workout', 'QA', '', 1),
  ('00000000-0000-4000-8000-000000002003', '00000000-0000-4000-8000-000000002002', 'Issue 10 foreign workout', 'QA', '', 1)
on conflict (id) do nothing;

insert into public.exercise_entries (id, workout_template_id, name, sets, reps, rest, coaching_note, source_exercise_id, sort_order, tracking_type, unilateral_mode, load_unit, distance_unit, primary_value_label, secondary_value_label)
values
  ('00000000-0000-4000-8000-000000001004', '00000000-0000-4000-8000-000000001003', 'Owner completion drill', 1, 'Done', '0 sec', '', null, 1, 'completion', 'bilateral', null, null, 'Completion', null),
  ('00000000-0000-4000-8000-000000001005', '00000000-0000-4000-8000-000000001003', 'Owner squat', 1, '5', '60 sec', '', 'goblet-squat', 2, 'weight_reps', 'bilateral', 'lb', null, 'Load', 'Reps'),
  ('00000000-0000-4000-8000-000000002004', '00000000-0000-4000-8000-000000002003', 'Foreign completion drill', 1, 'Done', '0 sec', '', null, 1, 'completion', 'bilateral', null, null, 'Completion', null)
on conflict (id) do nothing;

-- Pre-existing/foreign exercise_result that must never be accepted as a set parent by the RPC.
insert into public.workout_sessions (id, user_id, workout_template_id, workout_name_snapshot, completed_on, completed, pain_occurred, perceived_difficulty, notes, recommendation, phase_id_at_completion)
values ('00000000-0000-4000-8000-000000002010', '00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000002003', 'Foreign previous workout', current_date, true, false, 'appropriate', '', 'QA', '00000000-0000-4000-8000-000000002002')
on conflict (id) do nothing;
insert into public.exercise_results (id, workout_session_id, source_workout_template_id, exercise_entry_id, exercise_name_snapshot, exercise_order, tracking_type, unilateral_mode, primary_value_label, completion_status)
values ('00000000-0000-4000-8000-000000002011', '00000000-0000-4000-8000-000000002010', '00000000-0000-4000-8000-000000002003', '00000000-0000-4000-8000-000000002004', 'Foreign result', 1, 'completion', 'bilateral', 'Completion', 'completed')
on conflict (id) do nothing;

-- Valid owned finalize succeeds and creates exactly one session, result, and set.
select public.finalize_workout_session(
  '{"id":"00000000-0000-4000-8000-000000001100","workout_template_id":"00000000-0000-4000-8000-000000001003","completed_on":"2026-07-10","completed":true,"pain_occurred":false,"perceived_difficulty":"appropriate","notes":"","recommendation":"QA","phase_id_at_completion":"00000000-0000-4000-8000-000000001002","workout_name_snapshot":"Issue 10 owner workout","started_at":"2026-07-10T00:00:00Z","finished_at":"2026-07-10T00:05:00Z","elapsed_seconds":300,"elapsed_source":"server_timestamp"}'::jsonb,
  '[{"id":"00000000-0000-4000-8000-000000001101","source_workout_template_id":"00000000-0000-4000-8000-000000001003","exercise_entry_id":"00000000-0000-4000-8000-000000001004","source_exercise_id":null,"exercise_name_snapshot":"Owner completion drill","exercise_order":1,"tracking_type":"completion","unilateral_mode":"bilateral","load_unit":null,"distance_unit":null,"primary_value_label":"Completion","secondary_value_label":null,"prescribed_target_text":"1 sets × Done","completion_status":"completed"}]'::jsonb,
  '[{"exercise_result_id":"00000000-0000-4000-8000-000000001101","set_order":1,"prescribed_set_index":1,"set_kind":"prescribed","status":"completed","completed_at":"2026-07-10T00:05:00Z"}]'::jsonb
);
do $$ begin if (select count(*) from public.workout_sessions where id='00000000-0000-4000-8000-000000001100') <> 1 then raise exception 'valid finalize did not create expected session'; end if; end $$;
do $$ begin if (select count(*) from public.exercise_results where workout_session_id='00000000-0000-4000-8000-000000001100') <> 1 then raise exception 'valid finalize did not create expected exercise result'; end if; end $$;
do $$ begin if (select count(*) from public.exercise_set_results where exercise_result_id='00000000-0000-4000-8000-000000001101') <> 1 then raise exception 'valid finalize did not create expected set result'; end if; end $$;

-- Invalid late child failure rolls back the newly inserted session and exercise rows.
do $$
begin
  perform public.finalize_workout_session(
    '{"id":"00000000-0000-4000-8000-000000001200","workout_template_id":"00000000-0000-4000-8000-000000001003","completed_on":"2026-07-10","completed":true,"pain_occurred":false,"perceived_difficulty":"appropriate","notes":"","recommendation":"QA","phase_id_at_completion":"00000000-0000-4000-8000-000000001002","workout_name_snapshot":"Issue 10 owner workout","started_at":"2026-07-10T00:00:00Z","finished_at":"2026-07-10T00:05:00Z","elapsed_seconds":300,"elapsed_source":"server_timestamp"}'::jsonb,
    '[{"id":"00000000-0000-4000-8000-000000001201","source_workout_template_id":"00000000-0000-4000-8000-000000001003","exercise_entry_id":"00000000-0000-4000-8000-000000001005","source_exercise_id":"goblet-squat","exercise_name_snapshot":"Owner squat","exercise_order":1,"tracking_type":"weight_reps","unilateral_mode":"bilateral","load_unit":"lb","distance_unit":null,"primary_value_label":"Load","secondary_value_label":"Reps","prescribed_target_text":"1 sets × 5","completion_status":"completed"}]'::jsonb,
    '[{"exercise_result_id":"00000000-0000-4000-8000-000000001201","set_order":1,"prescribed_set_index":1,"set_kind":"prescribed","status":"completed","completed_at":"2026-07-10T00:05:00Z"}]'::jsonb
  );
  raise exception 'invalid metric child unexpectedly succeeded';
exception when others then
  if exists (select 1 from public.workout_sessions where id='00000000-0000-4000-8000-000000001200') then raise exception 'late child failure left workout_session behind'; end if;
  if exists (select 1 from public.exercise_results where id='00000000-0000-4000-8000-000000001201') then raise exception 'late child failure left exercise_result behind'; end if;
end $$;

-- Foreign exercise entry is rejected before insert.
do $$
begin
  perform public.finalize_workout_session(
    '{"id":"00000000-0000-4000-8000-000000001300","workout_template_id":"00000000-0000-4000-8000-000000001003","completed_on":"2026-07-10","completed":true,"pain_occurred":false,"perceived_difficulty":"appropriate","notes":"","recommendation":"QA","phase_id_at_completion":"00000000-0000-4000-8000-000000001002","workout_name_snapshot":"Issue 10 owner workout","started_at":"2026-07-10T00:00:00Z","finished_at":"2026-07-10T00:05:00Z","elapsed_seconds":300,"elapsed_source":"server_timestamp"}'::jsonb,
    '[{"id":"00000000-0000-4000-8000-000000001301","source_workout_template_id":"00000000-0000-4000-8000-000000001003","exercise_entry_id":"00000000-0000-4000-8000-000000002004","source_exercise_id":null,"exercise_name_snapshot":"Foreign completion drill","exercise_order":1,"tracking_type":"completion","unilateral_mode":"bilateral","load_unit":null,"distance_unit":null,"primary_value_label":"Completion","secondary_value_label":null,"prescribed_target_text":"1 sets × Done","completion_status":"completed"}]'::jsonb,
    '[]'::jsonb
  );
  raise exception 'foreign exercise_entry_id unexpectedly succeeded';
exception when others then
  if exists (select 1 from public.workout_sessions where id='00000000-0000-4000-8000-000000001300') then raise exception 'foreign exercise_entry rejection left workout_session behind'; end if;
end $$;

-- Foreign/pre-existing exercise_result set parent is rejected before insert.
do $$
begin
  perform public.finalize_workout_session(
    '{"id":"00000000-0000-4000-8000-000000001400","workout_template_id":"00000000-0000-4000-8000-000000001003","completed_on":"2026-07-10","completed":true,"pain_occurred":false,"perceived_difficulty":"appropriate","notes":"","recommendation":"QA","phase_id_at_completion":"00000000-0000-4000-8000-000000001002","workout_name_snapshot":"Issue 10 owner workout","started_at":"2026-07-10T00:00:00Z","finished_at":"2026-07-10T00:05:00Z","elapsed_seconds":300,"elapsed_source":"server_timestamp"}'::jsonb,
    '[{"id":"00000000-0000-4000-8000-000000001401","source_workout_template_id":"00000000-0000-4000-8000-000000001003","exercise_entry_id":"00000000-0000-4000-8000-000000001004","source_exercise_id":null,"exercise_name_snapshot":"Owner completion drill","exercise_order":1,"tracking_type":"completion","unilateral_mode":"bilateral","load_unit":null,"distance_unit":null,"primary_value_label":"Completion","secondary_value_label":null,"prescribed_target_text":"1 sets × Done","completion_status":"completed"}]'::jsonb,
    '[{"exercise_result_id":"00000000-0000-4000-8000-000000002011","set_order":1,"prescribed_set_index":1,"set_kind":"prescribed","status":"completed","completed_at":"2026-07-10T00:05:00Z"}]'::jsonb
  );
  raise exception 'foreign/pre-existing set parent unexpectedly succeeded';
exception when others then
  if exists (select 1 from public.workout_sessions where id='00000000-0000-4000-8000-000000001400') then raise exception 'foreign set parent rejection left workout_session behind'; end if;
end $$;

do $$ begin if (select count(*) from public.exercise_results er left join public.workout_sessions ws on ws.id = er.workout_session_id where ws.id is null) <> 0 then raise exception 'orphan exercise_results exist'; end if; end $$;
do $$ begin if (select count(*) from public.exercise_set_results sr left join public.exercise_results er on er.id = sr.exercise_result_id where er.id is null) <> 0 then raise exception 'orphan exercise_set_results exist'; end if; end $$;

rollback;
