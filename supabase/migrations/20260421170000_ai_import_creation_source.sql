alter table public.workout_plans
  drop constraint if exists workout_plans_creation_source_check;

alter table public.workout_plans
  add constraint workout_plans_creation_source_check check (
    creation_source is null or
    creation_source in ('manual', 'guided_template', 'llm_draft', 'ai_import')
  );
