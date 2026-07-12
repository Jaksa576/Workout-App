-- Issue #13 transactional QA should be run in a disposable transaction against seeded fixture IDs.
begin;
-- Expected QA cases for the target environment:
-- 1. finalize weight_reps completed rows with actual_load null and actual_reps null; verify row is saved completed and null remains null.
-- 2. finalize reps_only completed rows with actual_reps null; verify row is saved completed and null remains null.
-- 3. finalize supplied numeric weight/reps values; verify values persist exactly.
-- 4. attempt reps_only actual_load; verify RPC rejects and the whole session rolls back.
-- 5. attempt negative load/reps or non-integer reps; verify validation rejects before/inside the RPC and no partial rows remain.
-- 6. attempt duplicate prescribed_set_index or duplicate set_order; verify atomic rollback.
select 'Issue #13 optional-metric transactional QA checklist loaded; replace with environment fixture IDs before execution.' as qa_note;
rollback;
