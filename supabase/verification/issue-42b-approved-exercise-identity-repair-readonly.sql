-- Issue #42B post-migration read-only verification.
-- Reports aggregate counts only; no user IDs, plan names, notes, or sensitive hosted data.
-- Historical snapshot equality cannot be proven without a pre-migration baseline; this file reports repair scope and health counts only.
with approved_mappings(normalized_name, canonical_id, expected_entries) as (values
  ('dead bug','dead-bug',10),('step up','step-up',8),('farmer carry','farmer-carry',7),('side plank','side-plank',7),
  ('dumbbell row','dumbbell-row',5),('lateral shuffle','lateral-shuffle',5),('push up','push-up',5),('calf raise','calf-raise',4),
  ('easy run','easy-run',4),('walking lunge','walking-lunge',4),('bird dog','bird-dog',3),('glute bridge','glute-bridge',3),
  ('reverse lunge','reverse-lunge',3),('band row','band-row',1),('bodyweight squat','bodyweight-squat',1),('box squat','box-squat',1),('lateral lunge','lateral-lunge',1)
), normalized_entries as (
  select ee.id, ee.canonical_exercise_id,
         btrim(regexp_replace(regexp_replace(regexp_replace(lower(btrim(ee.name)), '[''’]', '', 'g'), '[^a-z0-9]+', ' ', 'g'), '\s+', ' ', 'g')) as normalized_name
  from public.exercise_entries ee
), entry_matches as (
  select m.normalized_name, m.canonical_id, m.expected_entries, ne.id, ne.canonical_exercise_id
  from approved_mappings m
  left join normalized_entries ne on ne.normalized_name = m.normalized_name
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
), normalized_entries as (
  select ee.id, ee.canonical_exercise_id,
         btrim(regexp_replace(regexp_replace(regexp_replace(lower(btrim(ee.name)), '[''’]', '', 'g'), '[^a-z0-9]+', ' ', 'g'), '\s+', ' ', 'g')) as normalized_name
  from public.exercise_entries ee
)
select 'total_approved_rows_linked_and_idempotent_state' as check_name,
       count(distinct m.normalized_name) as expected_mapping_count,
       (select sum(expected_entries) from approved_mappings) as expected_repair_count,
       count(ne.id) filter (where ne.canonical_exercise_id = m.canonical_id) as total_approved_rows_linked,
       count(ne.id) filter (where ne.canonical_exercise_id is null) as unresolved_rows_on_rerun,
       count(ne.id) filter (where ne.canonical_exercise_id is not null and ne.canonical_exercise_id <> m.canonical_id) as wrong_target_rows_on_rerun
from approved_mappings m
left join normalized_entries ne on ne.normalized_name = m.normalized_name;

with approved_mappings(normalized_name, canonical_id, expected_entries) as (values
  ('dead bug','dead-bug',10),('step up','step-up',8),('farmer carry','farmer-carry',7),('side plank','side-plank',7),
  ('dumbbell row','dumbbell-row',5),('lateral shuffle','lateral-shuffle',5),('push up','push-up',5),('calf raise','calf-raise',4),
  ('easy run','easy-run',4),('walking lunge','walking-lunge',4),('bird dog','bird-dog',3),('glute bridge','glute-bridge',3),
  ('reverse lunge','reverse-lunge',3),('band row','band-row',1),('bodyweight squat','bodyweight-squat',1),('box squat','box-squat',1),('lateral lunge','lateral-lunge',1)
), combined_resolver as (
  select ei.normalized_lookup_key, ei.id, ei.owner_scope, ei.owner_user_id, ei.active, ei.superseded_by, 'canonical' as source
  from public.exercise_identities ei
  where ei.owner_scope = 'system'
  union all
  select ea.normalized_lookup_key, ea.exercise_identity_id, ei.owner_scope, ei.owner_user_id, ei.active, ei.superseded_by, 'reviewed_alias' as source
  from public.exercise_aliases ea
  join public.exercise_identities ei on ei.id = ea.exercise_identity_id
  where ea.owner_scope = 'system' and ea.reviewed
)
select 'combined_canonical_alias_namespace_validation' as check_name, m.normalized_name, m.canonical_id,
       count(distinct c.id) filter (where c.active and c.superseded_by is null and c.owner_scope = 'system' and c.owner_user_id is null) as active_system_targets,
       count(*) filter (where not c.active or c.superseded_by is not null) as inactive_or_superseded_targets,
       count(*) filter (where c.owner_scope <> 'system' or c.owner_user_id is not null) as user_owned_targets,
       count(distinct c.id) filter (where c.id <> m.canonical_id) as wrong_resolver_targets
from approved_mappings m
left join combined_resolver c on c.normalized_lookup_key = m.normalized_name
group by m.normalized_name, m.canonical_id
order by m.normalized_name;

select 'orphaned_canonical_entry_references' as check_name, count(*) as row_count
from public.exercise_entries ee left join public.exercise_identities ei on ei.id = ee.canonical_exercise_id
where ee.canonical_exercise_id is not null and ei.id is null;

select 'orphaned_canonical_result_references' as check_name, count(*) as row_count
from public.exercise_results er left join public.exercise_identities ei on ei.id = er.canonical_exercise_id
where er.canonical_exercise_id is not null and ei.id is null;

with approved_mappings(normalized_name, canonical_id, expected_entries) as (values
  ('dead bug','dead-bug',10),('step up','step-up',8),('farmer carry','farmer-carry',7),('side plank','side-plank',7),
  ('dumbbell row','dumbbell-row',5),('lateral shuffle','lateral-shuffle',5),('push up','push-up',5),('calf raise','calf-raise',4),
  ('easy run','easy-run',4),('walking lunge','walking-lunge',4),('bird dog','bird-dog',3),('glute bridge','glute-bridge',3),
  ('reverse lunge','reverse-lunge',3),('band row','band-row',1),('bodyweight squat','bodyweight-squat',1),('box squat','box-squat',1),('lateral lunge','lateral-lunge',1)
), normalized_entries as (
  select ee.id, ee.canonical_exercise_id,
         btrim(regexp_replace(regexp_replace(regexp_replace(lower(btrim(ee.name)), '[''’]', '', 'g'), '[^a-z0-9]+', ' ', 'g'), '\s+', ' ', 'g')) as normalized_name
  from public.exercise_entries ee
), repaired_scope as (
  select ne.id, ne.canonical_exercise_id
  from normalized_entries ne join approved_mappings m on m.normalized_name = ne.normalized_name and m.canonical_id = ne.canonical_exercise_id
)
select 'repaired_entry_result_backfill_counts' as check_name,
       count(er.id) filter (where er.canonical_exercise_id = rs.canonical_exercise_id) as result_rows_backfilled_through_repaired_entry_ids,
       count(er.id) filter (where er.canonical_exercise_id is null) as remaining_null_result_canonical_ids_for_repaired_entries
from repaired_scope rs
join public.exercise_results er on er.exercise_entry_id = rs.id;

select 'unrelated_already_canonical_results' as check_name, count(*) as result_rows_already_canonical_and_unattributed_to_this_repair
from public.exercise_results er
where er.canonical_exercise_id is not null;

select 'inactive_or_superseded_identities_actively_referenced' as check_name, count(*) as row_count
from public.exercise_identities ei
where (not ei.active or ei.superseded_by is not null)
  and (exists (select 1 from public.exercise_entries ee where ee.canonical_exercise_id = ei.id)
    or exists (select 1 from public.exercise_results er where er.canonical_exercise_id = ei.id));

select 'historical_snapshot_blank_health_count' as check_name,
       count(*) filter (where exercise_name_snapshot is null or btrim(exercise_name_snapshot) = '') as blank_snapshot_count,
       count(*) as total_result_rows
from public.exercise_results;

select 'custom_user_owned_identity_preservation' as check_name, count(*) as user_owned_entry_references
from public.exercise_entries ee
join public.exercise_identities ei on ei.id = ee.canonical_exercise_id
where ei.owner_scope = 'user';
