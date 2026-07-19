-- Issue #81 follow-up read-only verification. Run only after the additive
-- indeterminate-success migration. This script performs no data writes.

do $$
declare
  v_columns text[];
  v_status_constraint text;
  v_reserve oid := to_regprocedure('public.reserve_ai_generation_attempt(uuid,integer,integer,text)');
  v_complete oid := to_regprocedure('public.complete_ai_generation_attempt(uuid,uuid,text)');
  v_reserve_definition text;
  v_complete_definition text;
begin
  if to_regclass('public.ai_generation_attempts') is null then
    raise exception 'missing public.ai_generation_attempts';
  end if;

  if not exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'ai_generation_attempts' and c.relrowsecurity
  ) then raise exception 'RLS is not enabled on ai_generation_attempts'; end if;

  select array_agg(column_name order by ordinal_position) into v_columns
  from information_schema.columns
  where table_schema = 'public' and table_name = 'ai_generation_attempts';

  if v_columns && array[
    'prompt', 'raw_prompt', 'response', 'raw_response', 'provider_response',
    'api_key', 'generated_plan', 'plan_contents', 'setup_text'
  ] then raise exception 'forbidden sensitive/generated columns exist: %', v_columns; end if;

  select pg_get_constraintdef(oid) into v_status_constraint
  from pg_constraint
  where conrelid = 'public.ai_generation_attempts'::regclass
    and conname = 'ai_generation_attempts_status_check';

  if v_status_constraint is null or
     lower(v_status_constraint) not like '%indeterminate_success%' then
    raise exception 'indeterminate success status constraint is missing';
  end if;

  if v_reserve is null or v_complete is null then
    raise exception 'required quota functions are missing';
  end if;

  if not exists (
    select 1 from pg_proc where oid = v_reserve and prosecdef
      and proconfig @> array['search_path=public, pg_temp']
  ) or not exists (
    select 1 from pg_proc where oid = v_complete and prosecdef
      and proconfig @> array['search_path=public, pg_temp']
  ) then raise exception 'quota function security/search_path mismatch'; end if;

  if has_function_privilege('authenticated', v_reserve, 'EXECUTE') or
     has_function_privilege('anon', v_reserve, 'EXECUTE') or
     has_function_privilege('authenticated', v_complete, 'EXECUTE') or
     has_function_privilege('anon', v_complete, 'EXECUTE') then
    raise exception 'quota functions are callable by public API roles';
  end if;
  if not has_function_privilege('service_role', v_reserve, 'EXECUTE') or
     not has_function_privilege('service_role', v_complete, 'EXECUTE') then
    raise exception 'service_role function grants are missing';
  end if;

  v_reserve_definition := lower(pg_get_functiondef(v_reserve));
  v_complete_definition := lower(pg_get_functiondef(v_complete));

  if v_reserve_definition not like '%pg_advisory_xact_lock%' or
     v_reserve_definition not like '%at time zone ''utc''%' or
     v_reserve_definition not like '%set status = ''indeterminate_success''%' or
     v_reserve_definition not like '%status in (''reserved'', ''succeeded'', ''indeterminate_success'')%' then
    raise exception 'reservation function is missing conservative success-capacity behavior';
  end if;

  if v_complete_definition not like '%''indeterminate_success''%' or
     v_complete_definition not like '%v_status = ''succeeded'' and p_outcome = ''indeterminate_success''%' then
    raise exception 'completion function is missing uncertain-success behavior';
  end if;

  if v_reserve_definition similar to '%(workout_plans|plan_phases|workout_templates|exercise_entries|workout_sessions|exercise_results|exercise_set_results|progression_rules)%' or
     v_complete_definition similar to '%(workout_plans|plan_phases|workout_templates|exercise_entries|workout_sessions|exercise_results|exercise_set_results|progression_rules)%' then
    raise exception 'quota functions reference plan/workout/session/progression tables';
  end if;
end $$;
