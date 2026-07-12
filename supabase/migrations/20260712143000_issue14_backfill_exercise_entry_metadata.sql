-- Issue #14 metadata backfill for active exercise_entries that still carry the safe completion fallback.
-- Hosted status: not applied by Codex. Review, apply to the target Supabase environment, then run verification.

with reviewed_mapping(source_exercise_id, normalized_name, reps_regex, tracking_type, unilateral_mode, load_unit, distance_unit, primary_value_label, secondary_value_label, review_group) as (
  values
    ('goblet-squat', null, null, 'weight_reps', 'bilateral', 'lb', null, 'Load', 'Reps', 'safe_auto'),
    ('barbell-back-squat', null, null, 'weight_reps', 'bilateral', 'lb', null, 'Load', 'Reps', 'safe_auto'),
    ('romanian-deadlift', null, null, 'weight_reps', 'bilateral', 'lb', null, 'Load', 'Reps', 'safe_auto'),
    ('dumbbell-floor-press', null, null, 'weight_reps', 'bilateral', 'lb', null, 'Load', 'Reps', 'safe_auto'),
    ('dumbbell-shoulder-press', null, null, 'weight_reps', 'bilateral', 'lb', null, 'Load', 'Reps', 'safe_auto'),
    ('dumbbell-row', null, null, 'weight_reps', 'same_each_side', 'lb', null, 'Load', 'Reps', 'safe_auto'),
    ('farmer-carry', null, null, 'weight_reps', 'bilateral', 'lb', null, 'Load', 'Reps', 'safe_auto'),
    ('dumbbell-lateral-raise', null, null, 'weight_reps', 'bilateral', 'lb', null, 'Load', 'Reps', 'safe_auto'),
    ('dumbbell-curl', null, null, 'weight_reps', 'bilateral', 'lb', null, 'Load', 'Reps', 'safe_auto'),
    ('lateral-lunge', null, null, 'weight_reps', 'same_each_side', 'lb', null, 'Load', 'Reps', 'safe_auto'),
    ('bodyweight-squat', null, null, 'reps_only', 'bilateral', null, null, 'Reps', null, 'safe_auto'),
    ('box-squat', null, null, 'reps_only', 'bilateral', null, null, 'Reps', null, 'safe_auto'),
    ('hip-hinge-drill', null, null, 'reps_only', 'bilateral', null, null, 'Reps', null, 'safe_auto'),
    ('glute-bridge', null, null, 'reps_only', 'bilateral', null, null, 'Reps', null, 'safe_auto'),
    ('reverse-lunge', null, null, 'reps_only', 'same_each_side', null, null, 'Reps', null, 'safe_auto'),
    ('step-up', null, null, 'reps_only', 'same_each_side', null, null, 'Reps', null, 'safe_auto'),
    ('walking-lunge', null, null, 'reps_only', 'same_each_side', null, null, 'Reps', null, 'safe_auto'),
    ('incline-push-up', null, null, 'reps_only', 'bilateral', null, null, 'Reps', null, 'safe_auto'),
    ('push-up', null, null, 'reps_only', 'bilateral', null, null, 'Reps', null, 'safe_auto'),
    ('band-row', null, null, 'reps_only', 'bilateral', null, null, 'Reps', null, 'safe_auto'),
    ('dead-bug', null, null, 'reps_only', 'same_each_side', null, null, 'Reps', null, 'safe_auto'),
    ('bird-dog', null, null, 'reps_only', 'same_each_side', null, null, 'Reps', null, 'safe_auto'),
    ('calf-raise', null, null, 'reps_only', 'bilateral', null, null, 'Reps', null, 'safe_auto'),
    ('tibialis-raise', null, null, 'reps_only', 'bilateral', null, null, 'Reps', null, 'safe_auto'),
    ('hip-flexor-rockback', null, null, 'reps_only', 'same_each_side', null, null, 'Reps', null, 'safe_auto'),
    ('thoracic-rotation', null, null, 'reps_only', 'same_each_side', null, null, 'Reps', null, 'safe_auto'),
    ('ankle-rock', null, null, 'reps_only', 'same_each_side', null, null, 'Reps', null, 'safe_auto'),
    ('skater-hop', null, null, 'reps_only', 'same_each_side', null, null, 'Reps', null, 'safe_auto'),
    ('side-plank', null, null, 'duration', 'same_each_side', null, null, 'Duration', null, 'safe_auto'),
    ('low-impact-cardio-march', null, null, 'duration', 'bilateral', null, null, 'Duration', null, 'safe_auto'),
    ('run-walk-intervals', null, null, 'duration', 'bilateral', null, null, 'Duration', null, 'safe_auto'),
    ('stride-drills', null, null, 'duration', 'bilateral', null, null, 'Duration', null, 'safe_auto'),
    ('lateral-shuffle', null, null, 'duration', 'bilateral', null, null, 'Duration', null, 'safe_auto'),
    ('brisk-walk', null, null, 'distance_duration', 'bilateral', null, 'mi', 'Distance', 'Duration', 'safe_auto'),
    ('easy-run', null, null, 'distance_duration', 'bilateral', null, 'mi', 'Distance', 'Duration', 'safe_auto'),
    (null, 'hamstring bridge hold', '^\d+\s*(sec|secs|second|seconds|s)\b', 'duration', 'bilateral', null, null, 'Duration', null, 'explicit_reviewed'),
    (null, 'lateral band walk', '^\d+\s*(per side|each side|steps each way|steps per side)\b', 'reps_only', 'same_each_side', null, null, 'Reps', null, 'explicit_reviewed'),
    (null, 'half kneeling hip flexor stretch', '^\d+\s*(sec|secs|second|seconds|s)\s*(per side|each side)\b', 'duration', 'same_each_side', null, null, 'Duration', null, 'explicit_reviewed'),
    (null, 'dead bug', '^\d+\s*(per side|each side)\b', 'reps_only', 'same_each_side', null, null, 'Reps', null, 'explicit_reviewed')
), candidates as (
  select ee.id, m.*
  from public.exercise_entries ee
  join reviewed_mapping m on (
    (m.source_exercise_id is not null and nullif(ee.source_exercise_id, '') = m.source_exercise_id)
    or (
      m.normalized_name is not null
      and lower(trim(regexp_replace(ee.name, '[^a-zA-Z0-9]+', ' ', 'g'))) = m.normalized_name
      and (m.reps_regex is null or ee.reps ~* m.reps_regex)
    )
  )
  where ee.tracking_type = 'completion'
    and ee.unilateral_mode = 'bilateral'
    and ee.load_unit is null
    and ee.distance_unit is null
)
update public.exercise_entries ee
set tracking_type = candidates.tracking_type,
    unilateral_mode = candidates.unilateral_mode,
    load_unit = candidates.load_unit,
    distance_unit = candidates.distance_unit,
    primary_value_label = candidates.primary_value_label,
    secondary_value_label = candidates.secondary_value_label
from candidates
where ee.id = candidates.id;
