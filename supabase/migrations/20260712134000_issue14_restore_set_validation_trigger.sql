-- Issue #14 follow-up: ensure exercise_set_results validation remains active after replacing the validator function.
drop trigger if exists exercise_set_results_validate on public.exercise_set_results;

create trigger exercise_set_results_validate
before insert or update on public.exercise_set_results
for each row
execute function public.validate_exercise_set_result();
