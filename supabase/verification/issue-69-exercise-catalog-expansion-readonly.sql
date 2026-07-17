-- Issue #69 read-only verification for additive exercise catalog identity expansion.
-- Hosted status: not run by Codex. This file is read-only and should be executed only when applying the committed migration through the approved Supabase flow.

with expected_identities(id, display_name, normalized_lookup_key, equipment_tags, movement_pattern, qualifier_text, metadata) as (
  values
    ('front-squat','Front squat','front squat',array['Barbell']::text[],'squat','Barbell · bilateral · squat','{"category":"strength","difficultyTier":"intermediate","cautionTags":["knee","back","loaded_spine"],"traitTags":["bilateral","loaded"],"preferenceTags":["barbell","lower body","squat"]}'::jsonb),
    ('leg-press','Leg press','leg press',array['Machine']::text[],'squat','Machine · bilateral · squat','{"category":"strength","difficultyTier":"foundation","cautionTags":["knee","back"],"traitTags":["bilateral","machine"],"preferenceTags":["machine","lower body","squat"]}'::jsonb),
    ('barbell-bench-press','Barbell bench press','barbell bench press',array['Barbell','Bench']::text[],'push','Barbell/Bench · bilateral · push','{"category":"strength","difficultyTier":"intermediate","cautionTags":["shoulder"],"traitTags":["upper_body","higher_load"],"preferenceTags":["barbell","chest","push"]}'::jsonb),
    ('suitcase-carry','Suitcase carry','suitcase carry',array['Dumbbells','Kettlebell']::text[],'carry','Dumbbells/Kettlebell · same each side · carry','{"category":"strength","difficultyTier":"foundation","cautionTags":["back"],"traitTags":["loaded","core","grip","unilateral_load"],"preferenceTags":["dumbbells","kettlebell","carry","core"]}'::jsonb),
    ('calf-stretch','Calf stretch','calf stretch',array['Bodyweight','Wall']::text[],'mobility','Bodyweight/Wall · same each side · mobility','{"category":"mobility","difficultyTier":"intro","cautionTags":["ankle"],"traitTags":["mobility","low_load"],"preferenceTags":["mobility","calves","running prep"]}'::jsonb),
    ('marching-drill','Marching drill','marching drill',array['Bodyweight']::text[],'run','Bodyweight · bilateral · run','{"category":"running_prep","difficultyTier":"intro","cautionTags":[],"traitTags":["running_support","low_impact"],"preferenceTags":["running prep","bodyweight"]}'::jsonb)
), expected_aliases(exercise_identity_id, alias, normalized_lookup_key) as (
  values
    ('barbell-bench-press','bench press','bench press'),
    ('dumbbell-bench-press','db bench press','db bench press'),
    ('dumbbell-romanian-deadlift','db rdl','db rdl'),
    ('barbell-overhead-press','ohp','ohp'),
    ('suitcase-carry','suitcase walk','suitcase walk'),
    ('bulgarian-split-squat','rfess','rfess')
)
select 'missing_new_canonical_identities' as check_name, e.* from expected_identities e left join public.exercise_identities i on i.id = e.id and i.owner_scope = 'system' where i.id is null
union all
select 'duplicate_canonical_identities' as check_name, i.id, null::text, null::text, null::text[], null::text, null::text, null::jsonb from public.exercise_identities i join expected_identities e on e.id = i.id group by i.id having count(*) > 1
union all
select 'wrong_display_names' as check_name, e.* from expected_identities e join public.exercise_identities i on i.id = e.id where i.display_name <> e.display_name
union all
select 'wrong_normalized_lookup_keys' as check_name, e.* from expected_identities e join public.exercise_identities i on i.id = e.id where i.normalized_lookup_key <> e.normalized_lookup_key
union all
select 'wrong_equipment_tags' as check_name, e.* from expected_identities e join public.exercise_identities i on i.id = e.id where i.equipment_tags <> e.equipment_tags
union all
select 'wrong_movement_patterns' as check_name, e.* from expected_identities e join public.exercise_identities i on i.id = e.id where i.movement_pattern <> e.movement_pattern
union all
select 'wrong_catalog_metadata_json' as check_name, e.* from expected_identities e join public.exercise_identities i on i.id = e.id where i.metadata <> e.metadata
union all
select 'user_owned_identities_affected' as check_name, i.id, i.display_name, i.normalized_lookup_key, i.equipment_tags, i.movement_pattern, i.qualifier_text, i.metadata from public.exercise_identities i join expected_identities e on e.id = i.id where i.owner_scope <> 'system' or i.owner_user_id is not null
union all
select 'inactive_or_superseded_target_identities' as check_name, i.id, i.display_name, i.normalized_lookup_key, i.equipment_tags, i.movement_pattern, i.qualifier_text, i.metadata from public.exercise_identities i join expected_identities e on e.id = i.id where not i.active or i.superseded_by is not null;

with expected_aliases(exercise_identity_id, alias, normalized_lookup_key) as (
  values
    ('barbell-bench-press','bench press','bench press'),
    ('dumbbell-bench-press','db bench press','db bench press'),
    ('dumbbell-romanian-deadlift','db rdl','db rdl'),
    ('barbell-overhead-press','ohp','ohp'),
    ('suitcase-carry','suitcase walk','suitcase walk'),
    ('bulgarian-split-squat','rfess','rfess')
)
select 'missing_aliases' as check_name, e.* from expected_aliases e left join public.exercise_aliases a on a.normalized_lookup_key = e.normalized_lookup_key and a.owner_scope = 'system' and a.reviewed where a.id is null
union all
select 'aliases_targeting_wrong_identity' as check_name, e.* from expected_aliases e join public.exercise_aliases a on a.normalized_lookup_key = e.normalized_lookup_key and a.owner_scope = 'system' and a.reviewed where a.exercise_identity_id <> e.exercise_identity_id
union all
select 'duplicate_aliases' as check_name, min(a.exercise_identity_id), min(a.alias), a.normalized_lookup_key from public.exercise_aliases a join expected_aliases e on e.normalized_lookup_key = a.normalized_lookup_key where a.owner_scope = 'system' and a.reviewed group by a.normalized_lookup_key having count(*) > 1
union all
select 'alias_to_alias_collisions' as check_name, min(a.exercise_identity_id), min(a.alias), a.normalized_lookup_key from public.exercise_aliases a where a.owner_scope = 'system' and a.reviewed group by a.normalized_lookup_key having count(distinct a.exercise_identity_id) > 1
union all
select 'alias_to_canonical_collisions' as check_name, a.exercise_identity_id, a.alias, a.normalized_lookup_key from public.exercise_aliases a join public.exercise_identities i on i.normalized_lookup_key = a.normalized_lookup_key and i.owner_scope = 'system' and i.active and i.id <> a.exercise_identity_id where a.owner_scope = 'system' and a.reviewed;

select 'historical_snapshots_touched' as check_name, count(*) as affected_rows
from public.exercise_results er
where er.exercise_name is null or er.exercise_name = '';

select 'idempotency_rerun_blockers' as check_name, count(*) as blocker_count
from public.exercise_aliases a
where a.owner_scope = 'system' and a.reviewed and a.normalized_lookup_key is null;
