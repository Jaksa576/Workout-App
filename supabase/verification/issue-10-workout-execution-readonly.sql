-- Issue #10 read-only verification. Safe for hosted Supabase; no writes are performed.
select version from supabase_migrations.schema_migrations where version = '20260710120000' order by version;
select table_name from information_schema.tables where table_schema = 'public' and table_name in ('workout_sessions','exercise_results','exercise_set_results') order by table_name;
select table_name, column_name, data_type, is_nullable, column_default from information_schema.columns where table_schema = 'public' and table_name in ('workout_sessions','exercise_results','exercise_set_results','exercise_entries') and column_name in ('tracking_type','unilateral_mode','load_unit','distance_unit','primary_value_label','secondary_value_label','started_at','finished_at','elapsed_seconds','elapsed_source','exercise_order','set_order','status','completed_at','prescribed_set_index') order by table_name, column_name;
select conrelid::regclass as table_name, conname, pg_get_constraintdef(oid) as definition from pg_constraint where conrelid in ('public.workout_sessions'::regclass,'public.exercise_results'::regclass,'public.exercise_set_results'::regclass,'public.exercise_entries'::regclass) order by 1,2;
select schemaname, tablename, indexname, indexdef from pg_indexes where schemaname = 'public' and tablename in ('workout_sessions','exercise_results','exercise_set_results') order by tablename, indexname;
select n.nspname as schema_name, c.relname as table_name, c.relrowsecurity as rls_enabled, c.relforcerowsecurity as force_rls from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname='public' and c.relname in ('workout_sessions','exercise_results','exercise_set_results') order by c.relname;
select schemaname, tablename, policyname, cmd, roles, qual as using_expression, with_check as with_check_expression from pg_policies where schemaname = 'public' and tablename in ('workout_sessions','exercise_results','exercise_set_results') order by tablename, policyname;
select p.proname, pg_get_function_arguments(p.oid) as arguments, pg_get_function_result(p.oid) as result_type, case when p.prosecdef then 'security definer' else 'security invoker' end as security_mode, p.proconfig as function_config from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname='public' and p.proname in ('validate_exercise_set_result','finalize_workout_session') order by p.proname;
select event_object_table, trigger_name, action_timing, event_manipulation, action_statement from information_schema.triggers where trigger_schema='public' and event_object_table in ('workout_sessions','exercise_results','exercise_set_results') order by event_object_table, trigger_name;
select 'workout_sessions' as table_name, count(*) as rows_after_reset from public.workout_sessions union all select 'exercise_results', count(*) from public.exercise_results union all select 'exercise_set_results', count(*) from public.exercise_set_results;
select tracking_type, unilateral_mode, load_unit, distance_unit, count(*) from public.exercise_entries group by tracking_type, unilateral_mode, load_unit, distance_unit order by tracking_type, unilateral_mode, load_unit, distance_unit;
select count(*) filter (where (source_exercise_id is null or source_exercise_id = '') and tracking_type = 'completion') as custom_completion_fallbacks, count(*) filter (where source_exercise_id is not null and tracking_type = 'completion') as catalog_or_unknown_completion_fallbacks, count(*) as total_entries from public.exercise_entries;
select count(*) as invalid_unit_tracking_combinations from public.exercise_entries where not (((tracking_type = 'weight_reps') = (load_unit is not null)) and ((tracking_type = 'distance_duration') = (distance_unit is not null)) and (load_unit is null or load_unit in ('lb','kg')) and (distance_unit is null or distance_unit in ('mi','km','m')));
select count(*) as orphan_exercise_results from public.exercise_results er left join public.workout_sessions ws on ws.id = er.workout_session_id where ws.id is null;
select count(*) as orphan_set_results from public.exercise_set_results sr left join public.exercise_results er on er.id = sr.exercise_result_id where er.id is null;
select workout_session_id, exercise_order, count(*) from public.exercise_results group by workout_session_id, exercise_order having count(*) > 1;
select exercise_result_id, set_order, count(*) from public.exercise_set_results group by exercise_result_id, set_order having count(*) > 1;

-- Catalog mapping reconciliation: reports source IDs in exercise_entries that are absent from the reviewed static catalog snapshot.
with known_catalog_ids(source_exercise_id) as (values
  ('bodyweight-squat'),('box-squat'),('goblet-squat'),('barbell-back-squat'),('romanian-deadlift'),('hip-hinge-drill'),('glute-bridge'),('reverse-lunge'),('step-up'),('walking-lunge'),('incline-push-up'),('push-up'),('dumbbell-floor-press'),('dumbbell-shoulder-press'),('band-row'),('dumbbell-row'),('farmer-carry'),('dead-bug'),('side-plank'),('bird-dog'),('dumbbell-lateral-raise'),('dumbbell-curl'),('calf-raise'),('tibialis-raise'),('hip-flexor-rockback'),('thoracic-rotation'),('ankle-rock'),('brisk-walk'),('low-impact-cardio-march'),('run-walk-intervals'),('easy-run'),('stride-drills'),('lateral-lunge'),('lateral-shuffle'),('skater-hop')
)
select nullif(ee.source_exercise_id,'') as unknown_source_exercise_id, ee.tracking_type, ee.unilateral_mode, ee.load_unit, ee.distance_unit, ee.primary_value_label, ee.secondary_value_label, count(*) as entry_count
from public.exercise_entries ee
left join known_catalog_ids k on k.source_exercise_id = nullif(ee.source_exercise_id,'')
where nullif(ee.source_exercise_id,'') is not null and k.source_exercise_id is null
group by 1,2,3,4,5,6,7
order by entry_count desc, unknown_source_exercise_id;

with known_catalog_ids(source_exercise_id) as (values
  ('bodyweight-squat'),('box-squat'),('goblet-squat'),('barbell-back-squat'),('romanian-deadlift'),('hip-hinge-drill'),('glute-bridge'),('reverse-lunge'),('step-up'),('walking-lunge'),('incline-push-up'),('push-up'),('dumbbell-floor-press'),('dumbbell-shoulder-press'),('band-row'),('dumbbell-row'),('farmer-carry'),('dead-bug'),('side-plank'),('bird-dog'),('dumbbell-lateral-raise'),('dumbbell-curl'),('calf-raise'),('tibialis-raise'),('hip-flexor-rockback'),('thoracic-rotation'),('ankle-rock'),('brisk-walk'),('low-impact-cardio-march'),('run-walk-intervals'),('easy-run'),('stride-drills'),('lateral-lunge'),('lateral-shuffle'),('skater-hop')
)
select count(*) as unknown_ids_not_using_completion_fallback
from public.exercise_entries ee
left join known_catalog_ids k on k.source_exercise_id = nullif(ee.source_exercise_id,'')
where nullif(ee.source_exercise_id,'') is not null
  and k.source_exercise_id is null
  and (ee.tracking_type <> 'completion' or ee.unilateral_mode <> 'bilateral' or ee.load_unit is not null or ee.distance_unit is not null or ee.primary_value_label is distinct from 'Completion' or ee.secondary_value_label is not null);
