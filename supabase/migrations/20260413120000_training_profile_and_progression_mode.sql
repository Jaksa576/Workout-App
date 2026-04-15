alter table public.profiles
  add column if not exists goal_notes text;

alter table public.profiles
  add column if not exists primary_goal_type text check (
    primary_goal_type is null or
    primary_goal_type in (
      'recovery',
      'general_fitness',
      'strength',
      'hypertrophy',
      'running',
      'sport_performance',
      'consistency'
    )
  );

alter table public.profiles
  add column if not exists limitations_detail text;

alter table public.profiles
  add column if not exists age integer check (age is null or (age between 13 and 120));

alter table public.profiles
  add column if not exists weight numeric(6,2) check (weight is null or weight > 0);

alter table public.profiles
  add column if not exists training_experience text check (
    training_experience is null or
    training_experience in ('new', 'returning', 'intermediate', 'advanced')
  );

alter table public.profiles
  add column if not exists activity_level text check (
    activity_level is null or
    activity_level in ('mostly_sedentary', 'lightly_active', 'moderately_active', 'very_active')
  );

alter table public.profiles
  add column if not exists training_environment text check (
    training_environment is null or
    training_environment in ('home', 'gym', 'outdoors', 'mixed')
  );

alter table public.profiles
  add column if not exists exercise_preferences text[] not null default '{}';

alter table public.profiles
  add column if not exists exercise_dislikes text[] not null default '{}';

alter table public.profiles
  add column if not exists sports_interests text[] not null default '{}';

alter table public.workout_plans
  add column if not exists goal_type text check (
    goal_type is null or
    goal_type in (
      'recovery',
      'general_fitness',
      'strength',
      'hypertrophy',
      'running',
      'sport_performance',
      'consistency'
    )
  );

alter table public.workout_plans
  add column if not exists progression_mode text check (
    progression_mode is null or
    progression_mode in ('symptom_based', 'adherence_based', 'performance_based', 'hybrid')
  );

alter table public.workout_plans
  add column if not exists creation_source text check (
    creation_source is null or
    creation_source in ('manual', 'guided_template', 'llm_draft')
  );

alter table public.exercise_entries
  add column if not exists source_exercise_id text;

update public.profiles
set primary_goal_type = case
  when lower(goal) ~ '\m(rehab|prehab|recover|recovery|injury|pain)\M'
    then 'recovery'
  when lower(goal) ~ '\m(run|running|runner|5k|10k|marathon)\M'
    then 'running'
  when lower(goal) ~ '\m(hypertrophy|muscle|bodybuilding)\M'
    then 'hypertrophy'
  when lower(goal) ~ '\m(strength|strong|powerlifting)\M'
    then 'strength'
  when lower(goal) ~ '\m(sport|sports|athletic|athlete|performance)\M'
    then 'sport_performance'
  when lower(goal) ~ '\m(consistency|consistent)\M'
    then 'consistency'
  when lower(goal) like '%general fitness%' or lower(goal) ~ '\mfitness\M'
    then 'general_fitness'
  else primary_goal_type
end
where primary_goal_type is null
  and (
    lower(goal) ~ '\m(rehab|prehab|recover|recovery|injury|pain)\M' or
    lower(goal) ~ '\m(run|running|runner|5k|10k|marathon)\M' or
    lower(goal) ~ '\m(hypertrophy|muscle|bodybuilding)\M' or
    lower(goal) ~ '\m(strength|strong|powerlifting)\M' or
    lower(goal) ~ '\m(sport|sports|athletic|athlete|performance)\M' or
    lower(goal) ~ '\m(consistency|consistent)\M' or
    lower(goal) like '%general fitness%' or
    lower(goal) ~ '\mfitness\M'
  );
