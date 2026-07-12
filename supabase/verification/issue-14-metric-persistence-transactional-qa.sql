-- Issue #14 transactional QA template.
-- Run only in a safe Supabase context after substituting IDs for an owned workout template
-- with duration, distance_duration, same_each_side, and independent_sides exercise_entries.
begin;
-- 1. Call public.finalize_workout_session with completed duration and assert actual_duration_seconds is stored.
-- 2. Call with completed distance_duration and assert actual_distance and actual_duration_seconds are stored.
-- 3. Call with same_each_side scalar values and assert only scalar actual_* columns are populated.
-- 4. Call with independent_sides rows and assert matching left/right columns are populated.
-- 5. Call with an invalid child row inside a savepoint, assert the function raises, then assert no workout_session,
--    exercise_results, or exercise_set_results rows exist for that client session ID.
rollback;
