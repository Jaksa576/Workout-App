-- Issue #64: authenticated AI generation quota and operational attempt state.
-- The authoritative quota date is UTC because the app has no durable authenticated
-- user timezone. Client timezone cookies are intentionally not trusted for quota.

create table if not exists public.ai_generation_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quota_date date not null,
  status text not null default 'reserved',
  request_identifier text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint ai_generation_attempts_status_check check (
    status in (
      'reserved',
      'succeeded',
      'provider_failure',
      'timeout',
      'rate_limited',
      'invalid_output',
      'unsafe_input'
    )
  ),
  constraint ai_generation_attempts_completion_check check (
    (status = 'reserved' and completed_at is null) or
    (status <> 'reserved' and completed_at is not null)
  ),
  constraint ai_generation_attempts_request_identifier_check check (
    request_identifier is null or (
      length(request_identifier) between 1 and 128 and
      request_identifier ~ '^[A-Za-z0-9._:-]+$'
    )
  )
);

create index if not exists ai_generation_attempts_user_quota_status_idx
  on public.ai_generation_attempts (user_id, quota_date, status);
create unique index if not exists ai_generation_attempts_user_quota_request_unique
  on public.ai_generation_attempts (user_id, quota_date, request_identifier)
  where request_identifier is not null;

alter table public.ai_generation_attempts enable row level security;

drop policy if exists "AI generation attempts are readable by owner" on public.ai_generation_attempts;
create policy "AI generation attempts are readable by owner"
  on public.ai_generation_attempts
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.ai_generation_attempts from anon, authenticated;
grant select on table public.ai_generation_attempts to authenticated;
grant all on table public.ai_generation_attempts to service_role;

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

  -- Serialize every reservation for one user/day. The lock is held through insert
  -- commit, so concurrent requests observe the committed reservation/counts.
  perform pg_advisory_xact_lock(
    hashtextextended(p_user_id::text || ':' || v_quota_date::text, 0)
  );

  -- A crashed request cannot reserve success capacity forever. The two-minute
  -- lease exceeds the maximum configured provider timeout (60 seconds).
  update public.ai_generation_attempts as attempts
  set status = 'provider_failure', completed_at = statement_timestamp()
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
    and attempts.status in ('reserved', 'succeeded');

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
