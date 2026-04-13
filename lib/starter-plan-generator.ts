import { exerciseCatalog, toPlanExercise } from "@/lib/exercise-library";
import type { OnboardingInput, StructuredPlanInput, Weekday } from "@/lib/types";

const defaultDays: Weekday[] = ["mon", "wed", "fri"];

function pickExercises(ids: string[]) {
  return ids
    .map((id) => exerciseCatalog.find((exercise) => exercise.id === id))
    .filter((exercise): exercise is NonNullable<typeof exercise> => Boolean(exercise))
    .map(toPlanExercise);
}

function buildPlanName(goal: string) {
  const normalizedGoal = goal.trim();

  if (!normalizedGoal) {
    return "Starter Strength Plan";
  }

  if (normalizedGoal.toLowerCase().includes("run")) {
    return "Return to Running Starter Plan";
  }

  if (normalizedGoal.toLowerCase().includes("rehab")) {
    return "Rehab Foundation Starter Plan";
  }

  return "Starter Workout Plan";
}

export function createGuidedStarterPlan(input: OnboardingInput): StructuredPlanInput {
  const weeklySchedule = input.weeklySchedule.length
    ? input.weeklySchedule
    : defaultDays.slice(0, input.daysPerWeek);
  const hasBands = input.equipment.includes("Bands");
  const lowerBodyExercises = pickExercises([
    input.equipment.includes("Dumbbells") ? "goblet-squat" : "bodyweight-squat",
    "romanian-deadlift",
    "dead-bug"
  ]);
  const upperBodyExercises = pickExercises([
    "incline-push-up",
    hasBands ? "band-row" : "side-plank",
    "hip-flexor-rockback"
  ]);
  const runningPrepExercises = pickExercises([
    "glute-bridge",
    "walking-lunge",
    "calf-raise"
  ]);

  return {
    version: "structured-v1",
    name: buildPlanName(input.goal),
    description:
      input.goalNotes.trim() ||
      "A guided starter plan built from your onboarding answers.",
    weeklySchedule,
    phases: [
      {
        goal: "Build a comfortable baseline with clean, repeatable movement.",
        advancementPreset: "clean_sessions_in_window",
        advancementSettings: { sessions: Math.max(3, input.daysPerWeek), weeks: 2 },
        deloadPreset: "pain_flags_in_window",
        deloadSettings: { painFlags: 2, days: 7 },
        workouts: [
          {
            name: "Lower Body + Core A",
            focus: "Movement quality",
            summary: "A controlled lower-body session for building your baseline.",
            scheduledDays: weeklySchedule.slice(0, 1),
            exercises: lowerBodyExercises
          },
          {
            name: "Upper Body + Mobility",
            focus: "Strength balance",
            summary: "Simple upper-body work with a mobility finish.",
            scheduledDays: weeklySchedule.slice(1, 2),
            exercises: upperBodyExercises
          }
        ]
      },
      {
        goal: "Add a little more work while keeping pain and effort in check.",
        advancementPreset: "clean_sessions_streak",
        advancementSettings: { sessions: Math.max(3, input.daysPerWeek) },
        deloadPreset: "too_hard_streak",
        deloadSettings: { sessions: 2 },
        workouts: [
          {
            name: "Lower Body + Core B",
            focus: "Steady strength",
            summary: "Repeat the basics with a slightly stronger training rhythm.",
            scheduledDays: weeklySchedule.slice(0, 1),
            exercises: lowerBodyExercises
          },
          {
            name: input.goal.toLowerCase().includes("run")
              ? "Running Prep"
              : "Mobility + Core",
            focus: input.goal.toLowerCase().includes("run")
              ? "Running readiness"
              : "Control and recovery",
            summary: "A support session for moving well between strength days.",
            scheduledDays: weeklySchedule.slice(1, 2),
            exercises: input.goal.toLowerCase().includes("run")
              ? runningPrepExercises
              : upperBodyExercises
          }
        ]
      }
    ]
  };
}
