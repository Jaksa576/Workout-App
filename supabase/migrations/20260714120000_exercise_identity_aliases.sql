-- Issue #40 follow-up: additive canonical exercise identity and reviewed alias foundation.
-- Hosted status: not applied by Codex. Apply only through the normal Supabase migration flow.

create table if not exists public.exercise_identities (
  id text primary key,
  display_name text not null,
  normalized_lookup_key text not null,
  owner_scope text not null default 'system' check (owner_scope in ('system','user')),
  owner_user_id uuid references auth.users(id) on delete cascade,
  equipment_tags text[] not null default '{}',
  movement_pattern text,
  qualifier_text text,
  metadata jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  superseded_by text references public.exercise_identities(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((owner_scope = 'system' and owner_user_id is null) or (owner_scope = 'user' and owner_user_id is not null)),
  check (superseded_by is null or superseded_by <> id)
);

create table if not exists public.exercise_aliases (
  id uuid primary key default gen_random_uuid(),
  exercise_identity_id text not null references public.exercise_identities(id) on delete cascade,
  alias text not null,
  normalized_lookup_key text not null,
  owner_scope text not null default 'system' check (owner_scope in ('system','user')),
  owner_user_id uuid references auth.users(id) on delete cascade,
  reviewed boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((owner_scope = 'system' and owner_user_id is null) or (owner_scope = 'user' and owner_user_id is not null))
);

alter table public.exercise_entries add column if not exists canonical_exercise_id text references public.exercise_identities(id) on delete set null;
alter table public.exercise_results add column if not exists canonical_exercise_id text references public.exercise_identities(id) on delete set null;

create unique index if not exists exercise_identities_system_lookup_unique on public.exercise_identities(normalized_lookup_key) where owner_scope = 'system' and active;
create index if not exists exercise_identities_user_lookup_idx on public.exercise_identities(owner_user_id, normalized_lookup_key) where owner_scope = 'user' and active;
create unique index if not exists exercise_aliases_system_reviewed_unique on public.exercise_aliases(normalized_lookup_key) where owner_scope = 'system' and reviewed;
create index if not exists exercise_aliases_user_reviewed_idx on public.exercise_aliases(owner_user_id, normalized_lookup_key) where owner_scope = 'user' and reviewed;
create index if not exists exercise_entries_canonical_exercise_id_idx on public.exercise_entries(canonical_exercise_id) where canonical_exercise_id is not null;
create index if not exists exercise_results_canonical_exercise_id_idx on public.exercise_results(canonical_exercise_id) where canonical_exercise_id is not null;

insert into public.exercise_identities (id, display_name, normalized_lookup_key, owner_scope, equipment_tags, movement_pattern, qualifier_text)
values
  ('push-up','Push-up','push up','system',array['Bodyweight'],'push','Bodyweight · bilateral · push'),
  ('romanian-deadlift','Romanian deadlift','romanian deadlift','system',array['Dumbbells','Barbell'],'hinge','Dumbbells/Barbell · bilateral · hinge'),
  ('bodyweight-squat','Bodyweight squat','bodyweight squat','system',array['Bodyweight'],'squat','Bodyweight · bilateral · squat'),
  ('box-squat','Box squat','box squat','system',array['Bodyweight','Bench'],'squat','Bodyweight/Bench · bilateral · squat'),
  ('dumbbell-row','Dumbbell row','dumbbell row','system',array['Dumbbells'],'pull','Dumbbells · same each side · pull')
on conflict (id) do update set
  display_name = excluded.display_name,
  normalized_lookup_key = excluded.normalized_lookup_key,
  equipment_tags = excluded.equipment_tags,
  movement_pattern = excluded.movement_pattern,
  qualifier_text = excluded.qualifier_text,
  updated_at = now();

insert into public.exercise_aliases (exercise_identity_id, alias, normalized_lookup_key, owner_scope, reviewed)
values
  ('push-up','Push Up','push up','system',true),
  ('push-up','Pushup','pushup','system',true),
  ('romanian-deadlift','RDL','rdl','system',true),
  ('romanian-deadlift','Romanian dead lift','romanian dead lift','system',true),
  ('bodyweight-squat','Air squat','air squat','system',true),
  ('dumbbell-row','DB row','db row','system',true)
on conflict do nothing;

update public.exercise_entries
set canonical_exercise_id = source_exercise_id
where source_exercise_id in (select id from public.exercise_identities)
  and canonical_exercise_id is null;

update public.exercise_results
set canonical_exercise_id = source_exercise_id
where source_exercise_id in (select id from public.exercise_identities)
  and canonical_exercise_id is null;
