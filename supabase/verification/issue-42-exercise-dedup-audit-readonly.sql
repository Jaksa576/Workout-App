-- Issue #42A exercise library deduplication audit.
-- Read-only: this file contains SELECT statements only and must not be used for consolidation writes.

with candidate_groups(group_id, status, category, proposed_survivor, member_ids) as (
  values
    ('42A-001','proposed','alias-only presentation variant','push-up', array['push-up']::text[]),
    ('42A-002','proposed','alias-only presentation variant','romanian-deadlift', array['romanian-deadlift']::text[]),
    ('42A-003','proposed','alias-only presentation variant','bodyweight-squat', array['bodyweight-squat']::text[]),
    ('42A-004','proposed','alias-only presentation variant','dumbbell-row', array['dumbbell-row']::text[]),
    ('42A-005','rejected','confirmed distinct variant',null, array['bodyweight-squat','box-squat','goblet-squat','barbell-back-squat']::text[]),
    ('42A-006','rejected','confirmed distinct variant',null, array['romanian-deadlift','hip-hinge-drill','glute-bridge']::text[]),
    ('42A-007','rejected','confirmed distinct variant',null, array['reverse-lunge','walking-lunge','lateral-lunge','step-up']::text[]),
    ('42A-008','rejected','confirmed distinct variant',null, array['incline-push-up','push-up','dumbbell-floor-press','dumbbell-shoulder-press']::text[]),
    ('42A-009','rejected','confirmed distinct variant',null, array['band-row','dumbbell-row']::text[]),
    ('42A-010','rejected','confirmed distinct variant',null, array['brisk-walk','easy-run','run-walk-intervals','stride-drills','lateral-shuffle','skater-hop','low-impact-cardio-march']::text[]),
    ('42A-011','needs_product_review','ambiguous review required',null, array['calf-raise','tibialis-raise']::text[])
), alias_candidates(group_id, canonical_id, normalized_lookup_key) as (
  values
    ('42A-001','push-up','push up'),
    ('42A-002','romanian-deadlift','rdl'),
    ('42A-002','romanian-deadlift','romanian dead lift'),
    ('42A-003','bodyweight-squat','bodyweight squat'),
    ('42A-003','bodyweight-squat','air squat'),
    ('42A-004','dumbbell-row','db row'),
    ('42A-004','dumbbell-row','dumbbell row')
), normalized_entries as (
  select
    ee.id,
    ee.workout_template_id,
    ee.name,
    lower(trim(regexp_replace(regexp_replace(ee.name, '[''’]', '', 'g'), '[^a-zA-Z0-9]+', ' ', 'g'))) as normalized_lookup_key,
    nullif(ee.source_exercise_id, '') as source_exercise_id,
    ee.canonical_exercise_id
  from public.exercise_entries ee
), result_counts as (
  select
    er.canonical_exercise_id,
    er.source_exercise_id,
    count(*) as historical_result_snapshot_count,
    count(distinct er.workout_session_id) as active_workout_session_record_count
  from public.exercise_results er
  group by er.canonical_exercise_id, er.source_exercise_id
)
select
  'summary' as result_set,
  (select count(*) from public.exercise_identities where owner_scope = 'system') as system_identity_count,
  (select count(*) from public.exercise_aliases where owner_scope = 'system' and reviewed) as reviewed_system_alias_count,
  (select count(*) from public.exercise_entries) as active_plan_entry_count,
  (select count(*) from public.workout_templates) as template_seed_count,
  (select count(*) from public.workout_sessions) as active_workout_session_count,
  (select count(*) from public.exercise_results) as historical_result_snapshot_count,
  (select count(*) from public.exercise_entries where canonical_exercise_id is null) as custom_or_unresolved_entry_count,
  (select count(*) from public.exercise_identities where owner_scope = 'user') as user_owned_identity_count,
  (select count(*) from (
    select normalized_lookup_key
    from public.exercise_aliases
    where reviewed and owner_scope = 'system'
    group by normalized_lookup_key
    having count(distinct exercise_identity_id) > 1
  ) ambiguous_aliases) as ambiguous_reviewed_alias_count;

with candidate_groups(group_id, status, category, proposed_survivor, member_ids) as (
  values
    ('42A-001','proposed','alias-only presentation variant','push-up', array['push-up']::text[]),
    ('42A-002','proposed','alias-only presentation variant','romanian-deadlift', array['romanian-deadlift']::text[]),
    ('42A-003','proposed','alias-only presentation variant','bodyweight-squat', array['bodyweight-squat']::text[]),
    ('42A-004','proposed','alias-only presentation variant','dumbbell-row', array['dumbbell-row']::text[]),
    ('42A-005','rejected','confirmed distinct variant',null, array['bodyweight-squat','box-squat','goblet-squat','barbell-back-squat']::text[]),
    ('42A-006','rejected','confirmed distinct variant',null, array['romanian-deadlift','hip-hinge-drill','glute-bridge']::text[]),
    ('42A-007','rejected','confirmed distinct variant',null, array['reverse-lunge','walking-lunge','lateral-lunge','step-up']::text[]),
    ('42A-008','rejected','confirmed distinct variant',null, array['incline-push-up','push-up','dumbbell-floor-press','dumbbell-shoulder-press']::text[]),
    ('42A-009','rejected','confirmed distinct variant',null, array['band-row','dumbbell-row']::text[]),
    ('42A-010','rejected','confirmed distinct variant',null, array['brisk-walk','easy-run','run-walk-intervals','stride-drills','lateral-shuffle','skater-hop','low-impact-cardio-march']::text[]),
    ('42A-011','needs_product_review','ambiguous review required',null, array['calf-raise','tibialis-raise']::text[])
)
select
  'candidate_group_reference_counts' as result_set,
  cg.group_id,
  cg.status as approval_status,
  cg.category,
  cg.proposed_survivor,
  cg.member_ids,
  count(distinct i.id) as reusable_identity_count,
  count(distinct ee.id) as active_plan_entry_count,
  count(distinct ee.workout_template_id) as template_seed_count,
  count(distinct er.workout_session_id) as active_workout_session_record_count,
  count(distinct er.id) as historical_result_snapshot_count,
  count(distinct custom_ee.id) as custom_or_unresolved_same_name_entry_count,
  count(distinct ui.id) as user_owned_identity_count
from candidate_groups cg
left join public.exercise_identities i on i.id = any(cg.member_ids) and i.owner_scope = 'system'
left join public.exercise_entries ee on ee.canonical_exercise_id = any(cg.member_ids) or nullif(ee.source_exercise_id, '') = any(cg.member_ids)
left join public.exercise_results er on er.canonical_exercise_id = any(cg.member_ids) or nullif(er.source_exercise_id, '') = any(cg.member_ids)
left join public.exercise_entries custom_ee on custom_ee.canonical_exercise_id is null and lower(custom_ee.name) in (select lower(display_name) from public.exercise_identities where id = any(cg.member_ids))
left join public.exercise_identities ui on ui.owner_scope = 'user' and ui.normalized_lookup_key in (select normalized_lookup_key from public.exercise_identities where id = any(cg.member_ids))
group by cg.group_id, cg.status, cg.category, cg.proposed_survivor, cg.member_ids
order by cg.group_id;

with alias_candidates(group_id, canonical_id, normalized_lookup_key) as (
  values
    ('42A-001','push-up','push up'),
    ('42A-002','romanian-deadlift','rdl'),
    ('42A-002','romanian-deadlift','romanian dead lift'),
    ('42A-003','bodyweight-squat','bodyweight squat'),
    ('42A-003','bodyweight-squat','air squat'),
    ('42A-004','dumbbell-row','db row'),
    ('42A-004','dumbbell-row','dumbbell row')
), normalized_entries as (
  select
    ee.id,
    ee.workout_template_id,
    ee.name,
    lower(trim(regexp_replace(regexp_replace(ee.name, '[''’]', '', 'g'), '[^a-zA-Z0-9]+', ' ', 'g'))) as normalized_lookup_key,
    nullif(ee.source_exercise_id, '') as source_exercise_id,
    ee.canonical_exercise_id
  from public.exercise_entries ee
)
select
  'proposed_alias_active_entries_to_review' as result_set,
  ac.group_id,
  ac.canonical_id as proposed_survivor,
  ac.normalized_lookup_key,
  ne.id as exercise_entry_id,
  ne.workout_template_id,
  ne.name,
  ne.source_exercise_id,
  ne.canonical_exercise_id,
  case
    when ne.canonical_exercise_id = ac.canonical_id then 'already_canonical'
    when ne.canonical_exercise_id is null and ne.source_exercise_id is null then 'custom_or_unresolved_review_required'
    else 'would_move_if_product_approved'
  end as proposed_action
from alias_candidates ac
join normalized_entries ne on ne.normalized_lookup_key = ac.normalized_lookup_key
order by ac.group_id, ne.name, ne.id;

select
  'ambiguous_reviewed_aliases_blocker' as result_set,
  normalized_lookup_key,
  count(distinct exercise_identity_id) as identity_count,
  array_agg(distinct exercise_identity_id order by exercise_identity_id) as identity_ids
from public.exercise_aliases
where reviewed and owner_scope = 'system'
group by normalized_lookup_key
having count(distinct exercise_identity_id) > 1
order by normalized_lookup_key;

select
  'inactive_or_superseded_still_referenced' as result_set,
  i.id as exercise_identity_id,
  i.display_name,
  i.active,
  i.superseded_by,
  count(distinct ee.id) as active_plan_entry_count,
  count(distinct er.id) as historical_result_snapshot_count
from public.exercise_identities i
left join public.exercise_entries ee on ee.canonical_exercise_id = i.id
left join public.exercise_results er on er.canonical_exercise_id = i.id
where (not i.active or i.superseded_by is not null)
group by i.id, i.display_name, i.active, i.superseded_by
having count(distinct ee.id) > 0 or count(distinct er.id) > 0
order by i.display_name;
