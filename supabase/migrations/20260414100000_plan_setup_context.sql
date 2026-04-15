alter table public.workout_plans
  add column if not exists setup_context jsonb;
