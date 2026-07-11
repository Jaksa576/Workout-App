import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260710120000_workout_execution_set_results.sql", "utf8");
const qa = readFileSync("supabase/verification/issue-10-workout-execution-transactional-qa.sql", "utf8");

describe("Issue #10 Supabase SQL hardening", () => {
  it("keeps unknown non-null source IDs on completion fallback instead of broad reps_only", () => {
    expect(migration).not.toContain("when source_exercise_id is not null then 'reps_only'");
    expect(migration).toContain("unknown_ids_not_using_completion_fallback");
    expect(migration).toContain("'bodyweight-squat','box-squat','hip-hinge-drill'");
    expect(migration).toContain("else 'completion'");
  });

  it("requires finalize set rows to reference exercise results from the same RPC payload", () => {
    expect(migration).toContain("SECURITY DEFINER is required");
    expect(migration).toContain("duplicate exercise result ids are not allowed");
    expect(migration).toContain("duplicate exercise_entry_id values are not allowed");
    expect(migration).toContain("exercise_entry_id must belong to selected workout");
    expect(migration).toContain("set rows must reference exercise results created by this finalize call");
    expect(migration).toContain("source_workout_template_id must match selected workout");
  });

  it("derives session and exercise snapshots inside the RPC", () => {
    expect(migration).toContain("Snapshot metadata is derived from workout_templates, plan_phases, workout_plans, and exercise_entries");
    expect(migration).toContain("authoritative_workout record");
    expect(migration).toContain("authoritative_workout.workout_name");
    expect(migration).toContain("ee.source_exercise_id, ee.name, ee.sort_order, ee.tracking_type, ee.unilateral_mode");
    expect(migration).toContain("ee.sets::text || ' sets × ' || ee.reps");
  });

  it("provides executable transactional QA for success, rollback, and foreign child rejection", () => {
    expect(qa).toContain("begin;");
    expect(qa).toContain("rollback;");
    expect(qa).toContain("Valid owned finalize succeeds");
    expect(qa).toContain("late child failure left workout_session behind");
    expect(qa).toContain("foreign exercise_entry_id unexpectedly succeeded");
    expect(qa).toContain("foreign/pre-existing set parent unexpectedly succeeded");
    expect(qa).toContain("was_rejected boolean := false");
    expect(qa).toContain("if was_rejected is false then raise exception");
    expect(qa).toContain("caller metadata was not overridden with authoritative snapshots");
    expect(qa).not.toContain("TODO");
  });
});
