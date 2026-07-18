-- Prerequisite for the merged PR #77 domain-video cleanup migration.
-- Hosted status: not applied by Codex. Apply only through the normal Supabase migration flow.
--
-- The following 20260718120000 migration supersedes hip-flexor-rockback to
-- half-kneeling-hip-flexor-stretch before it inserts that replacement identity.
-- Seed the replacement identity first so the superseded_by foreign key is valid
-- on clean migration runs while preserving the already-merged migration file.

do $$
begin
  if exists (
    select 1
    from public.exercise_identities
    where id = 'half-kneeling-hip-flexor-stretch'
      and owner_scope <> 'system'
  ) then
    raise exception 'Cannot seed system exercise identity half-kneeling-hip-flexor-stretch because a non-system-owned identity with that id already exists';
  end if;
end $$;

insert into public.exercise_identities (
  id,
  display_name,
  normalized_lookup_key,
  owner_scope,
  equipment_tags,
  movement_pattern,
  qualifier_text,
  metadata,
  active,
  superseded_by
)
values (
  'half-kneeling-hip-flexor-stretch',
  'Half-kneeling hip flexor stretch',
  'half kneeling hip flexor stretch',
  'system',
  array['Bodyweight']::text[],
  'mobility',
  'Bodyweight · same each side · mobility',
  '{"category":"mobility","difficultyTier":"intro","cautionTags":[],"traitTags":["mobility","low_load"],"preferenceTags":["bodyweight","mobility","hips"]}'::jsonb,
  true,
  null
)
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
