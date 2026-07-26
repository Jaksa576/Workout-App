-- Issue #92 / PR #96: seed the seven reviewed catalog identities.
-- Hosted status: not applied by Codex. Apply through the normal Supabase migration flow.

do $$
declare
  collision text;
begin
  select format('%s (%s)', existing.id, existing.normalized_lookup_key)
  into collision
  from public.exercise_identities existing
  join (values
    ('incline-barbell-bench-press', 'incline barbell bench press'),
    ('chin-up', 'chin up'),
    ('t-bar-row', 't bar row'),
    ('close-grip-barbell-bench-press', 'close grip barbell bench press'),
    ('barbell-shrug', 'barbell shrug'),
    ('ez-bar-curl', 'ez bar curl'),
    ('chest-dip', 'chest dip')
  ) expected(id, normalized_lookup_key)
    on existing.id = expected.id
  where existing.owner_scope <> 'system'
  limit 1;

  if collision is not null then
    raise exception 'Cannot seed Issue #92 system exercise identity because a non-system-owned identity already uses %', collision;
  end if;

  select format('%s conflicts with %s', expected.id, existing.id)
  into collision
  from (values
    ('incline-barbell-bench-press', 'incline barbell bench press'),
    ('chin-up', 'chin up'),
    ('t-bar-row', 't bar row'),
    ('close-grip-barbell-bench-press', 'close grip barbell bench press'),
    ('barbell-shrug', 'barbell shrug'),
    ('ez-bar-curl', 'ez bar curl'),
    ('chest-dip', 'chest dip')
  ) expected(id, normalized_lookup_key)
  join public.exercise_identities existing
    on existing.normalized_lookup_key = expected.normalized_lookup_key
   and existing.owner_scope = 'system'
   and existing.active
   and existing.id <> expected.id
  limit 1;

  if collision is not null then
    raise exception 'Cannot seed Issue #92 identities because a canonical-name collision exists: %', collision;
  end if;

  select format('%s conflicts with reviewed alias for %s', expected.id, alias.exercise_identity_id)
  into collision
  from (values
    ('incline-barbell-bench-press', 'incline barbell bench press'),
    ('chin-up', 'chin up'),
    ('t-bar-row', 't bar row'),
    ('close-grip-barbell-bench-press', 'close grip barbell bench press'),
    ('barbell-shrug', 'barbell shrug'),
    ('ez-bar-curl', 'ez bar curl'),
    ('chest-dip', 'chest dip')
  ) expected(id, normalized_lookup_key)
  join public.exercise_aliases alias
    on alias.normalized_lookup_key = expected.normalized_lookup_key
   and alias.owner_scope = 'system'
   and alias.reviewed
   and alias.exercise_identity_id <> expected.id
  limit 1;

  if collision is not null then
    raise exception 'Cannot seed Issue #92 identities because a reviewed-alias collision exists: %', collision;
  end if;
end $$;

insert into public.exercise_identities (
  id, display_name, normalized_lookup_key, owner_scope, equipment_tags,
  movement_pattern, qualifier_text, metadata, active, superseded_by
)
values
  ('incline-barbell-bench-press','Incline barbell bench press','incline barbell bench press','system',array['Barbell','Bench']::text[],'push','Barbell/Bench · bilateral · push','{"category":"strength","difficultyTier":"intermediate","cautionTags":["shoulder"],"traitTags":["upper_body","loaded","incline"],"preferenceTags":["barbell","bench","chest","push","incline"]}'::jsonb,true,null),
  ('chin-up','Chin-up','chin up','system',array['Pull-up bar']::text[],'pull','Pull-up bar · bilateral · pull','{"category":"strength","difficultyTier":"intermediate","cautionTags":["shoulder"],"traitTags":["upper_body","bodyweight","vertical_pull"],"preferenceTags":["bodyweight","back","biceps","pull","pull-up bar"]}'::jsonb,true,null),
  ('t-bar-row','T-bar row','t bar row','system',array['Barbell','Landmine','Row handle']::text[],'pull','Barbell/Landmine/Row handle · bilateral · pull','{"category":"strength","difficultyTier":"foundation","cautionTags":["back","shoulder"],"traitTags":["upper_body","loaded","horizontal_pull"],"preferenceTags":["barbell","landmine","back","pull","gym"]}'::jsonb,true,null),
  ('close-grip-barbell-bench-press','Close-grip barbell bench press','close grip barbell bench press','system',array['Barbell','Bench']::text[],'push','Barbell/Bench · bilateral · push','{"category":"strength","difficultyTier":"foundation","cautionTags":["shoulder"],"traitTags":["upper_body","loaded","compound","triceps_focus"],"preferenceTags":["barbell","bench","triceps","push","upper body"]}'::jsonb,true,null),
  ('barbell-shrug','Barbell shrug','barbell shrug','system',array['Barbell']::text[],'pull','Barbell · bilateral · pull','{"category":"strength","difficultyTier":"intro","cautionTags":["shoulder"],"traitTags":["upper_body","loaded","accessory","grip"],"preferenceTags":["barbell","traps","shoulders","pull","upper body"]}'::jsonb,true,null),
  ('ez-bar-curl','EZ-bar curl','ez bar curl','system',array['EZ bar']::text[],'pull','EZ bar · bilateral · pull','{"category":"strength","difficultyTier":"intro","cautionTags":[],"traitTags":["upper_body","loaded","accessory"],"preferenceTags":["ez bar","biceps","arms","pull","hypertrophy"]}'::jsonb,true,null),
  ('chest-dip','Chest dip','chest dip','system',array['Dip bars']::text[],'push','Dip bars · bilateral · push','{"category":"strength","difficultyTier":"intermediate","cautionTags":["shoulder"],"traitTags":["upper_body","bodyweight","compound"],"preferenceTags":["bodyweight","dip bars","chest","triceps","push"]}'::jsonb,true,null)
on conflict (id) do update set
  display_name = excluded.display_name,
  normalized_lookup_key = excluded.normalized_lookup_key,
  equipment_tags = excluded.equipment_tags,
  movement_pattern = excluded.movement_pattern,
  qualifier_text = excluded.qualifier_text,
  metadata = excluded.metadata,
  active = true,
  superseded_by = null,
  updated_at = now()
where public.exercise_identities.owner_scope = 'system';
