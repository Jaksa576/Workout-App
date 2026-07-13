import { describe, expect, it } from "vitest";
import {
  formatHistorySet,
  formatTrackingDisplay,
  type ExerciseHistoryEntry,
} from "@/lib/exercise-history";

const base: ExerciseHistoryEntry = {
  sessionId: "session-1",
  exerciseResultId: "result-1",
  completedOn: "2026-07-11",
  workoutName: "Lower Strength Base",
  exerciseName: "Goblet Squat",
  trackingType: "weight_reps",
  unilateralMode: "bilateral",
  loadUnit: "lb",
  distanceUnit: "mi",
  completionStatus: "completed",
  sets: [],
};

const emptySet = {
  status: "completed",
  actualLoad: null,
  actualReps: null,
  actualDurationSeconds: null,
  actualDistance: null,
  actualLeftLoad: null,
  actualLeftReps: null,
  actualLeftDurationSeconds: null,
  actualLeftDistance: null,
  actualRightLoad: null,
  actualRightReps: null,
  actualRightDurationSeconds: null,
  actualRightDistance: null,
};

describe("exercise history formatting", () => {
  it("formats every approved tracking type with units and side semantics", () => {
    expect(
      formatHistorySet({ ...emptySet, actualLoad: 60, actualReps: 8 }, base),
    ).toBe("60 lb × 8");
    expect(
      formatHistorySet(
        { ...emptySet, actualReps: 12 },
        { ...base, trackingType: "reps_only" },
      ),
    ).toBe("12 reps");
    expect(
      formatHistorySet(
        { ...emptySet, actualDurationSeconds: 45 },
        { ...base, trackingType: "duration" },
      ),
    ).toBe("45s");
    expect(
      formatHistorySet(
        { ...emptySet, actualDurationSeconds: 1112, actualDistance: 2 },
        { ...base, trackingType: "distance_duration" },
      ),
    ).toBe("2 mi · 18:32");
    expect(
      formatHistorySet(
        { ...emptySet, actualReps: 10 },
        {
          ...base,
          trackingType: "reps_only",
          unilateralMode: "same_each_side",
        },
      ),
    ).toBe("10 reps/side");
    expect(
      formatHistorySet(
        { ...emptySet, actualLeftReps: 10, actualRightReps: 8 },
        {
          ...base,
          trackingType: "reps_only",
          unilateralMode: "independent_sides",
        },
      ),
    ).toBe("L 10 · R 8");
    expect(
      formatHistorySet(emptySet, { ...base, trackingType: "completion" }),
    ).toBe("Completed");
  });

  it("formats user-facing tracking labels", () => {
    expect(formatTrackingDisplay(base)).toBe("Weight and reps · lb");
    expect(
      formatTrackingDisplay({
        trackingType: "distance_duration",
        distanceUnit: "mi",
        unilateralMode: "independent_sides",
      }),
    ).toBe("Distance and time · mi · Left and right separately");
  });
});
