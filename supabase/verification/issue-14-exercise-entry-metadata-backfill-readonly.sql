-- Issue #14 read-only verification for exercise_entries metadata backfill.

select tracking_type, count(*) as row_count
from public.exercise_entries
group by tracking_type
order by tracking_type;

select unilateral_mode, count(*) as row_count
from public.exercise_entries
group by unilateral_mode
order by unilateral_mode;

select name, source_exercise_id, sets, reps, tracking_type, unilateral_mode, load_unit, distance_unit, primary_value_label, secondary_value_label, count(*) as entry_count
from public.exercise_entries
where tracking_type = 'completion'
group by name, source_exercise_id, sets, reps, tracking_type, unilateral_mode, load_unit, distance_unit, primary_value_label, secondary_value_label
order by entry_count desc, lower(name), reps;

select name, source_exercise_id, sets, reps, count(*) as entry_count
from public.exercise_entries
where tracking_type = 'completion' and sets > 1
group by name, source_exercise_id, sets, reps
order by entry_count desc, lower(name), reps;

select name, source_exercise_id, sets, reps, count(*) as entry_count
from public.exercise_entries
where tracking_type = 'completion'
  and (
    reps ~* '\d'
    or reps ~* '(sec|second|min|minute|per side|each side|meter|metre|\bm\b|mile|\bmi\b|steps|runs?|carr(y|ies)|shuffle|march|interval)'
  )
group by name, source_exercise_id, sets, reps
order by entry_count desc, lower(name), reps;

select id, name, source_exercise_id, tracking_type, load_unit, distance_unit
from public.exercise_entries
where (tracking_type = 'weight_reps' and load_unit is null)
   or (tracking_type <> 'weight_reps' and load_unit is not null)
   or (tracking_type = 'distance_duration' and distance_unit is null)
   or (tracking_type <> 'distance_duration' and distance_unit is not null)
order by name;

select id, name, reps, tracking_type, unilateral_mode
from public.exercise_entries
where (unilateral_mode in ('same_each_side','independent_sides') and reps !~* '(per side|each side|each way|side)')
   or (unilateral_mode = 'bilateral' and reps ~* '(per side|each side|each way)')
order by name, reps;

select name, reps, tracking_type, unilateral_mode, load_unit, distance_unit, count(*) as entry_count
from public.exercise_entries
where lower(trim(regexp_replace(name, '[^a-zA-Z0-9]+', ' ', 'g'))) in (
  'hamstring bridge hold',
  'lateral band walk',
  'half kneeling hip flexor stretch',
  'dead bug'
)
group by name, reps, tracking_type, unilateral_mode, load_unit, distance_unit
order by lower(name), reps, tracking_type, unilateral_mode;
