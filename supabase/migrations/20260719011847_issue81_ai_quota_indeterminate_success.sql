-- Issue #81: fail closed when provider success cannot be distinguished from a
-- completion-persistence failure. The original Issue #64 migration is already
-- applied and remains immutable; this migration only extends operational quota
-- state and replaces the two service-role-only RPC definitions.

alter table public.ai_generation_attempts
  drop constraint if exists ai_generation_attempts_status_check;

alter table public.ai_generation_attempts
  add constraint ai_generation_attempts_status_check check (
    status in (
      'reserved',
      'succeeded',
      'indeterminate_success',
      'provider_failure',
      'timeout',
      'rate_limited',
      'invalid_output',
      'unsafe_input'
    )
  );

create or replace function public.reserve_ai_generation_attempt(
  p_user_id uuid,
  p_success_limit integer,
  p_attempt_limit integer,
  p_request_identifier text default null
)
returns table (
  decision text,
  attempt_id uuid,
  quota_date date,
  attempt_status text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_quota_date date := (statement_timestamp() at time zone 'UTC')::date;
  v_existing public.ai_generation_attempts%rowtype;
  v_attempt_id uuid;
  v_attempt_count integer;
  v_success_capacity integer;
begin
  if p_user_id is null then raise exception 'user id is required'; end if;
  if p_success_limit is null or p_success_limit < 1 or p_success_limit > 10 then
    raise exception 'invalid success limit';
  end if;
  if p_attempt_limit is null or p_attempt_limit < 1 or p_attempt_limit > 100 then
    raise exception 'invalid attempt limit';
  end if;
  if p_success_limit > p_attempt_limit then raise exception 'success limit exceeds attempt limit'; end if;
  if p_request_identifier is not null and (
    length(p_request_identifier) not between 1 and 128 or
    p_request_identifier !~ '^[A-Za-z0-9._:-]+$'
  ) then raise exception 'invalid request identifier'; end if;

  perform pg_advisory_xact_lock(
    hashtextextended(p_user_id::text || ':' || v_quota_date::text, 0)
  );

  -- A stale reservation is inherently ambiguous: the process may have crashed
  -- before the provider call, after paid provider work, or after a valid result.
  -- Preserve success capacity for the UTC day instead of guessing failure.
  update public.ai_generation_attempts as attempts
  set status = 'indeterminate_success', completed_at = statement_timestamp()
  where attempts.user_id = p_user_id
    and attempts.quota_date = v_quota_date
    and attempts.status = 'reserved'
    and attempts.created_at < statement_timestamp() - interval '2 minutes';

  if p_request_identifier is not null then
    select * into v_existing
    from public.ai_generation_attempts as attempts
    where attempts.user_id = p_user_id
      and attempts.quota_date = v_quota_date
      and attempts.request_identifier = p_request_identifier;

    if found then
      return query select
        'duplicate_request'::text,
        v_existing.id,
        v_quota_date,
        v_existing.status;
      return;
    end if;
  end if;

  select count(*)::integer into v_attempt_count
  from public.ai_generation_attempts as attempts
  where attempts.user_id = p_user_id and attempts.quota_date = v_quota_date;

  if v_attempt_count >= p_attempt_limit then
    return query select 'attempt_limit_reached'::text, null::uuid, v_quota_date, null::text;
    return;
  end if;

  select count(*)::integer into v_success_capacity
  from public.ai_generation_attempts as attempts
  where attempts.user_id = p_user_id
    and attempts.quota_date = v_quota_date
    and attempts.status in ('reserved', 'succeeded', 'indeterminate_success');

  if v_success_capacity >= p_success_limit then
    return query select 'success_quota_reached'::text, null::uuid, v_quota_date, null::text;
    return;
  end if;

  insert into public.ai_generation_attempts (
    user_id,
    quota_date,
    status,
    request_identifier
  ) values (
    p_user_id,
    v_quota_date,
    'reserved',
    p_request_identifier
  ) returning id into v_attempt_id;

  return query select 'reserved'::text, v_attempt_id, v_quota_date, 'reserved'::text;
end;
$$;

create or replace function public.complete_ai_generation_attempt(
  p_user_id uuid,
  p_attempt_id uuid,
  p_outcome text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_status text;
begin
  if p_user_id is null or p_attempt_id is null then raise exception 'attempt ownership is required'; end if;
  if p_outcome not in (
    'succeeded',
    'indeterminate_success',
    'provider_failure',
    'timeout',
    'rate_limited',
    'invalid_output',
    'unsafe_input'
  ) then raise exception 'invalid attempt outcome'; end if;

  select status into v_status
  from public.ai_generation_attempts
  where id = p_attempt_id and user_id = p_user_id
  for update;

  if not found then raise exception 'attempt not found'; end if;
  if v_status = p_outcome then return true; end if;

  -- If the first succeeded completion committed but its response was lost, the
  -- compensating indeterminate completion is already capacity-safe and must not
  -- downgrade the definitive success.
  if v_status = 'succeeded' and p_outcome = 'indeterminate_success' then return true; end if;
  if v_status <> 'reserved' then raise exception 'attempt already completed'; end if;

  update public.ai_generation_attempts
  set status = p_outcome, completed_at = statement_timestamp()
  where id = p_attempt_id and user_id = p_user_id;

  return true;
end;
$$;

revoke all on function public.reserve_ai_generation_attempt(uuid, integer, integer, text) from public, anon, authenticated;
revoke all on function public.complete_ai_generation_attempt(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.reserve_ai_generation_attempt(uuid, integer, integer, text) to service_role;
grant execute on function public.complete_ai_generation_attempt(uuid, uuid, text) to service_role;
