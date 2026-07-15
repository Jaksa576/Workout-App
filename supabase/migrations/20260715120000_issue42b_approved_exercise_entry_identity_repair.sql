-- Issue #42 Slice 42B/42C: approved exercise-entry canonical identity repair.
-- Hosted status: not applied by Codex. Apply only through the normal Supabase migration flow after approval.

begin;

create temp table issue42b_approved_mappings (
  normalized_name text primary key,
  canonical_id text not null,
  expected_entries integer not null check (expected_entries > 0)
) on commit drop;

insert into issue42b_approved_mappings (normalized_name, canonical_id, expected_entries) values
  ('dead bug','dead-bug',10),
  ('step up','step-up',8),
  ('farmer carry','farmer-carry',7),
  ('side plank','side-plank',7),
  ('dumbbell row','dumbbell-row',5),
  ('lateral shuffle','lateral-shuffle',5),
  ('push up','push-up',5),
  ('calf raise','calf-raise',4),
  ('easy run','easy-run',4),
  ('walking lunge','walking-lunge',4),
  ('bird dog','bird-dog',3),
  ('glute bridge','glute-bridge',3),
  ('reverse lunge','reverse-lunge',3),
  ('band row','band-row',1),
  ('bodyweight squat','bodyweight-squat',1),
  ('box squat','box-squat',1),
  ('lateral lunge','lateral-lunge',1);

create temp table issue42b_entry_candidates on commit drop as
select
  ee.id as exercise_entry_id,
  btrim(regexp_replace(regexp_replace(regexp_replace(lower(btrim(ee.name)), '[''’]', '', 'g'), '[^a-z0-9]+', ' ', 'g'), '\s+', ' ', 'g')) as normalized_name,
  ee.canonical_exercise_id
from public.exercise_entries ee;

create temp table issue42b_system_resolver_candidates on commit drop as
select
  ei.normalized_lookup_key as normalized_name,
  ei.id as canonical_id,
  ei.owner_scope,
  ei.owner_user_id,
  ei.active,
  ei.superseded_by,
  'canonical'::text as resolver_source
from public.exercise_identities ei
where ei.owner_scope = 'system'
union all
select
  ea.normalized_lookup_key as normalized_name,
  ea.exercise_identity_id as canonical_id,
  ei.owner_scope,
  ei.owner_user_id,
  ei.active,
  ei.superseded_by,
  'reviewed_alias'::text as resolver_source
from public.exercise_aliases ea
join public.exercise_identities ei on ei.id = ea.exercise_identity_id
where ea.owner_scope = 'system'
  and ea.reviewed;

create temp table issue42b_repaired_entries (
  exercise_entry_id uuid primary key,
  canonical_exercise_id text not null,
  approved_normalized_name text not null
) on commit drop;

do $$
declare
  approved_groups integer;
  approved_total integer;
  unresolved_total integer;
  already_linked_total integer;
  changed_entries integer;
  changed_results integer;
begin
  select count(*), coalesce(sum(expected_entries), 0)
    into approved_groups, approved_total
  from issue42b_approved_mappings;

  if approved_groups <> 17 or approved_total <> 72 then
    raise exception 'Issue 42B approved mapping invariant failed: groups %, expected total %', approved_groups, approved_total;
  end if;

  if exists (
    select 1
    from issue42b_approved_mappings m
    left join public.exercise_identities ei
      on ei.id = m.canonical_id
     and ei.normalized_lookup_key = m.normalized_name
     and ei.owner_scope = 'system'
     and ei.owner_user_id is null
     and ei.active
     and ei.superseded_by is null
    where ei.id is null
  ) then
    raise exception 'Issue 42B target identity is missing, inactive, superseded, user-owned, or has an unexpected normalized name';
  end if;

  if exists (
    select 1
    from issue42b_approved_mappings m
    left join issue42b_system_resolver_candidates c
      on c.normalized_name = m.normalized_name
     and c.active
     and c.superseded_by is null
     and c.owner_scope = 'system'
     and c.owner_user_id is null
    group by m.normalized_name, m.canonical_id
    having count(distinct c.canonical_id) <> 1 or max(c.canonical_id) <> m.canonical_id
  ) then
    raise exception 'Issue 42B approved normalized name does not resolve through the combined canonical/alias namespace to exactly one active system target';
  end if;

  if exists (
    select 1
    from issue42b_approved_mappings m
    join issue42b_system_resolver_candidates c on c.normalized_name = m.normalized_name
    where c.owner_scope <> 'system'
       or c.owner_user_id is not null
       or not c.active
       or c.superseded_by is not null
  ) then
    raise exception 'Issue 42B approved normalized name has an inactive, superseded, or user-owned resolver target';
  end if;

  if exists (
    select 1
    from issue42b_approved_mappings m
    join issue42b_entry_candidates ec on ec.normalized_name = m.normalized_name
    join public.exercise_identities ei on ei.id = ec.canonical_exercise_id
    where ei.owner_scope = 'user'
  ) then
    raise exception 'Issue 42B approved rows include an explicit user-owned canonical identity';
  end if;

  select count(*) into unresolved_total
  from issue42b_entry_candidates ec
  join issue42b_approved_mappings m on m.normalized_name = ec.normalized_name
  where ec.canonical_exercise_id is null;

  select count(*) into already_linked_total
  from issue42b_entry_candidates ec
  join issue42b_approved_mappings m
    on m.normalized_name = ec.normalized_name
   and ec.canonical_exercise_id = m.canonical_id;

  if unresolved_total = approved_total then
    if exists (
      select 1
      from issue42b_approved_mappings m
      left join issue42b_entry_candidates ec
        on ec.normalized_name = m.normalized_name
       and ec.canonical_exercise_id is null
      group by m.normalized_name, m.expected_entries
      having count(ec.exercise_entry_id) <> m.expected_entries
    ) then
      raise exception 'Issue 42B per-group unresolved candidate count mismatch';
    end if;

    if exists (
      select 1
      from issue42b_entry_candidates ec
      join issue42b_approved_mappings m on m.normalized_name = ec.normalized_name
      where ec.canonical_exercise_id is not null
        and ec.canonical_exercise_id <> m.canonical_id
    ) then
      raise exception 'Issue 42B wrong-target partial state detected for approved rows';
    end if;

    with repaired as (
      update public.exercise_entries ee
         set canonical_exercise_id = m.canonical_id
        from issue42b_entry_candidates ec
        join issue42b_approved_mappings m on m.normalized_name = ec.normalized_name
       where ee.id = ec.exercise_entry_id
         and ec.canonical_exercise_id is null
       returning ee.id as exercise_entry_id, ee.canonical_exercise_id, m.normalized_name
    )
    insert into issue42b_repaired_entries (exercise_entry_id, canonical_exercise_id, approved_normalized_name)
    select exercise_entry_id, canonical_exercise_id, normalized_name
    from repaired;
    get diagnostics changed_entries = row_count;

    if changed_entries <> approved_total then
      raise exception 'Issue 42B changed % entries, expected %', changed_entries, approved_total;
    end if;

    update public.exercise_results er
       set canonical_exercise_id = repaired.canonical_exercise_id
      from issue42b_repaired_entries repaired
     where er.exercise_entry_id = repaired.exercise_entry_id
       and er.canonical_exercise_id is null;
    get diagnostics changed_results = row_count;

    raise notice 'Issue 42B repaired % exercise_entries and % deterministic exercise_results scoped to repaired entry IDs', changed_entries, changed_results;
  elsif unresolved_total = 0 and already_linked_total = approved_total then
    if exists (select 1 from issue42b_repaired_entries) then
      raise exception 'Issue 42B idempotent rerun unexpectedly captured repaired entries';
    end if;
    raise notice 'Issue 42B repair already applied; zero additional exercise_entries and zero exercise_results changed';
  else
    raise exception 'Issue 42B candidate state mismatch: unresolved %, already linked %, approved total %', unresolved_total, already_linked_total, approved_total;
  end if;
end $$;

commit;
