-- Issue #14 read-only verification for finalized metric persistence.
select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'exercise_set_results'
  and column_name in (
    'prescribed_load','prescribed_reps','prescribed_duration_seconds','prescribed_distance',
    'actual_load','actual_reps','actual_duration_seconds','actual_distance',
    'actual_left_load','actual_left_reps','actual_left_duration_seconds','actual_left_distance',
    'actual_right_load','actual_right_reps','actual_right_duration_seconds','actual_right_distance'
  )
order by ordinal_position;

select pg_get_functiondef('public.finalize_workout_session(jsonb,jsonb,jsonb)'::regprocedure) like '%actual_left_duration_seconds%' as finalize_persists_left_duration,
       pg_get_functiondef('public.finalize_workout_session(jsonb,jsonb,jsonb)'::regprocedure) like '%actual_right_distance%' as finalize_persists_right_distance,
       pg_get_functiondef('public.finalize_workout_session(jsonb,jsonb,jsonb)'::regprocedure) like '%prescribed_duration_seconds%' as finalize_persists_prescribed_duration;
