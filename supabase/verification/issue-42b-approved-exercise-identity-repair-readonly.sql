-- Issue #42B post-migration read-only verification.
-- Reports aggregate counts only; no user IDs, plan names, notes, or sensitive hosted data.
with approved_mappings(normalized_name, canonical_id, expected_entries) as (values
  ('dead bug','dead-bug',10),('step up','step-up',8),('farmer carry','farmer-carry',7),('side plank','side-plank',7),
  ('dumbbell row','dumbbell-row',5),('lateral shuffle','lateral-shuffle',5),('push up','push-up',5),('calf raise','calf-raise',4),
  ('easy run','easy-run',4),('walking lunge','walking-lunge',4),('bird dog','bird-dog',3),('glute bridge','glute-bridge',3),
  ('reverse lunge','reverse-lunge',3),('band row','band-row',1),('bodyweight squat','bodyweight-squat',1),('box squat','box-squat',1),('lateral lunge','lateral-lunge',1)
), entry_matches as (
  select m.normalized_name, m.canonical_id, m.expected_entries, ee.id, ee.canonical_exercise_id
  from approved_mappings m
  left join public.exercise_entries ee on lower(trim(regexp_replace(regexp_replace(ee.name, '[''’]', '', 'g'), '[^a-zA-Z0-9]+', ' ', 'g'))) = m.normalized_name
)
select 'approved_entry_updates_by_mapping' as check_name, normalized_name, canonical_id, expected_entries,
       count(id) filter (where canonical_exercise_id = canonical_id) as actual_linked,
       count(id) filter (where canonical_exercise_id is null) as remaining_unresolved,
       count(id) filter (where canonical_exercise_id is not null and canonical_exercise_id <> canonical_id) as wrong_target
from entry_matches
group by normalized_name, canonical_id, expected_entries
order by normalized_name;

with approved_mappings(normalized_name, canonical_id, expected_entries) as (values
  ('dead bug','dead-bug',10),('step up','step-up',8),('farmer carry','farmer-carry',7),('side plank','side-plank',7),
  ('dumbbell row','dumbbell-row',5),('lateral shuffle','lateral-shuffle',5),('push up','push-up',5),('calf raise','calf-raise',4),
  ('easy run','easy-run',4),('walking lunge','walking-lunge',4),('bird dog','bird-dog',3),('glute bridge','glute-bridge',3),
  ('reverse lunge','reverse-lunge',3),('band row','band-row',1),('bodyweight squat','bodyweight-squat',1),('box squat','box-squat',1),('lateral lunge','lateral-lunge',1)
)
select 'total_approved_rows_linked_and_idempotent_state' as check_name,
       17 as expected_mapping_count,
       72 as expected_repair_count,
       count(ee.id) filter (where ee.canonical_exercise_id = m.canonical_id) as total_approved_rows_linked,
       count(ee.id) filter (where ee.canonical_exercise_id is null) as unresolved_rows_on_rerun,
       count(ee.id) filter (where ee.canonical_exercise_id is not null and ee.canonical_exercise_id <> m.canonical_id) as wrong_target_rows_on_rerun
from approved_mappings m
left join public.exercise_entries ee on lower(trim(regexp_replace(regexp_replace(ee.name, '[''’]', '', 'g'), '[^a-zA-Z0-9]+', ' ', 'g'))) = m.normalized_name;

select 'ambiguous_reviewed_aliases' as check_name, ea.normalized_lookup_key, count(distinct ea.exercise_identity_id) as target_count
from public.exercise_aliases ea
join public.exercise_identities ei on ei.id = ea.exercise_identity_id and ei.active and ei.superseded_by is null
where ea.owner_scope = 'system' and ea.reviewed
group by ea.normalized_lookup_key
having count(distinct ea.exercise_identity_id) > 1;

select 'orphaned_canonical_entry_references' as check_name, count(*) as row_count
from public.exercise_entries ee left join public.exercise_identities ei on ei.id = ee.canonical_exercise_id
where ee.canonical_exercise_id is not null and ei.id is null;

select 'orphaned_canonical_result_references' as check_name, count(*) as row_count
from public.exercise_results er left join public.exercise_identities ei on ei.id = er.canonical_exercise_id
where er.canonical_exercise_id is not null and ei.id is null;

select 'inactive_or_superseded_identities_actively_referenced' as check_name, count(*) as row_count
from public.exercise_identities ei
where (not ei.active or ei.superseded_by is not null)
  and (exists (select 1 from public.exercise_entries ee where ee.canonical_exercise_id = ei.id)
    or exists (select 1 from public.exercise_results er where er.canonical_exercise_id = ei.id));

select 'historical_result_canonical_backfill_totals' as check_name, er.canonical_exercise_id, count(*) as result_count
from public.exercise_results er
join public.exercise_entries ee on ee.id = er.exercise_entry_id and er.canonical_exercise_id = ee.canonical_exercise_id
where er.canonical_exercise_id is not null
group by er.canonical_exercise_id
order by er.canonical_exercise_id;

select 'historical_display_name_invariants' as check_name,
       count(*) filter (where exercise_name_snapshot is null or btrim(exercise_name_snapshot) = '') as blank_snapshot_count,
       count(*) as total_result_rows
from public.exercise_results;

select 'custom_user_owned_identity_preservation' as check_name, count(*) as user_owned_entry_references
from public.exercise_entries ee
join public.exercise_identities ei on ei.id = ee.canonical_exercise_id
where ei.owner_scope = 'user';
