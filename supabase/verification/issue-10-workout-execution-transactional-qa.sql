-- Optional Issue #10 transactional QA. This script intentionally writes inside a transaction and rolls back.
-- Replace the TODO ids with rows owned by the authenticated test user before running in SQL editor with an authenticated context.
begin;
-- select public.finalize_workout_session('{"id":"00000000-0000-0000-0000-000000000001", ...}'::jsonb, '[]'::jsonb, '[]'::jsonb);
-- Add invalid child-set cases here to confirm the RPC rolls back all session/exercise/set rows.
rollback;
