-- Adds one durable global workout timer preference to the existing profile row.
-- Active-workout overrides remain browser-draft scoped and do not use a second store.
alter table public.profiles
  add column if not exists default_rest_seconds integer not null default 90;

alter table public.profiles
  drop constraint if exists profiles_default_rest_seconds_check;

alter table public.profiles
  add constraint profiles_default_rest_seconds_check
    check (default_rest_seconds between 1 and 1800);
