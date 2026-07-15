-- Issue #40 canonical exercise identity readonly audit.
-- This script is read-only and may be run after the migration in a disposable/local or authorized target database.

with catalog_exercises(id, display_name) as (
  values
    ('bodyweight-squat', 'Bodyweight squat'),
    ('box-squat', 'Box squat'),
    ('goblet-squat', 'Goblet squat'),
    ('barbell-back-squat', 'Barbell back squat'),
    ('romanian-deadlift', 'Romanian deadlift'),
    ('hip-hinge-drill', 'Hip hinge drill'),
    ('glute-bridge', 'Glute bridge'),
    ('reverse-lunge', 'Reverse lunge'),
    ('step-up', 'Step-up'),
    ('walking-lunge', 'Walking lunge'),
    ('incline-push-up', 'Incline push-up'),
    ('push-up', 'Push-up'),
    ('dumbbell-floor-press', 'Dumbbell floor press'),
    ('dumbbell-shoulder-press', 'Dumbbell shoulder press'),
    ('band-row', 'Band row'),
    ('dumbbell-row', 'Dumbbell row'),
    ('farmer-carry', 'Farmer carry'),
    ('dead-bug', 'Dead bug'),
    ('side-plank', 'Side plank'),
    ('bird-dog', 'Bird dog'),
    ('dumbbell-lateral-raise', 'Dumbbell lateral raise'),
    ('dumbbell-curl', 'Dumbbell curl'),
    ('calf-raise', 'Calf raise'),
    ('tibialis-raise', 'Tibialis raise'),
    ('hip-flexor-rockback', 'Hip flexor rockback'),
    ('thoracic-rotation', 'Thoracic rotation'),
    ('ankle-rock', 'Ankle rock'),
    ('brisk-walk', 'Brisk walk'),
    ('low-impact-cardio-march', 'Low-impact cardio march'),
    ('run-walk-intervals', 'Run/walk intervals'),
    ('easy-run', 'Easy run'),
    ('stride-drills', 'Stride drills'),
    ('lateral-lunge', 'Lateral lunge'),
    ('lateral-shuffle', 'Lateral shuffle'),
    ('skater-hop', 'Skater hop')
)
select 'missing_catalog_identity_rows' as check_name, c.id, c.display_name
from catalog_exercises c
left join public.exercise_identities i on i.id = c.id and i.owner_scope = 'system'
where i.id is null
order by c.id;

with catalog_exercises(id, display_name) as (
  values
    ('bodyweight-squat', 'Bodyweight squat'),
    ('box-squat', 'Box squat'),
    ('goblet-squat', 'Goblet squat'),
    ('barbell-back-squat', 'Barbell back squat'),
    ('romanian-deadlift', 'Romanian deadlift'),
    ('hip-hinge-drill', 'Hip hinge drill'),
    ('glute-bridge', 'Glute bridge'),
    ('reverse-lunge', 'Reverse lunge'),
    ('step-up', 'Step-up'),
    ('walking-lunge', 'Walking lunge'),
    ('incline-push-up', 'Incline push-up'),
    ('push-up', 'Push-up'),
    ('dumbbell-floor-press', 'Dumbbell floor press'),
    ('dumbbell-shoulder-press', 'Dumbbell shoulder press'),
    ('band-row', 'Band row'),
    ('dumbbell-row', 'Dumbbell row'),
    ('farmer-carry', 'Farmer carry'),
    ('dead-bug', 'Dead bug'),
    ('side-plank', 'Side plank'),
    ('bird-dog', 'Bird dog'),
    ('dumbbell-lateral-raise', 'Dumbbell lateral raise'),
    ('dumbbell-curl', 'Dumbbell curl'),
    ('calf-raise', 'Calf raise'),
    ('tibialis-raise', 'Tibialis raise'),
    ('hip-flexor-rockback', 'Hip flexor rockback'),
    ('thoracic-rotation', 'Thoracic rotation'),
    ('ankle-rock', 'Ankle rock'),
    ('brisk-walk', 'Brisk walk'),
    ('low-impact-cardio-march', 'Low-impact cardio march'),
    ('run-walk-intervals', 'Run/walk intervals'),
    ('easy-run', 'Easy run'),
    ('stride-drills', 'Stride drills'),
    ('lateral-lunge', 'Lateral lunge'),
    ('lateral-shuffle', 'Lateral shuffle'),
    ('skater-hop', 'Skater hop')
)
select 'seeded_catalog_id_not_in_current_catalog' as check_name, i.id, i.display_name
from public.exercise_identities i
left join catalog_exercises c on c.id = i.id
where i.owner_scope = 'system'
  and i.metadata ? 'category'
  and c.id is null
order by i.id;

select 'catalog_backed_entries_missing_or_invalid_canonical_id' as check_name, ee.id, ee.name, ee.source_exercise_id, ee.canonical_exercise_id
from public.exercise_entries ee
where ee.source_exercise_id is not null
  and exists (select 1 from public.exercise_identities i where i.id = ee.source_exercise_id and i.owner_scope = 'system')
  and (ee.canonical_exercise_id is null or ee.canonical_exercise_id <> ee.source_exercise_id)
order by ee.name, ee.id;

select 'completed_results_missing_canonical_id_from_source_entry' as check_name, er.id, er.exercise_entry_id, er.source_exercise_id, ee.canonical_exercise_id as source_entry_canonical_id
from public.exercise_results er
join public.exercise_entries ee on ee.id = er.exercise_entry_id
where ee.canonical_exercise_id is not null
  and er.canonical_exercise_id is null
order by er.created_at desc, er.id;

select 'ambiguous_reviewed_aliases' as check_name, normalized_lookup_key, count(distinct exercise_identity_id) as identity_count
from public.exercise_aliases
where reviewed
  and owner_scope = 'system'
group by normalized_lookup_key
having count(distinct exercise_identity_id) > 1
order by identity_count desc, normalized_lookup_key;

select 'reviewed_alias_targets_missing_seeded_identity' as check_name, a.alias, a.normalized_lookup_key, a.exercise_identity_id
from public.exercise_aliases a
left join public.exercise_identities i on i.id = a.exercise_identity_id and i.owner_scope = 'system'
where a.reviewed
  and a.owner_scope = 'system'
  and i.id is null
order by a.normalized_lookup_key, a.alias;

select 'ownership_scope_conflicts' as check_name, id, display_name, owner_scope, owner_user_id
from public.exercise_identities
where (owner_scope = 'system' and owner_user_id is not null)
   or (owner_scope = 'user' and owner_user_id is null)
order by owner_scope, display_name;

select 'alias_ownership_scope_conflicts' as check_name, id, alias, owner_scope, owner_user_id
from public.exercise_aliases
where (owner_scope = 'system' and owner_user_id is not null)
   or (owner_scope = 'user' and owner_user_id is null)
order by owner_scope, alias;

select 'custom_or_unresolved_exercise_entries' as informational_check_name, count(*) as valid_unresolved_or_custom_count
from public.exercise_entries ee
where ee.canonical_exercise_id is null
  and (ee.source_exercise_id is null or not exists (select 1 from public.exercise_identities i where i.id = ee.source_exercise_id and i.owner_scope = 'system'));

select table_name, row_security
from information_schema.tables
where table_schema = 'public'
  and table_name in ('exercise_identities','exercise_aliases')
order by table_name;
