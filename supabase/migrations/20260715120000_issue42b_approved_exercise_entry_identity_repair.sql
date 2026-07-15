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
    join public.exercise_identities ei
      on ei.normalized_lookup_key = m.normalized_name
     and ei.owner_scope = 'system'
     and ei.active
     and ei.superseded_by is null
    group by m.normalized_name
    having count(*) <> 1 or max(ei.id) <> max(m.canonical_id)
  ) then
    raise exception 'Issue 42B approved normalized name does not resolve to exactly one active system target';
  end if;

  if exists (
    select 1
    from issue42b_approved_mappings m
    join public.exercise_aliases ea
      on ea.normalized_lookup_key = m.normalized_name
     and ea.owner_scope = 'system'
     and ea.reviewed
    join public.exercise_identities ei
      on ei.id = ea.exercise_identity_id
     and ei.owner_scope = 'system'
     and ei.active
     and ei.superseded_by is null
    group by m.normalized_name
    having count(distinct ei.id) > 1
  ) then
    raise exception 'Issue 42B approved normalized name has ambiguous reviewed aliases';
  end if;

  if exists (
    select 1
    from issue42b_approved_mappings m
    join public.exercise_entries ee on lower(trim(regexp_replace(regexp_replace(ee.name, '[''’]', '', 'g'), '[^a-zA-Z0-9]+', ' ', 'g'))) = m.normalized_name
    join public.exercise_identities ei on ei.id = ee.canonical_exercise_id
    where ei.owner_scope = 'user'
  ) then
    raise exception 'Issue 42B approved rows include an explicit user-owned canonical identity';
  end if;

  select count(*) into unresolved_total
  from public.exercise_entries ee
  join issue42b_approved_mappings m
    on lower(trim(regexp_replace(regexp_replace(ee.name, '[''’]', '', 'g'), '[^a-zA-Z0-9]+', ' ', 'g'))) = m.normalized_name
  where ee.canonical_exercise_id is null;

  select count(*) into already_linked_total
  from public.exercise_entries ee
  join issue42b_approved_mappings m
    on lower(trim(regexp_replace(regexp_replace(ee.name, '[''’]', '', 'g'), '[^a-zA-Z0-9]+', ' ', 'g'))) = m.normalized_name
   and ee.canonical_exercise_id = m.canonical_id;

  if unresolved_total = approved_total then
    if exists (
      select 1
      from issue42b_approved_mappings m
      left join public.exercise_entries ee
        on lower(trim(regexp_replace(regexp_replace(ee.name, '[''’]', '', 'g'), '[^a-zA-Z0-9]+', ' ', 'g'))) = m.normalized_name
       and ee.canonical_exercise_id is null
      group by m.normalized_name, m.expected_entries
      having count(ee.id) <> m.expected_entries
    ) then
      raise exception 'Issue 42B per-group unresolved candidate count mismatch';
    end if;

    update public.exercise_entries ee
       set canonical_exercise_id = m.canonical_id
      from issue42b_approved_mappings m
     where lower(trim(regexp_replace(regexp_replace(ee.name, '[''’]', '', 'g'), '[^a-zA-Z0-9]+', ' ', 'g'))) = m.normalized_name
       and ee.canonical_exercise_id is null;
    get diagnostics changed_entries = row_count;

    if changed_entries <> approved_total then
      raise exception 'Issue 42B changed % entries, expected %', changed_entries, approved_total;
    end if;

    update public.exercise_results er
       set canonical_exercise_id = ee.canonical_exercise_id
      from public.exercise_entries ee
      join issue42b_approved_mappings m on m.canonical_id = ee.canonical_exercise_id
     where er.exercise_entry_id = ee.id
       and er.canonical_exercise_id is null;
    get diagnostics changed_results = row_count;

    raise notice 'Issue 42B repaired % exercise_entries and % deterministic exercise_results', changed_entries, changed_results;
  elsif unresolved_total = 0 and already_linked_total = approved_total then
    raise notice 'Issue 42B repair already applied; zero additional exercise_entries changed';
  else
    raise exception 'Issue 42B candidate state mismatch: unresolved %, already linked %, approved total %', unresolved_total, already_linked_total, approved_total;
  end if;
end $$;

commit;
