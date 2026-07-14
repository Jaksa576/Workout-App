import { describe, expect, it } from "vitest";
import {
  formatExercisePrescription,
  formatExercisePrescriptionWithRest,
} from "@/lib/exercise-prescription";
import type { WorkoutTemplate } from "@/lib/types";

function exercise(
  input: Partial<WorkoutTemplate["exercises"][number]> = {},
): WorkoutTemplate["exercises"][number] {
  return {
    id: "exercise-1",
    name: "Romanian Deadlift",
    sets: 3,
    reps: "8",
    rest: "90 sec",
    coachingNote: "Hinge",
    videoUrl: undefined,
    sourceExerciseId: null,
    trackingType: "weight_reps",
    unilateralMode: "bilateral",
    loadUnit: "lb",
    distanceUnit: null,
    primaryValueLabel: null,
    secondaryValueLabel: null,
    ...input,
  };
}

describe("exercise prescription formatting", () => {
  it("formats concise set and rep prescriptions for workout cards", () => {
    expect(formatExercisePrescription(exercise())).toBe("3 × 8");
    expect(
      formatExercisePrescription(
        exercise({ name: "Hamstring Bridge Hold", reps: "30 sec" }),
      ),
    ).toBe("3 × 30 sec");
    expect(
      formatExercisePrescription(exercise({ sets: 2, reps: "rounds" })),
    ).toBe("2 rounds");
  });

  it("keeps the details dialog rest-aware through the shared helper", () => {
    expect(formatExercisePrescriptionWithRest(exercise())).toBe(
      "3 × 8 · Rest 90 sec",
    );
    expect(formatExercisePrescriptionWithRest(exercise({ rest: "" }))).toBe(
      "3 × 8",
    );
  });
});
