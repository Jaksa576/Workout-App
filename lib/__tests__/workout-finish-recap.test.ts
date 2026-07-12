import { describe, expect, it } from "vitest";
import { buildWorkoutRecap, getSetLoadVolume } from "@/components/workout-flow";
import type { WorkoutSetInput, WorkoutTemplate } from "@/lib/types";

function setRow(overrides: Partial<WorkoutSetInput> = {}): WorkoutSetInput {
  return {
    exerciseEntryId: "exercise-1",
    setId: "set-1",
    setOrder: 0,
    prescribedSetIndex: 0,
    setKind: "prescribed",
    status: "completed",
    ...overrides,
  };
}

function workout(exercises: WorkoutTemplate["exercises"]): WorkoutTemplate {
  return {
    id: "workout-1",
    phaseId: "phase-1",
    name: "Lower Strength",
    focus: "Strength",
    summary: "Train",
    readiness: "Ready",
    scheduledDays: ["mon"],
    exercises,
  };
}

describe("finish workout recap calculations", () => {
  it("sums independent-side load volume per side", () => {
    expect(
      getSetLoadVolume(
        setRow({
          actualLeftLoad: 50,
          actualLeftReps: 10,
          actualRightLoad: 40,
          actualRightReps: 8,
        }),
        "independent_sides",
      ),
    ).toBe(820);
  });

  it("does not combine missing independent-side values across sides", () => {
    expect(
      getSetLoadVolume(
        setRow({
          actualLeftLoad: 50,
          actualLeftReps: null,
          actualRightLoad: null,
          actualRightReps: 8,
        }),
        "independent_sides",
      ),
    ).toBe(0);
  });

  it("uses the same independent-side formula for workout and exercise volume", () => {
    const recap = buildWorkoutRecap(
      workout([
        {
          id: "exercise-1",
          name: "Split Squat",
          sets: 1,
          reps: "10/side",
          rest: "60 sec",
          coachingNote: "Control reps",
          trackingType: "weight_reps",
          unilateralMode: "independent_sides",
          loadUnit: "lb",
        },
      ]),
      [
        setRow({
          actualLeftLoad: 50,
          actualLeftReps: 10,
          actualRightLoad: 40,
          actualRightReps: 8,
        }),
      ],
      [],
      125,
    );

    expect(recap.metrics).toContainEqual({ label: "Load volume", value: "820 lb" });
    expect(recap.exerciseSummaries[0]?.detail).toContain("820 lb volume");
  });

  it("keeps same-each-side reps labels per side while aggregate totals count both sides", () => {
    const recap = buildWorkoutRecap(
      workout([
        {
          id: "exercise-1",
          name: "Reverse Lunge",
          sets: 1,
          reps: "8/side",
          rest: "60 sec",
          coachingNote: "Tall posture",
          trackingType: "reps_only",
          unilateralMode: "same_each_side",
        },
      ]),
      [setRow({ actualReps: 8 })],
      [],
      125,
    );

    expect(recap.metrics).toContainEqual({ label: "Total reps", value: "16" });
    expect(recap.exerciseSummaries[0]?.detail).toContain("8 reps/side");
    expect(recap.exerciseSummaries[0]?.detail).not.toContain("16 reps/side");
  });

  it("labels exercise count as exercises logged and omits partial-work warning data", () => {
    const recap = buildWorkoutRecap(
      workout([
        {
          id: "exercise-1",
          name: "Push-Up",
          sets: 2,
          reps: "10",
          rest: "60 sec",
          coachingNote: "Brace",
          trackingType: "reps_only",
        },
      ]),
      [setRow({ actualReps: 10 })],
      [],
      125,
    );

    expect(recap.metrics.some((metric) => metric.label === "Exercises logged")).toBe(true);
    expect("incompleteNotice" in recap).toBe(false);
  });
});
