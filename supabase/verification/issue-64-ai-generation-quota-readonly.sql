-- Issue #64 read-only verification. Run after applying the committed migration.
-- This script inspects metadata and function definitions only; it performs no writes.

do $$
declare
  v_columns text[];
  v_reserve oid := to_regprocedure('public.reserve_ai_generation_attempt(uuid,integer,integer,text)');
  v_complete oid := to_regprocedure('public.complete_ai_generation_attempt(uuid,uuid,text)');
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

  if v_reserve is null or v_complete is null then raise exception 'required quota functions are missing'; end if;

  if not exists (
    select 1 from pg_proc where oid = v_reserve and prosecdef
      and proconfig @> array['search_path=public, pg_temp']
  ) then raise exception 'reserve function security/search_path mismatch'; end if;
  if not exists (
    select 1 from pg_proc where oid = v_complete and prosecdef
      and proconfig @> array['search_path=public, pg_temp']
  ) then raise exception 'complete function security/search_path mismatch'; end if;

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

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'ai_generation_attempts'
      and policyname = 'AI generation attempts are readable by owner'
      and cmd = 'SELECT'
  ) then raise exception 'owner read policy is missing'; end if;

  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and tablename = 'ai_generation_attempts'
      and indexname = 'ai_generation_attempts_user_quota_status_idx'
  ) or not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and tablename = 'ai_generation_attempts'
      and indexname = 'ai_generation_attempts_user_quota_request_unique'
  ) then raise exception 'required quota indexes are missing'; end if;

  if lower(pg_get_functiondef(v_reserve)) not like '%pg_advisory_xact_lock%' or
     lower(pg_get_functiondef(v_reserve)) not like '%at time zone ''utc''%' or
     lower(pg_get_functiondef(v_reserve)) not like '%status in (''reserved'', ''succeeded'')%' then
    raise exception 'reservation function is missing atomic, UTC-date, or success-capacity behavior';
  end if;

  if lower(pg_get_functiondef(v_reserve)) similar to '%(workout_plans|plan_phases|workout_templates|exercise_entries|workout_sessions|exercise_results|exercise_set_results)%' or
     lower(pg_get_functiondef(v_complete)) similar to '%(workout_plans|plan_phases|workout_templates|exercise_entries|workout_sessions|exercise_results|exercise_set_results)%' then
    raise exception 'quota functions reference plan/workout/session/progression tables';
  end if;
end $$;

select
  c.conname,
  pg_get_constraintdef(c.oid) as definition
from pg_constraint c
where c.conrelid = 'public.ai_generation_attempts'::regclass
order by c.conname;
