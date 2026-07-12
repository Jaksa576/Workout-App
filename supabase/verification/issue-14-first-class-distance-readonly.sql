-- Issue #14 first-class distance tracking read-only verification.
-- Run against the target Supabase database after applying the migration.

select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid in ('public.exercise_entries'::regclass, 'public.exercise_results'::regclass)
  and conname in ('exercise_entries_tracking_type_check','exercise_entries_tracking_units_check','exercise_results_tracking_type_check','exercise_results_units_check')
order by conname;

select proname, strpos(pg_get_functiondef(oid), '''distance''') > 0 as mentions_distance,
       strpos(pg_get_functiondef(oid), 'actual_distance') > 0 as persists_actual_distance,
       strpos(pg_get_functiondef(oid), 'actual_left_distance') > 0 as persists_left_distance,
       strpos(pg_get_functiondef(oid), 'actual_right_distance') > 0 as persists_right_distance
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('finalize_workout_session','validate_exercise_set_result')
order by proname;

select grantee, privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name = 'finalize_workout_session'
order by grantee, privilege_type;

select tracking_type, distance_unit, count(*)
from public.exercise_entries
where tracking_type in ('distance','distance_duration')
group by tracking_type, distance_unit
order by tracking_type, distance_unit;

select count(*) as historical_result_rows
from public.exercise_results;
