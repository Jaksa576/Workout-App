-- Issue #98, Slice 1: seed the 36 approved critical catalog identities.
-- Hosted status: not applied by Codex. Apply through the normal Supabase migration flow.

do $$
declare
  collision text;
begin
  select format('%s (%s)', existing.id, existing.owner_scope)
  into collision
  from public.exercise_identities existing
  join (values
    ('cable-crunch', 'kneeling cable crunch'),
    ('machine-abdominal-crunch', 'machine abdominal crunch'),
    ('reverse-crunch', 'reverse crunch'),
    ('hanging-knee-raise', 'hanging knee raise'),
    ('hanging-straight-leg-raise', 'hanging straight leg raise'),
    ('captains-chair-knee-raise', 'captains chair knee raise'),
    ('ab-wheel-rollout', 'ab wheel rollout'),
    ('stability-ball-rollout', 'stability ball rollout'),
    ('stability-ball-stir-the-pot', 'stability ball stir the pot'),
    ('short-lever-copenhagen-plank', 'short lever copenhagen plank'),
    ('long-lever-copenhagen-plank', 'long lever copenhagen plank'),
    ('side-plank-cable-row', 'side plank with cable row'),
    ('landmine-rotation', 'landmine rotation'),
    ('double-front-rack-carry', 'double front rack carry'),
    ('single-arm-front-rack-carry', 'single arm front rack carry'),
    ('bear-hug-sandbag-carry', 'bear hug sandbag carry'),
    ('zercher-carry', 'zercher carry'),
    ('trap-bar-carry', 'trap bar carry'),
    ('single-arm-waiter-carry', 'single arm waiter carry'),
    ('standing-cable-hip-adduction', 'standing cable hip adduction'),
    ('side-lying-hip-adduction', 'side lying hip adduction'),
    ('slider-adductor-slide-out', 'slider adductor slide out'),
    ('single-arm-kettlebell-clean', 'single arm kettlebell clean'),
    ('double-kettlebell-clean', 'double kettlebell clean'),
    ('single-arm-kettlebell-snatch', 'single arm kettlebell snatch'),
    ('turkish-get-up', 'turkish get up'),
    ('barbell-power-clean', 'barbell power clean'),
    ('hang-power-clean', 'hang power clean'),
    ('barbell-clean-pull', 'barbell clean pull'),
    ('barbell-high-pull', 'barbell high pull'),
    ('dumbbell-hang-power-clean', 'dumbbell hang power clean'),
    ('jump-rope', 'jump rope'),
    ('ski-ergometer', 'ski ergometer'),
    ('battle-rope-alternating-waves', 'battle rope alternating waves'),
    ('battle-rope-slams', 'battle rope slams'),
    ('hand-over-hand-sled-pull', 'hand over hand sled pull')
  ) expected(id, normalized_lookup_key) on existing.id = expected.id
  where existing.owner_scope <> 'system'
  limit 1;

  if collision is not null then
    raise exception 'Cannot seed Issue #98 system exercise identity because a non-system-owned identity already uses %', collision;
  end if;

  select format('%s conflicts with %s (%s)', expected.id, existing.id, existing.owner_scope)
  into collision
  from (values
    ('cable-crunch', 'kneeling cable crunch'),
    ('machine-abdominal-crunch', 'machine abdominal crunch'),
    ('reverse-crunch', 'reverse crunch'),
    ('hanging-knee-raise', 'hanging knee raise'),
    ('hanging-straight-leg-raise', 'hanging straight leg raise'),
    ('captains-chair-knee-raise', 'captains chair knee raise'),
    ('ab-wheel-rollout', 'ab wheel rollout'),
    ('stability-ball-rollout', 'stability ball rollout'),
    ('stability-ball-stir-the-pot', 'stability ball stir the pot'),
    ('short-lever-copenhagen-plank', 'short lever copenhagen plank'),
    ('long-lever-copenhagen-plank', 'long lever copenhagen plank'),
    ('side-plank-cable-row', 'side plank with cable row'),
    ('landmine-rotation', 'landmine rotation'),
    ('double-front-rack-carry', 'double front rack carry'),
    ('single-arm-front-rack-carry', 'single arm front rack carry'),
    ('bear-hug-sandbag-carry', 'bear hug sandbag carry'),
    ('zercher-carry', 'zercher carry'),
    ('trap-bar-carry', 'trap bar carry'),
    ('single-arm-waiter-carry', 'single arm waiter carry'),
    ('standing-cable-hip-adduction', 'standing cable hip adduction'),
    ('side-lying-hip-adduction', 'side lying hip adduction'),
    ('slider-adductor-slide-out', 'slider adductor slide out'),
    ('single-arm-kettlebell-clean', 'single arm kettlebell clean'),
    ('double-kettlebell-clean', 'double kettlebell clean'),
    ('single-arm-kettlebell-snatch', 'single arm kettlebell snatch'),
    ('turkish-get-up', 'turkish get up'),
    ('barbell-power-clean', 'barbell power clean'),
    ('hang-power-clean', 'hang power clean'),
    ('barbell-clean-pull', 'barbell clean pull'),
    ('barbell-high-pull', 'barbell high pull'),
    ('dumbbell-hang-power-clean', 'dumbbell hang power clean'),
    ('jump-rope', 'jump rope'),
    ('ski-ergometer', 'ski ergometer'),
    ('battle-rope-alternating-waves', 'battle rope alternating waves'),
    ('battle-rope-slams', 'battle rope slams'),
    ('hand-over-hand-sled-pull', 'hand over hand sled pull')
  ) expected(id, normalized_lookup_key)
  join public.exercise_identities existing
    on existing.normalized_lookup_key = expected.normalized_lookup_key
   and existing.active
   and existing.id <> expected.id
  limit 1;

  if collision is not null then
    raise exception 'Cannot seed Issue #98 identities because a canonical-name collision exists: %', collision;
  end if;

  select format('%s conflicts with reviewed alias for %s (%s)', expected.id, alias.exercise_identity_id, alias.owner_scope)
  into collision
  from (values
    ('cable-crunch', 'kneeling cable crunch'),
    ('machine-abdominal-crunch', 'machine abdominal crunch'),
    ('reverse-crunch', 'reverse crunch'),
    ('hanging-knee-raise', 'hanging knee raise'),
    ('hanging-straight-leg-raise', 'hanging straight leg raise'),
    ('captains-chair-knee-raise', 'captains chair knee raise'),
    ('ab-wheel-rollout', 'ab wheel rollout'),
    ('stability-ball-rollout', 'stability ball rollout'),
    ('stability-ball-stir-the-pot', 'stability ball stir the pot'),
    ('short-lever-copenhagen-plank', 'short lever copenhagen plank'),
    ('long-lever-copenhagen-plank', 'long lever copenhagen plank'),
    ('side-plank-cable-row', 'side plank with cable row'),
    ('landmine-rotation', 'landmine rotation'),
    ('double-front-rack-carry', 'double front rack carry'),
    ('single-arm-front-rack-carry', 'single arm front rack carry'),
    ('bear-hug-sandbag-carry', 'bear hug sandbag carry'),
    ('zercher-carry', 'zercher carry'),
    ('trap-bar-carry', 'trap bar carry'),
    ('single-arm-waiter-carry', 'single arm waiter carry'),
    ('standing-cable-hip-adduction', 'standing cable hip adduction'),
    ('side-lying-hip-adduction', 'side lying hip adduction'),
    ('slider-adductor-slide-out', 'slider adductor slide out'),
    ('single-arm-kettlebell-clean', 'single arm kettlebell clean'),
    ('double-kettlebell-clean', 'double kettlebell clean'),
    ('single-arm-kettlebell-snatch', 'single arm kettlebell snatch'),
    ('turkish-get-up', 'turkish get up'),
    ('barbell-power-clean', 'barbell power clean'),
    ('hang-power-clean', 'hang power clean'),
    ('barbell-clean-pull', 'barbell clean pull'),
    ('barbell-high-pull', 'barbell high pull'),
    ('dumbbell-hang-power-clean', 'dumbbell hang power clean'),
    ('jump-rope', 'jump rope'),
    ('ski-ergometer', 'ski ergometer'),
    ('battle-rope-alternating-waves', 'battle rope alternating waves'),
    ('battle-rope-slams', 'battle rope slams'),
    ('hand-over-hand-sled-pull', 'hand over hand sled pull')
  ) expected(id, normalized_lookup_key)
  join public.exercise_aliases alias
    on alias.normalized_lookup_key = expected.normalized_lookup_key
   and alias.reviewed
  limit 1;

  if collision is not null then
    raise exception 'Cannot seed Issue #98 identities because a reviewed-alias collision exists: %', collision;
  end if;
end $$;

insert into public.exercise_identities (
  id, display_name, normalized_lookup_key, owner_scope, equipment_tags,
  movement_pattern, qualifier_text, metadata, active, superseded_by
)
values
  ('cable-crunch','Kneeling cable crunch','kneeling cable crunch','system',array['Cable','Rope attachment']::text[],'core','Cable/Rope attachment · bilateral · core','{"category":"core","difficultyTier":"foundation","cautionTags":["back"],"traitTags":["core","loaded","trunk_flexion"],"preferenceTags":["cable","core","abs"]}'::jsonb,true,null),
  ('machine-abdominal-crunch','Machine abdominal crunch','machine abdominal crunch','system',array['Machine']::text[],'core','Machine · bilateral · core','{"category":"core","difficultyTier":"foundation","cautionTags":["back"],"traitTags":["core","machine","trunk_flexion"],"preferenceTags":["machine","core","abs"]}'::jsonb,true,null),
  ('reverse-crunch','Reverse crunch','reverse crunch','system',array['Bodyweight']::text[],'core','Bodyweight · bilateral · core','{"category":"core","difficultyTier":"intro","cautionTags":["back"],"traitTags":["core","bodyweight","trunk_flexion"],"preferenceTags":["bodyweight","core","home"]}'::jsonb,true,null),
  ('hanging-knee-raise','Hanging knee raise','hanging knee raise','system',array['Pull-up bar']::text[],'core','Pull-up bar · bilateral · core','{"category":"core","difficultyTier":"foundation","cautionTags":["shoulder","back"],"traitTags":["core","bodyweight","hanging"],"preferenceTags":["bodyweight","core","pull-up bar"]}'::jsonb,true,null),
  ('hanging-straight-leg-raise','Hanging straight-leg raise','hanging straight leg raise','system',array['Pull-up bar']::text[],'core','Pull-up bar · bilateral · core','{"category":"core","difficultyTier":"intermediate","cautionTags":["shoulder","back"],"traitTags":["core","bodyweight","hanging"],"preferenceTags":["bodyweight","core","pull-up bar"]}'::jsonb,true,null),
  ('captains-chair-knee-raise','Captain''s-chair knee raise','captains chair knee raise','system',array['Captain''s chair']::text[],'core','Captain''s chair · bilateral · core','{"category":"core","difficultyTier":"foundation","cautionTags":["shoulder","back"],"traitTags":["core","bodyweight","supported"],"preferenceTags":["machine","core","abs"]}'::jsonb,true,null),
  ('ab-wheel-rollout','Ab-wheel rollout','ab wheel rollout','system',array['Ab wheel']::text[],'core','Ab wheel · bilateral · core','{"category":"core","difficultyTier":"intermediate","cautionTags":["back","shoulder"],"traitTags":["core","anti_extension","bodyweight"],"preferenceTags":["ab wheel","core","home"]}'::jsonb,true,null),
  ('stability-ball-rollout','Stability-ball rollout','stability ball rollout','system',array['Stability ball']::text[],'core','Stability ball · bilateral · core','{"category":"core","difficultyTier":"foundation","cautionTags":["back","shoulder"],"traitTags":["core","anti_extension","supported"],"preferenceTags":["stability ball","core","home"]}'::jsonb,true,null),
  ('stability-ball-stir-the-pot','Stability-ball stir-the-pot','stability ball stir the pot','system',array['Stability ball']::text[],'core','Stability ball · bilateral · core','{"category":"core","difficultyTier":"intermediate","cautionTags":["back","shoulder"],"traitTags":["core","anti_extension","dynamic"],"preferenceTags":["stability ball","core","sport"]}'::jsonb,true,null),
  ('short-lever-copenhagen-plank','Short-lever Copenhagen plank','short lever copenhagen plank','system',array['Bench']::text[],'core','Bench · same each side · core','{"category":"core","difficultyTier":"foundation","cautionTags":["knee","shoulder"],"traitTags":["core","adductor","isometric","lateral"],"preferenceTags":["bodyweight","core","adductors"]}'::jsonb,true,null),
  ('long-lever-copenhagen-plank','Long-lever Copenhagen plank','long lever copenhagen plank','system',array['Bench']::text[],'core','Bench · same each side · core','{"category":"core","difficultyTier":"intermediate","cautionTags":["knee","shoulder"],"traitTags":["core","adductor","isometric","lateral"],"preferenceTags":["bodyweight","core","adductors"]}'::jsonb,true,null),
  ('side-plank-cable-row','Side plank with cable row','side plank with cable row','system',array['Cable']::text[],'core','Cable · same each side · core','{"category":"core","difficultyTier":"intermediate","cautionTags":["shoulder","back"],"traitTags":["core","anti_rotation","loaded","unilateral"],"preferenceTags":["cable","core","row"]}'::jsonb,true,null),
  ('landmine-rotation','Landmine rotation','landmine rotation','system',array['Barbell','Landmine']::text[],'core','Barbell/Landmine · same each side · core','{"category":"core","difficultyTier":"foundation","cautionTags":["back","shoulder"],"traitTags":["core","rotation","loaded"],"preferenceTags":["barbell","landmine","core","rotation"]}'::jsonb,true,null),
  ('double-front-rack-carry','Double front-rack carry','double front rack carry','system',array['Kettlebell','Dumbbells']::text[],'carry','Kettlebell/Dumbbells · bilateral · carry','{"category":"strength","difficultyTier":"foundation","cautionTags":["back"],"traitTags":["carry","loaded","front_rack","core"],"preferenceTags":["kettlebell","dumbbells","carry","core"]}'::jsonb,true,null),
  ('single-arm-front-rack-carry','Single-arm front-rack carry','single arm front rack carry','system',array['Kettlebell','Dumbbells']::text[],'carry','Kettlebell/Dumbbells · same each side · carry','{"category":"strength","difficultyTier":"foundation","cautionTags":["back"],"traitTags":["carry","loaded","unilateral","anti_lateral_flexion"],"preferenceTags":["kettlebell","dumbbells","carry","core"]}'::jsonb,true,null),
  ('bear-hug-sandbag-carry','Bear-hug sandbag carry','bear hug sandbag carry','system',array['Sandbag']::text[],'carry','Sandbag · bilateral · carry','{"category":"strength","difficultyTier":"foundation","cautionTags":["back"],"traitTags":["carry","loaded","front_loaded"],"preferenceTags":["sandbag","carry","general fitness"]}'::jsonb,true,null),
  ('zercher-carry','Zercher carry','zercher carry','system',array['Barbell']::text[],'carry','Barbell · bilateral · carry','{"category":"strength","difficultyTier":"intermediate","cautionTags":["back"],"traitTags":["carry","loaded","front_loaded"],"preferenceTags":["barbell","carry","core","strength"]}'::jsonb,true,null),
  ('trap-bar-carry','Trap-bar carry','trap bar carry','system',array['Trap bar']::text[],'carry','Trap bar · bilateral · carry','{"category":"strength","difficultyTier":"foundation","cautionTags":["back"],"traitTags":["carry","loaded","grip"],"preferenceTags":["trap bar","carry","grip","strength"]}'::jsonb,true,null),
  ('single-arm-waiter-carry','Single-arm waiter carry','single arm waiter carry','system',array['Kettlebell','Dumbbells']::text[],'carry','Kettlebell/Dumbbells · same each side · carry','{"category":"strength","difficultyTier":"intermediate","cautionTags":["shoulder","overhead","back"],"traitTags":["carry","loaded","unilateral","overhead"],"preferenceTags":["kettlebell","dumbbells","carry","shoulder stability"]}'::jsonb,true,null),
  ('standing-cable-hip-adduction','Standing cable hip adduction','standing cable hip adduction','system',array['Cable','Ankle strap']::text[],'lateral','Cable/Ankle strap · same each side · lateral','{"category":"strength","difficultyTier":"foundation","cautionTags":["knee"],"traitTags":["unilateral","loaded","adductor"],"preferenceTags":["cable","adductors","single leg"]}'::jsonb,true,null),
  ('side-lying-hip-adduction','Side-lying hip adduction','side lying hip adduction','system',array['Bodyweight']::text[],'lateral','Bodyweight · same each side · lateral','{"category":"recovery","difficultyTier":"intro","cautionTags":["knee"],"traitTags":["unilateral","bodyweight","adductor"],"preferenceTags":["bodyweight","adductors","home"]}'::jsonb,true,null),
  ('slider-adductor-slide-out','Slider adductor slide-out','slider adductor slide out','system',array['Sliders']::text[],'lateral','Sliders · same each side · lateral','{"category":"strength","difficultyTier":"intermediate","cautionTags":["knee"],"traitTags":["unilateral","bodyweight","adductor","eccentric"],"preferenceTags":["sliders","adductors","sport"]}'::jsonb,true,null),
  ('single-arm-kettlebell-clean','Single-arm kettlebell clean','single arm kettlebell clean','system',array['Kettlebell']::text[],'power','Kettlebell · same each side · power','{"category":"athletic","difficultyTier":"foundation","cautionTags":["shoulder","back"],"traitTags":["power","loaded","unilateral","kettlebell_skill"],"preferenceTags":["kettlebell","power","single arm"]}'::jsonb,true,null),
  ('double-kettlebell-clean','Double-kettlebell clean','double kettlebell clean','system',array['Kettlebell']::text[],'power','Kettlebell · bilateral · power','{"category":"athletic","difficultyTier":"intermediate","cautionTags":["shoulder","back"],"traitTags":["power","loaded","bilateral","kettlebell_skill"],"preferenceTags":["kettlebell","power","conditioning"]}'::jsonb,true,null),
  ('single-arm-kettlebell-snatch','Single-arm kettlebell snatch','single arm kettlebell snatch','system',array['Kettlebell']::text[],'power','Kettlebell · same each side · power','{"category":"athletic","difficultyTier":"intermediate","cautionTags":["shoulder","overhead","back"],"traitTags":["power","loaded","unilateral","overhead"],"preferenceTags":["kettlebell","power","single arm","overhead"]}'::jsonb,true,null),
  ('turkish-get-up','Turkish get-up','turkish get up','system',array['Kettlebell','Dumbbells']::text[],'core','Kettlebell/Dumbbells · same each side · core','{"category":"athletic","difficultyTier":"intermediate","cautionTags":["shoulder","overhead","back","knee"],"traitTags":["full_body","loaded","unilateral","floor_transfer"],"preferenceTags":["kettlebell","core","shoulder stability"]}'::jsonb,true,null),
  ('barbell-power-clean','Barbell power clean','barbell power clean','system',array['Barbell']::text[],'power','Barbell · bilateral · power','{"category":"athletic","difficultyTier":"intermediate","cautionTags":["back","shoulder","loaded_spine"],"traitTags":["power","higher_load","olympic_derivative"],"preferenceTags":["barbell","power","sport"]}'::jsonb,true,null),
  ('hang-power-clean','Hang power clean','hang power clean','system',array['Barbell']::text[],'power','Barbell · bilateral · power','{"category":"athletic","difficultyTier":"intermediate","cautionTags":["back","shoulder","loaded_spine"],"traitTags":["power","higher_load","olympic_derivative"],"preferenceTags":["barbell","power","sport"]}'::jsonb,true,null),
  ('barbell-clean-pull','Barbell clean pull','barbell clean pull','system',array['Barbell']::text[],'power','Barbell · bilateral · power','{"category":"athletic","difficultyTier":"intermediate","cautionTags":["back","loaded_spine"],"traitTags":["power","higher_load","olympic_derivative"],"preferenceTags":["barbell","power","posterior chain"]}'::jsonb,true,null),
  ('barbell-high-pull','Barbell high pull','barbell high pull','system',array['Barbell']::text[],'power','Barbell · bilateral · power','{"category":"athletic","difficultyTier":"intermediate","cautionTags":["back","shoulder","loaded_spine"],"traitTags":["power","higher_load","olympic_derivative"],"preferenceTags":["barbell","power","upper body"]}'::jsonb,true,null),
  ('dumbbell-hang-power-clean','Dumbbell hang power clean','dumbbell hang power clean','system',array['Dumbbells']::text[],'power','Dumbbells · bilateral · power','{"category":"athletic","difficultyTier":"foundation","cautionTags":["back","shoulder"],"traitTags":["power","loaded","bilateral"],"preferenceTags":["dumbbells","power","sport"]}'::jsonb,true,null),
  ('jump-rope','Jump rope','jump rope','system',array['Jump rope']::text[],'power','Jump rope · bilateral · power','{"category":"cardio","difficultyTier":"foundation","cautionTags":["ankle","knee","impact"],"traitTags":["cardio","elastic","low_setup"],"preferenceTags":["jump rope","cardio","home"]}'::jsonb,true,null),
  ('ski-ergometer','Ski ergometer','ski ergometer','system',array['Ski ergometer']::text[],'run','Ski ergometer · bilateral · run','{"category":"cardio","difficultyTier":"foundation","cautionTags":["shoulder","back"],"traitTags":["cardio","machine","full_body"],"preferenceTags":["ski erg","cardio","conditioning"]}'::jsonb,true,null),
  ('battle-rope-alternating-waves','Battle-rope alternating waves','battle rope alternating waves','system',array['Battle ropes']::text[],'power','Battle ropes · bilateral · power','{"category":"cardio","difficultyTier":"foundation","cautionTags":["shoulder","back"],"traitTags":["cardio","upper_body","interval"],"preferenceTags":["battle ropes","conditioning","upper body"]}'::jsonb,true,null),
  ('battle-rope-slams','Battle-rope slams','battle rope slams','system',array['Battle ropes']::text[],'power','Battle ropes · bilateral · power','{"category":"cardio","difficultyTier":"foundation","cautionTags":["shoulder","overhead","back"],"traitTags":["cardio","full_body","interval"],"preferenceTags":["battle ropes","conditioning","power"]}'::jsonb,true,null),
  ('hand-over-hand-sled-pull','Hand-over-hand sled pull','hand over hand sled pull','system',array['Sled','Rope']::text[],'pull','Sled/Rope · bilateral · pull','{"category":"athletic","difficultyTier":"foundation","cautionTags":["back","shoulder"],"traitTags":["conditioning","loaded","upper_body"],"preferenceTags":["sled","rope","conditioning","pull"]}'::jsonb,true,null)
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
