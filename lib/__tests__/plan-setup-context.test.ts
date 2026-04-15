import { describe, expect, it } from "vitest";
import {
  buildDefaultPlanSetup,
  buildPlanSetupContext
} from "@/lib/plan-setup-context";
import type {
  PlanSetupInput,
  Profile,
  StructuredPlanInput,
  WorkoutPlan
} from "@/lib/types";
import { isStructuredPlanSaveInput } from "@/lib/validation";

const profile: Profile = {
  id: "user-1",
  goal: "Build a sustainable routine.",
  primaryGoalType: "running",
  injuries: ["Knee sensitivity"],
  limitationsDetail: "No jumping right now",
  equipment: ["Bodyweight"],
  trainingExperience: "returning",
  activityLevel: "lightly_active",
  trainingEnvironment: "home",
  exercisePreferences: ["mobility"],
  exerciseDislikes: [],
  sportsInterests: ["soccer"],
  daysPerWeek: 4,
  sessionMinutes: 45,
  onboardingCompletedAt: "2026-04-13T12:00:00.000Z"
};

const savedSetup: PlanSetupInput = {
  goalType: "strength",
  objectiveSummary: "Build strength without rushing.",
  daysPerWeek: 3,
  sessionMinutes: 60,
  weeklySchedule: ["mon", "wed", "fri"],
  preferredSplit: "full_body",
  focusAreas: ["lower body"],
  currentConstraints: ["Keep knee calm"],
  progressionModeOverride: "hybrid"
};

const basePlan: WorkoutPlan = {
  id: "plan-1",
  name: "Strength Plan",
  description: "A strength plan.",
  goalType: "strength",
  progressionMode: "performance_based",
  creationSource: "guided_template",
  setupContext: null,
  isActive: true,
  scheduleSummary: "Mon / Wed / Fri",
  weeklySchedule: ["mon", "wed", "fri"],
  completedAt: null,
  archivedAt: null,
  currentPhase: {
    id: "phase-1",
    phaseNumber: 1,
    goal: "Build strength.",
    advanceCriteria: "Complete clean sessions.",
    deloadCriteria: "Review if pain increases.",
    advancementPreset: "clean_sessions_in_window",
    advancementSettings: { sessions: 4, weeks: 2 },
    deloadPreset: "pain_flags_in_window",
    deloadSettings: { painFlags: 2, days: 7 }
  },
  phases: [],
  workouts: [
    {
      id: "workout-1",
      phaseId: "phase-1",
      name: "Full Body",
      focus: "Strength",
      summary: "Simple strength day.",
      readiness: "Ready",
      scheduledDays: ["mon"],
      exercises: []
    }
  ]
};

const validPlan: StructuredPlanInput = {
  version: "structured-v1",
  name: "Updated plan",
  description: "A small valid update.",
  goalType: "strength",
  progressionMode: "hybrid",
  creationSource: "guided_template",
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

describe("plan setup context", () => {
  it("uses saved setup context when a plan has it", () => {
    const result = buildPlanSetupContext({
      plan: { ...basePlan, setupContext: savedSetup },
      profile
    });

    expect(result.source).toBe("persisted");
    expect(result.setup).toEqual(savedSetup);
    expect(result.missingFields).toEqual([]);
  });

  it("reconstructs safe setup defaults for older plans without setup context", () => {
    const result = buildPlanSetupContext({ plan: basePlan, profile });

    expect(result.source).toBe("reconstructed");
    expect(result.setup.goalType).toBe("strength");
    expect(result.setup.weeklySchedule).toEqual(["mon", "wed", "fri"]);
    expect(result.setup.progressionModeOverride).toBe("performance_based");
    expect(result.missingFields).toContain("plan-specific objective");
    expect(result.missingFields).toContain("current constraints");
  });

  it("marks missing fields when only profile fallback values are available", () => {
    const result = buildPlanSetupContext({
      plan: {
        ...basePlan,
        goalType: null,
        weeklySchedule: [],
        workouts: [],
        setupContext: null
      },
      profile
    });

    expect(result.setup.goalType).toBe("running");
    expect(result.setup.weeklySchedule).toEqual(["mon", "wed", "fri", "tue"]);
    expect(result.missingFields).toContain("goal track");
    expect(result.missingFields).toContain("weekly schedule");
  });

  it("builds profile-based defaults for new guided plans", () => {
    const result = buildDefaultPlanSetup(profile);

    expect(result.goalType).toBe("running");
    expect(result.preferredSplit).toBe("run_strength");
    expect(result.currentConstraints).toEqual([
      "Knee sensitivity",
      "No jumping right now"
    ]);
  });

  it("validates the wrapped guided plan save payload", () => {
    expect(isStructuredPlanSaveInput({ plan: validPlan, setupContext: savedSetup })).toBe(true);
    expect(isStructuredPlanSaveInput({ plan: validPlan, setupContext: { ...savedSetup, daysPerWeek: 0 } })).toBe(false);
  });
});
