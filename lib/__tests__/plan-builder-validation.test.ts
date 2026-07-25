import { describe, expect, it } from "vitest";
import { getPlanBuilderValidationAttentionItems } from "@/lib/plan-builder-validation";
import type { StructuredPlanInput } from "@/lib/types";

function plan(overrides: Partial<StructuredPlanInput> = {}): StructuredPlanInput {
  return {
    version: "structured-v1", name: "Plan", description: "", weeklySchedule: [], creationSource: "manual",
    phases: [{ goal: "Goal", advancementPreset: "clean_sessions_in_window", advancementSettings: {}, deloadPreset: "pain_flags_in_window", deloadSettings: {}, workouts: [{ name: "Workout", focus: "", summary: "", scheduledDays: [], exercises: [{ name: "Squat", sets: 3, reps: "8", rest: "60 sec", coachingNote: "", videoUrl: "" }] }] }],
    ...overrides
  };
}

describe("manual plan builder validation attention", () => {
  it("builds concise stable summary data from the structured save rules in predictable hierarchy order", () => {
    const value = plan({ name: "", phases: [{ ...plan().phases[0], goal: "", workouts: [{ ...plan().phases[0].workouts[0], name: "", exercises: [{ ...plan().phases[0].workouts[0].exercises[0], name: "", sets: 0, reps: "", rest: "", videoUrl: "https://example.com/not-youtube" }] }] }] });
    expect(getPlanBuilderValidationAttentionItems(value)).toMatchObject([
      { key: "plan-name" }, { key: "phase-0-goal" }, { key: "phase-0-workout-0-name" },
      { key: "phase-0-workout-0-exercise-0-required" }, { key: "phase-0-workout-0-exercise-0-sets" }, { key: "phase-0-workout-0-exercise-0-video" }
    ]);
  });

  it("removes resolved errors on the next validation attempt without using entered names as IDs", () => {
    const invalid = plan({ name: "" });
    expect(getPlanBuilderValidationAttentionItems(invalid)).toEqual([{ key: "plan-name", label: "Add a plan name" }]);
    expect(getPlanBuilderValidationAttentionItems(plan({ name: "A name a person typed" }))).toEqual([]);
  });
});
