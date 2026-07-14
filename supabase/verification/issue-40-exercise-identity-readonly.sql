-- Issue #40 canonical exercise identity readonly audit.

select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('exercise_identities','exercise_aliases','exercise_entries','exercise_results')
  and column_name in ('id','exercise_identity_id','canonical_exercise_id','display_name','normalized_lookup_key','owner_scope','owner_user_id','reviewed','active','superseded_by')
order by table_name, ordinal_position;

select normalized_lookup_key, count(*) as active_identity_count
from public.exercise_identities
where active
group by normalized_lookup_key
having count(*) > 1
order by active_identity_count desc, normalized_lookup_key;

select normalized_lookup_key, count(distinct exercise_identity_id) as identity_count
from public.exercise_aliases
where reviewed
group by normalized_lookup_key
having count(distinct exercise_identity_id) > 1
order by identity_count desc, normalized_lookup_key;

select id, display_name, owner_scope
from public.exercise_identities i
where active
  and not exists (select 1 from public.exercise_aliases a where a.exercise_identity_id = i.id and a.reviewed)
order by owner_scope, display_name;

select count(*) as unresolved_active_exercise_entries
from public.exercise_entries
where canonical_exercise_id is null;

select ee.name, ee.source_exercise_id, ee.canonical_exercise_id, count(*) as entry_count
from public.exercise_entries ee
where ee.canonical_exercise_id is null
  and exists (
    select 1
    from public.exercise_identities i
    where i.normalized_lookup_key = lower(regexp_replace(trim(ee.name), '[^a-zA-Z0-9]+', ' ', 'g'))
  )
group by ee.name, ee.source_exercise_id, ee.canonical_exercise_id
order by entry_count desc, ee.name;

select owner_scope, owner_user_id, normalized_lookup_key, count(*) as identity_count
from public.exercise_identities
where active
group by owner_scope, owner_user_id, normalized_lookup_key
having count(*) > 1
order by identity_count desc, normalized_lookup_key;
