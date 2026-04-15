import { describe, expect, it } from "vitest";
import { exerciseCatalog, getCatalogExercise } from "@/lib/exercise-library";
import { getPlanDraftProvider } from "@/lib/plan-drafting/plan-draft-provider";
import {
  inferTrainingGoalTypeFromText,
  selectDefaultProgressionMode
} from "@/lib/progression-mode";
import type {
  PlanDraftInput,
  PlanSetupInput,
  StructuredPlanInput,
  TrainingGoalType
} from "@/lib/types";
import {
  isPlanSetupInput,
  isStructuredPlanInput,
  isTrainingGoalType
} from "@/lib/validation";

const goalTracks: TrainingGoalType[] = [
  "recovery",
  "general_fitness",
  "strength",
  "hypertrophy",
  "running",
  "sport_performance",
  "consistency"
];

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

function makeDraftInput(
  goalType: TrainingGoalType,
  overrides: Partial<PlanDraftInput> = {}
): PlanDraftInput {
  return {
    ...baseDraftInput,
    ...overrides,
    setup: {
      ...baseDraftInput.setup,
      goalType,
      preferredSplit:
        goalType === "running"
          ? "run_strength"
          : goalType === "recovery"
            ? "mobility_strength"
            : "full_body",
      focusAreas: goalType === "sport_performance" ? ["court sport"] : ["lower body"],
      ...(overrides.setup ?? {})
    },
    profile: {
      ...baseDraftInput.profile!,
      ...(overrides.profile ?? {})
    }
  };
}

async function createDraft(
  goalType: TrainingGoalType,
  overrides: Partial<PlanDraftInput> = {}
) {
  const provider = getPlanDraftProvider("template");
  return provider.createDraft(makeDraftInput(goalType, overrides));
}

function getExerciseNames(plan: StructuredPlanInput) {
  return plan.phases.flatMap((phase) =>
    phase.workouts.flatMap((workout) =>
      workout.exercises.map((exercise) => exercise.name.toLowerCase())
    )
  );
}

function getExerciseText(plan: StructuredPlanInput) {
  return getExerciseNames(plan).join(" ");
}

function getWorkoutCounts(plan: StructuredPlanInput) {
  return plan.phases.map((phase) => phase.workouts.length);
}

function getCatalogItems(plan: StructuredPlanInput) {
  return plan.phases
    .flatMap((phase) => phase.workouts.flatMap((workout) => workout.exercises))
    .map((exercise) =>
      exercise.sourceExerciseId ? getCatalogExercise(exercise.sourceExerciseId) : null
    )
    .filter((exercise): exercise is NonNullable<typeof exercise> => Boolean(exercise));
}

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

  it("creates valid structured plans for every goal track", async () => {
    for (const goalType of goalTracks) {
      const result = await createDraft(goalType);

      expect(isStructuredPlanInput(result.plan), goalType).toBe(true);
      expect(result.plan.goalType).toBe(goalType);
      expect(result.plan.creationSource).toBe("guided_template");
      expect(result.plan.phases).toHaveLength(2);
      expect(result.plan.phases.every((phase) => phase.workouts.length > 0)).toBe(true);
    }
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
    const result = await createDraft("strength", {
      profile: {
        ...baseDraftInput.profile!,
        injuries: ["Knee"]
      }
    });

    expect(result.plan.goalType).toBe("strength");
    expect(result.plan.progressionMode).toBe("hybrid");
  });

  it("preserves minimum goal fidelity in generated drafts", async () => {
    const running = await createDraft("running");
    const recovery = await createDraft("recovery");
    const strength = await createDraft("strength", {
      profile: { ...baseDraftInput.profile!, equipment: ["Bodyweight", "Dumbbells", "Barbell"] }
    });
    const hypertrophy = await createDraft("hypertrophy", {
      profile: { ...baseDraftInput.profile!, equipment: ["Bodyweight", "Dumbbells"] }
    });
    const consistency = await createDraft("consistency");

    expect(getExerciseText(running.plan)).toMatch(/run\/walk intervals|easy run/);
    expect(
      getCatalogItems(recovery.plan).some((exercise) =>
        exercise.cautionTags.includes("impact")
      )
    ).toBe(false);
    expect(getExerciseText(strength.plan)).toMatch(/squat|deadlift|row|press/);
    expect(getExerciseText(hypertrophy.plan)).toMatch(/lateral raise|curl|floor press/);
    expect(
      consistency.plan.phases.every((phase) =>
        phase.workouts.every((workout) => workout.exercises.length <= 3)
      )
    ).toBe(true);
  });

  it("uses bounded draft shapes by goal, frequency, and split", async () => {
    const recovery = await createDraft("recovery", {
      setup: { ...basePlanSetupInput, goalType: "recovery", daysPerWeek: 5 }
    });
    const running = await createDraft("running", {
      setup: { ...basePlanSetupInput, goalType: "running", preferredSplit: "run_strength" }
    });
    const strengthFullBody = await createDraft("strength", {
      setup: { ...basePlanSetupInput, goalType: "strength", daysPerWeek: 3 }
    });
    const strengthUpperLower = await createDraft("strength", {
      setup: {
        ...basePlanSetupInput,
        goalType: "strength",
        daysPerWeek: 4,
        weeklySchedule: ["mon", "tue", "thu", "fri"],
        preferredSplit: "upper_lower"
      }
    });

    expect(getWorkoutCounts(recovery.plan)).toEqual([2, 2]);
    expect(getWorkoutCounts(running.plan)).toEqual([3, 3]);
    expect(getWorkoutCounts(strengthFullBody.plan)).toEqual([3, 3]);
    expect(getWorkoutCounts(strengthUpperLower.plan)).toEqual([4, 4]);
  });

  it("uses equipment, dislikes, and coarse constraints when selecting exercises", async () => {
    const noSquatDraft = await createDraft("strength", {
      profile: {
        ...baseDraftInput.profile!,
        equipment: ["Bodyweight"],
        exerciseDislikes: ["squat"]
      }
    });
    const noJumpingDraft = await createDraft("sport_performance", {
      setup: {
        ...basePlanSetupInput,
        goalType: "sport_performance",
        currentConstraints: ["No jumping right now"]
      },
      profile: {
        ...baseDraftInput.profile!,
        sportsInterests: ["Tennis"]
      }
    });

    expect(getExerciseText(noSquatDraft.plan)).not.toContain("squat");
    expect(
      getCatalogItems(noSquatDraft.plan).every((exercise) =>
        exercise.equipmentTags.includes("Bodyweight")
      )
    ).toBe(true);
    expect(getExerciseText(noJumpingDraft.plan)).not.toContain("skater hop");
  });

  it("has complete deterministic metadata for catalog entries used by templates", () => {
    const ids = new Set<string>();

    for (const exercise of exerciseCatalog) {
      expect(exercise.id).toBeTruthy();
      expect(ids.has(exercise.id), exercise.id).toBe(false);
      ids.add(exercise.id);
      expect(exercise.name).toBeTruthy();
      expect(exercise.category).toBeTruthy();
      expect(exercise.movementPattern).toBeTruthy();
      expect(exercise.equipmentTags.length, exercise.id).toBeGreaterThan(0);
      expect(exercise.goalTags.length, exercise.id).toBeGreaterThan(0);
      expect(exercise.goalTags.every(isTrainingGoalType), exercise.id).toBe(true);
      expect(exercise.difficultyTier).toBeTruthy();
      expect(Array.isArray(exercise.cautionTags), exercise.id).toBe(true);
      expect(Array.isArray(exercise.traitTags), exercise.id).toBe(true);
      expect(Array.isArray(exercise.preferenceTags), exercise.id).toBe(true);
    }
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
