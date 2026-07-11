-- Issue #13 transactional QA should be run in a disposable transaction against a seeded test user.
begin;
-- Intentionally rollback-only: inspect the function definition and constraints before using environment-specific fixture IDs.
select 'rollback-only QA placeholder: call finalize_workout_session with completed weight_reps actual_load/actual_reps, then duplicate set_order, duplicate prescribed_set_index, and reps_only actual_load rejection cases' as qa_note;
rollback;
