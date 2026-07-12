import { describe, expect, it } from "vitest";
import { buildTrendSeries, deriveSessionMetrics } from "@/lib/session-metrics";

const baseSet = {
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

describe("session metrics", () => {
  it("derives partial status and set completion without changing progression policy inputs", () => {
    const metrics = deriveSessionMetrics({
      id: "session-1",
      completed: true,
      completed_on: "2026-07-12",
      elapsed_seconds: 600,
      workout_template_id: "workout-1",
      workout_name_snapshot: "Strength",
      exercise_results: [
        {
          id: "result-1",
          exercise_entry_id: "exercise-1",
          source_exercise_id: "push-up",
          exercise_name: "Push-Up",
          exercise_order: 0,
          tracking_type: "reps_only",
          unilateral_mode: "bilateral",
          load_unit: null,
          distance_unit: null,
          completion_status: "partial",
          exercise_set_results: [
            { ...baseSet, actual_reps: 10 },
            { ...baseSet, status: "incomplete" },
          ],
        },
      ],
    });

    expect(metrics.status).toBe("Partial");
    expect(metrics.summary).toBe("1 exercises · 1/2 sets");
    expect(metrics.totalReps).toBe(10);
  });

  it("keeps incompatible metrics separate for trend consumers", () => {
    const series = buildTrendSeries([
      {
        id: "session-2",
        completed: true,
        completed_on: "2026-07-13",
        workout_template_id: "run-1",
        workout_name_snapshot: "Run",
        exercise_results: [
          {
            id: "result-2",
            exercise_entry_id: "exercise-2",
            source_exercise_id: "run",
            exercise_name: "Run",
            exercise_order: 0,
            tracking_type: "distance_duration",
            unilateral_mode: "bilateral",
            load_unit: null,
            distance_unit: "mi",
            completion_status: "completed",
            exercise_set_results: [
              { ...baseSet, actual_distance: 2.4, actual_duration_seconds: 1458 },
            ],
          },
        ],
      },
    ]);

    expect(series[0]?.metrics.summary).toBe("2.4 mi · 24:18");
    expect(series[0]?.metrics.distance).toBe(2.4);
    expect(series[0]?.metrics.workDurationSeconds).toBe(1458);
    expect(series[0]?.metrics.loadVolume).toBe(0);
  });
});
