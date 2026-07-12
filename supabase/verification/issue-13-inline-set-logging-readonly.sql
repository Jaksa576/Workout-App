-- Issue #13 read-only verification.
select name, source_exercise_id, tracking_type, load_unit, unilateral_mode, count(*)
from public.exercise_entries
where lower(name) in ('goblet squat','romanian deadlift')
group by name, source_exercise_id, tracking_type, load_unit, unilateral_mode
order by name;

select count(*) as targeted_strength_completion_fallbacks
from public.exercise_entries
where lower(name) in ('goblet squat','romanian deadlift')
  and (tracking_type <> 'weight_reps' or load_unit is null or source_exercise_id is null);

select p.proname, pg_get_functiondef(p.oid) like '%actual_load, actual_reps%' as rpc_inserts_actual_metrics
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname='public' and p.proname='finalize_workout_session';

-- Optional completed metrics contract: completed metric rows may persist null scalar values,
-- while supplied values remain constrained by type/range checks.
select pg_get_functiondef('public.validate_exercise_set_result'::regproc) not like '%completed weight_reps requires%' as completed_metric_values_are_optional;
select pg_get_functiondef('public.finalize_workout_session(jsonb,jsonb,jsonb)'::regprocedure) not like '%completed weight_reps%' as finalize_accepts_completed_null_metrics;
