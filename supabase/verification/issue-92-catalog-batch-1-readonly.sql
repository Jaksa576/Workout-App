-- Issue #92 / PR #96 read-only verification. Every affected_rows value must be 0.
with expected(id, display_name, normalized_lookup_key, equipment_tags, movement_pattern, qualifier_text, metadata) as (values
  ('incline-barbell-bench-press','Incline barbell bench press','incline barbell bench press',array['Barbell','Bench']::text[],'push','Barbell/Bench · bilateral · push','{"category":"strength","difficultyTier":"intermediate","cautionTags":["shoulder"],"traitTags":["upper_body","loaded","incline"],"preferenceTags":["barbell","bench","chest","push","incline"]}'::jsonb),
  ('chin-up','Chin-up','chin up',array['Pull-up bar']::text[],'pull','Pull-up bar · bilateral · pull','{"category":"strength","difficultyTier":"intermediate","cautionTags":["shoulder"],"traitTags":["upper_body","bodyweight","vertical_pull"],"preferenceTags":["bodyweight","back","biceps","pull","pull-up bar"]}'::jsonb),
  ('t-bar-row','T-bar row','t bar row',array['Barbell','Landmine','Row handle']::text[],'pull','Barbell/Landmine/Row handle · bilateral · pull','{"category":"strength","difficultyTier":"foundation","cautionTags":["back","shoulder"],"traitTags":["upper_body","loaded","horizontal_pull"],"preferenceTags":["barbell","landmine","back","pull","gym"]}'::jsonb),
  ('close-grip-barbell-bench-press','Close-grip barbell bench press','close grip barbell bench press',array['Barbell','Bench']::text[],'push','Barbell/Bench · bilateral · push','{"category":"strength","difficultyTier":"foundation","cautionTags":["shoulder"],"traitTags":["upper_body","loaded","compound","triceps_focus"],"preferenceTags":["barbell","bench","triceps","push","upper body"]}'::jsonb),
  ('barbell-shrug','Barbell shrug','barbell shrug',array['Barbell']::text[],'pull','Barbell · bilateral · pull','{"category":"strength","difficultyTier":"intro","cautionTags":["shoulder"],"traitTags":["upper_body","loaded","accessory","grip"],"preferenceTags":["barbell","traps","shoulders","pull","upper body"]}'::jsonb),
  ('ez-bar-curl','EZ-bar curl','ez bar curl',array['EZ bar']::text[],'pull','EZ bar · bilateral · pull','{"category":"strength","difficultyTier":"intro","cautionTags":[],"traitTags":["upper_body","loaded","accessory"],"preferenceTags":["ez bar","biceps","arms","pull","hypertrophy"]}'::jsonb),
  ('chest-dip','Chest dip','chest dip',array['Dip bars']::text[],'push','Dip bars · bilateral · push','{"category":"strength","difficultyTier":"intermediate","cautionTags":["shoulder"],"traitTags":["upper_body","bodyweight","compound"],"preferenceTags":["bodyweight","dip bars","chest","triceps","push"]}'::jsonb)
)
select 'missing_or_mismatched_issue92_identities' check_name, count(*) affected_rows
from expected e left join public.exercise_identities i on i.id = e.id
where i.id is null or i.owner_scope <> 'system' or not i.active or i.superseded_by is not null
   or (i.display_name, i.normalized_lookup_key, i.equipment_tags, i.movement_pattern, i.qualifier_text, i.metadata)
      is distinct from (e.display_name, e.normalized_lookup_key, e.equipment_tags, e.movement_pattern, e.qualifier_text, e.metadata)
union all
select 'canonical_name_collisions', count(*)
from expected e join public.exercise_identities i on i.normalized_lookup_key = e.normalized_lookup_key
where i.owner_scope = 'system' and i.active and i.id <> e.id
union all
select 'reviewed_alias_collisions', count(*)
from expected e join public.exercise_aliases a on a.normalized_lookup_key = e.normalized_lookup_key
where a.owner_scope = 'system' and a.reviewed and a.exercise_identity_id <> e.id
union all
select 'unexpected_user_ownership', count(*)
from expected e join public.exercise_identities i on i.id = e.id
where i.owner_scope <> 'system';
