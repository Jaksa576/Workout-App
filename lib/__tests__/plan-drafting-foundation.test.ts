import { describe, expect, it } from "vitest";
import { getPlanDraftProvider } from "@/lib/plan-drafting/plan-draft-provider";
import {
  inferTrainingGoalTypeFromText,
  selectDefaultProgressionMode
} from "@/lib/progression-mode";
import type { PlanDraftInput, PlanSetupInput, StructuredPlanInput } from "@/lib/types";
import { isPlanSetupInput, isStructuredPlanInput } from "@/lib/validation";

const basePlanSetupInput: PlanSetupInput = {
  goalType: "strength",
  objectiveSummary: "Keep the first plan simple.",
  daysPerWeek: 3,
  sessionMinutes: 45,
  weeklySchedule: ["mon", "wed", "fri"],
  preferredSplit: "full_body",
  focusAreas: ["lower body"],
  currentConstraints: []
};

const baseDraftInput: PlanDraftInput = {
  setup: basePlanSetupInput,
  profile: {
    injuries: [],
    equipment: ["Bodyweight", "Dumbbells"],
    exercisePreferences: ["Strength training"],
    exerciseDislikes: [],
    sportsInterests: [],
    daysPerWeek: 3,
    sessionMinutes: 45
  }
};

describe("plan draft foundation", () => {
  it("creates a valid structured plan from the template draft provider", async () => {
    const provider = getPlanDraftProvider("template");
    const result = await provider.createDraft(baseDraftInput);

    expect(provider.isConfigured()).toBe(true);
    expect(result.strategy).toBe("template");
    expect(result.source).toBe("guided_template");
    expect(isStructuredPlanInput(result.plan)).toBe(true);
    expect(result.plan.creationSource).toBe("guided_template");
    expect(result.plan.goalType).toBe("strength");
    expect(result.plan.progressionMode).toBe("performance_based");
  });

  it("keeps the LLM draft provider unavailable", async () => {
    const provider = getPlanDraftProvider("llm");

    expect(provider.isConfigured()).toBe(false);
    await expect(provider.createDraft(baseDraftInput)).rejects.toThrow(
      "LLM draft unavailable"
    );
  });

  it("validates lightweight plan setup input", () => {
    expect(isPlanSetupInput(basePlanSetupInput)).toBe(true);
    expect(isPlanSetupInput({ ...basePlanSetupInput, goalType: "wellness" })).toBe(false);
    expect(isPlanSetupInput({ ...basePlanSetupInput, daysPerWeek: 0 })).toBe(false);
    expect(isPlanSetupInput({ ...basePlanSetupInput, sessionMinutes: 5 })).toBe(false);
    expect(isPlanSetupInput({ ...basePlanSetupInput, weeklySchedule: ["monday"] })).toBe(
      false
    );
    expect(isPlanSetupInput({ ...basePlanSetupInput, preferredSplit: "random" })).toBe(
      false
    );
    expect(
      isPlanSetupInput({
        ...basePlanSetupInput,
        progressionModeOverride: "performance_based"
      })
    ).toBe(true);
    expect(
      isPlanSetupInput({
        ...basePlanSetupInput,
        progressionModeOverride: "aggressive"
      })
    ).toBe(false);
  });

  it("uses profile constraints when selecting draft progression mode", async () => {
    const provider = getPlanDraftProvider("template");
    const result = await provider.createDraft({
      ...baseDraftInput,
      profile: {
        ...baseDraftInput.profile!,
        injuries: ["Knee"]
      }
    });

    expect(result.plan.goalType).toBe("strength");
    expect(result.plan.progressionMode).toBe("hybrid");
  });

  it("validates goal and progression mode metadata on structured plans", () => {
    const validPlan: StructuredPlanInput = {
      version: "structured-v1",
      name: "Strength plan",
      description: "A small valid plan.",
      goalType: "strength",
      progressionMode: "performance_based",
      creationSource: "manual",
      weeklySchedule: ["mon"],
      phases: [
        {
          goal: "Build strength.",
          advancementPreset: "clean_sessions_in_window",
          advancementSettings: { sessions: 3, weeks: 2 },
          deloadPreset: "pain_flags_in_window",
          deloadSettings: { painFlags: 2, days: 7 },
          workouts: [
            {
              name: "Workout A",
              focus: "Strength",
              summary: "Simple work.",
              scheduledDays: ["mon"],
              exercises: [
                {
                  name: "Goblet squat",
                  sets: 3,
                  reps: "8",
                  rest: "90 sec",
                  coachingNote: "Move with control."
                }
              ]
            }
          ]
        }
      ]
    };

    expect(isStructuredPlanInput(validPlan)).toBe(true);
    expect(isStructuredPlanInput({ ...validPlan, goalType: "wellness" })).toBe(false);
    expect(isStructuredPlanInput({ ...validPlan, progressionMode: "vibes" })).toBe(false);
  });

  it("selects default progression modes without guessing ambiguous goals", () => {
    expect(selectDefaultProgressionMode("recovery")).toBe("symptom_based");
    expect(selectDefaultProgressionMode("consistency")).toBe("adherence_based");
    expect(selectDefaultProgressionMode("general_fitness")).toBe("adherence_based");
    expect(selectDefaultProgressionMode("strength")).toBe("performance_based");
    expect(selectDefaultProgressionMode("hypertrophy")).toBe("performance_based");
    expect(selectDefaultProgressionMode("running")).toBe("hybrid");
    expect(selectDefaultProgressionMode("sport_performance")).toBe("hybrid");
    expect(selectDefaultProgressionMode(null)).toBeNull();
  });

  it("only infers obvious legacy goal text", () => {
    expect(inferTrainingGoalTypeFromText("Return to running")).toBe("running");
    expect(inferTrainingGoalTypeFromText("Rehab or rebuild confidence")).toBe("recovery");
    expect(inferTrainingGoalTypeFromText("Build strength")).toBe("strength");
    expect(inferTrainingGoalTypeFromText("Improve consistency")).toBe("consistency");
    expect(inferTrainingGoalTypeFromText("General fitness")).toBe("general_fitness");
    expect(inferTrainingGoalTypeFromText("Build a sustainable routine.")).toBeNull();
  });
});
