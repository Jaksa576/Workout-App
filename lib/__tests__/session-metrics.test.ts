import { describe, expect, it } from "vitest";
import { savedSessionMetricSelect } from "@/lib/data";
import { buildTrendSeries, deriveSessionMetrics, type ExerciseMetricRow, type SetMetricRow } from "@/lib/session-metrics";

const baseSet: SetMetricRow = {
  status: "completed",
  actual_load: null,
  actual_reps: null,
  actual_duration_seconds: null,
  actual_distance: null,
  actual_left_load: null,
  actual_left_reps: null,
  actual_left_duration_seconds: null,
  actual_left_distance: null,
  actual_right_load: null,
  actual_right_reps: null,
  actual_right_duration_seconds: null,
  actual_right_distance: null,
};

function exercise(overrides: Partial<ExerciseMetricRow>): ExerciseMetricRow {
  return {
    id: "result-1",
    exercise_entry_id: "exercise-1",
    source_exercise_id: null,
    exercise_name: "Exercise",
    exercise_order: 0,
    tracking_type: "completion",
    unilateral_mode: "bilateral",
    load_unit: null,
    distance_unit: null,
    completion_status: "completed",
    exercise_set_results: [{ ...baseSet }],
    ...overrides,
  };
}

function session(exercise_results: ExerciseMetricRow[], completed = true) {
  return { id: "session", completed, completed_on: "2026-07-12", workout_template_id: "workout", workout_name_snapshot: "Workout", exercise_results };
}

describe("session metrics", () => {
  it("keeps the saved-session query contract mapped to persisted snapshot columns", () => {
    expect(savedSessionMetricSelect).toContain("exercise_name:exercise_name_snapshot");
    expect(savedSessionMetricSelect).not.toContain("source_exercise_id, exercise_name,");
  });

  it("derives bilateral weight and reps volume", () => {
    const metrics = deriveSessionMetrics(session([exercise({ tracking_type: "weight_reps", load_unit: "lb", exercise_set_results: [{ ...baseSet, actual_load: 50, actual_reps: 5 }] })]));
    expect(metrics.loadVolume).toBe(250);
    expect(metrics.totalReps).toBe(5);
    expect(metrics.exercises[0]?.summary).toBe("1/1 set · 250 lb volume");
  });

  it("preserves same-each-side aggregate convention", () => {
    const metrics = deriveSessionMetrics(session([exercise({ tracking_type: "reps_only", unilateral_mode: "same_each_side", exercise_set_results: [{ ...baseSet, actual_reps: 8 }] })]));
    expect(metrics.totalReps).toBe(16);
    expect(metrics.exercises[0]?.summary).toBe("1/1 set · 16 reps");
  });

  it("sums independent-side totals and volume side-specifically", () => {
    const metrics = deriveSessionMetrics(session([exercise({ tracking_type: "weight_reps", unilateral_mode: "independent_sides", load_unit: "lb", exercise_set_results: [{ ...baseSet, actual_left_load: 10, actual_left_reps: 5, actual_right_load: 12, actual_right_reps: 6 }] })]));
    expect(metrics.totalReps).toBe(11);
    expect(metrics.loadVolume).toBe(122);
    expect(metrics.exercises[0]?.summary).toBe("1/1 set · 122 lb volume");
  });

  it("does not turn null completed metrics into zero-value claims", () => {
    const metrics = deriveSessionMetrics(session([exercise({ tracking_type: "weight_reps", load_unit: "lb", exercise_set_results: [{ ...baseSet }] })]));
    expect(metrics.loadVolume).toBe(0);
    expect(metrics.exercises[0]?.hasLoadVolume).toBe(false);
    expect(metrics.exercises[0]?.summary).toBe("1/1 set completed");
  });

  it("distinguishes explicit zero from null", () => {
    const metrics = deriveSessionMetrics(session([exercise({ tracking_type: "reps_only", exercise_set_results: [{ ...baseSet, actual_reps: 0 }] })]));
    expect(metrics.totalReps).toBe(0);
    expect(metrics.exercises[0]?.hasReps).toBe(true);
    expect(metrics.exercises[0]?.summary).toBe("1/1 set · 0 reps");
  });

  it("summarizes completion-only exercises and partial sessions", () => {
    const metrics = deriveSessionMetrics(session([exercise({ exercise_set_results: [{ ...baseSet }, { ...baseSet, status: "incomplete" }] })], false));
    expect(metrics.status).toBe("Partial");
    expect(metrics.exercises[0]?.summary).toBe("1/2 sets completed");
    expect(metrics.summary).toBe("1 exercise · 1/2 sets");
  });

  it("marks completed sessions with incomplete saved sets as partial", () => {
    expect(deriveSessionMetrics(session([exercise({ exercise_set_results: [{ ...baseSet }, { ...baseSet, status: "incomplete" }] })], true)).status).toBe("Partial");
  });

  it("falls back for mixed strength, timed, and distance sessions", () => {
    const metrics = deriveSessionMetrics(session([
      exercise({ id: "s", tracking_type: "weight_reps", load_unit: "lb", exercise_set_results: [{ ...baseSet, actual_load: 10, actual_reps: 10 }] }),
      exercise({ id: "t", tracking_type: "duration", exercise_order: 1, exercise_set_results: [{ ...baseSet, actual_duration_seconds: 60 }] }),
      exercise({ id: "d", tracking_type: "distance", exercise_order: 2, distance_unit: "mi", exercise_set_results: [{ ...baseSet, actual_distance: 1 }] }),
    ]));
    expect(metrics.summary).toBe("3 exercises · 3/3 sets");
    expect(metrics.loadVolume).toBe(100);
    expect(metrics.workDurationSeconds).toBe(60);
    expect(metrics.distance).toBe(1);
  });

  it("does not pair distance-duration with unrelated timed work", () => {
    const metrics = deriveSessionMetrics(session([
      exercise({ tracking_type: "distance_duration", distance_unit: "mi", exercise_set_results: [{ ...baseSet, actual_distance: 2, actual_duration_seconds: 1200 }] }),
      exercise({ id: "mobility", tracking_type: "duration", exercise_order: 1, exercise_set_results: [{ ...baseSet, actual_duration_seconds: 300 }] }),
    ]));
    expect(metrics.summary).toBe("2 exercises · 2/2 sets");
    expect(metrics.exercises[0]?.summary).toBe("2 mi · 20:00");
    expect(metrics.workDurationSeconds).toBe(1500);
  });

  it("does not combine multiple distance units", () => {
    const metrics = deriveSessionMetrics(session([
      exercise({ tracking_type: "distance", distance_unit: "mi", exercise_set_results: [{ ...baseSet, actual_distance: 1 }] }),
      exercise({ id: "meters", tracking_type: "distance", exercise_order: 1, distance_unit: "m", exercise_set_results: [{ ...baseSet, actual_distance: 400 }] }),
    ]));
    expect(metrics.distanceUnit).toBeNull();
    expect(metrics.summary).toBe("2 exercises · 2/2 sets");
  });

  it("handles zero-set rows and singular/plural grammar", () => {
    expect(deriveSessionMetrics(session([exercise({ exercise_set_results: [] })])).summary).toBe("0 exercises · 0/0 sets");
    expect(deriveSessionMetrics(session([exercise({ exercise_set_results: [{ ...baseSet }, { ...baseSet }] })])).summary).toBe("1 exercise · 2/2 sets");
  });

  it("orders trend series chronologically", () => {
    const series = buildTrendSeries([session([], true), { ...session([], true), id: "older", completed_on: "2026-07-01" }]);
    expect(series.map((item) => item.sessionId)).toEqual(["older", "session"]);
  });
});
