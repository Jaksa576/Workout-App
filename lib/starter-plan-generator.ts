import { exerciseCatalog, toPlanExercise } from "@/lib/exercise-library";
import type {
  PlanDraftInput,
  PlanPreferredSplit,
  StructuredPlanInput,
  TrainingGoalType,
  Weekday
} from "@/lib/types";

const defaultDays: Weekday[] = ["mon", "wed", "fri"];

const goalLabels: Record<TrainingGoalType, string> = {
  recovery: "Recovery",
  general_fitness: "General Fitness",
  strength: "Strength",
  hypertrophy: "Hypertrophy",
  running: "Running",
  sport_performance: "Sport Performance",
  consistency: "Consistency"
};

const splitLabels: Record<PlanPreferredSplit, string> = {
  full_body: "full-body",
  upper_lower: "upper/lower",
  push_pull_legs: "push/pull/legs",
  run_strength: "run plus strength",
  mobility_strength: "mobility plus strength",
  flexible: "flexible"
};

function pickExercises(ids: string[]) {
  return ids
    .map((id) => exerciseCatalog.find((exercise) => exercise.id === id))
    .filter((exercise): exercise is NonNullable<typeof exercise> => Boolean(exercise))
    .map(toPlanExercise);
}

function makeSchedule(input: PlanDraftInput) {
  return input.setup.weeklySchedule.length
    ? input.setup.weeklySchedule
    : defaultDays.slice(0, input.setup.daysPerWeek);
}

function getEquipment(input: PlanDraftInput) {
  return input.profile?.equipment ?? [];
}

function getPlanName(goalType: TrainingGoalType) {
  if (goalType === "recovery") {
    return "Recovery Foundation Plan";
  }

  return `${goalLabels[goalType]} Starter Plan`;
}

function getPrimaryExercises(input: PlanDraftInput) {
  const equipment = getEquipment(input);

  if (input.setup.goalType === "running") {
    return pickExercises(["glute-bridge", "walking-lunge", "calf-raise"]);
  }

  if (input.setup.goalType === "recovery") {
    return pickExercises(["glute-bridge", "dead-bug", "hip-flexor-rockback"]);
  }

  return pickExercises([
    equipment.includes("Dumbbells") || equipment.includes("Kettlebell")
      ? "goblet-squat"
      : "bodyweight-squat",
    "romanian-deadlift",
    "dead-bug"
  ]);
}

function getSupportExercises(input: PlanDraftInput) {
  const equipment = getEquipment(input);
  const hasBands = equipment.includes("Bands");

  if (input.setup.goalType === "running") {
    return pickExercises(["bodyweight-squat", "calf-raise", "hip-flexor-rockback"]);
  }

  if (input.setup.goalType === "recovery") {
    return pickExercises(["incline-push-up", "side-plank", "hip-flexor-rockback"]);
  }

  return pickExercises([
    "incline-push-up",
    hasBands ? "band-row" : "side-plank",
    "hip-flexor-rockback"
  ]);
}

function getPlanDescription(input: PlanDraftInput) {
  const objective = input.setup.objectiveSummary?.trim();
  const focusText = input.setup.focusAreas.length
    ? ` Focus areas: ${input.setup.focusAreas.join(", ")}.`
    : "";
  const constraintText = input.setup.currentConstraints.length
    ? ` Current constraints: ${input.setup.currentConstraints.join(", ")}.`
    : "";

  return (
    objective ||
    `A ${splitLabels[input.setup.preferredSplit]} starter plan for ${goalLabels[
      input.setup.goalType
    ].toLowerCase()}.`
  ).concat(focusText, constraintText);
}

function getPhaseOneGoal(input: PlanDraftInput) {
  if (input.setup.goalType === "recovery") {
    return "Build a comfortable baseline while respecting current symptoms and constraints.";
  }

  if (input.setup.goalType === "consistency") {
    return "Build a repeatable training rhythm that is easy to complete.";
  }

  if (input.setup.goalType === "running") {
    return "Build running readiness with low-friction support work.";
  }

  return "Build a comfortable baseline with clean, repeatable movement.";
}

function getPhaseTwoGoal(input: PlanDraftInput) {
  if (input.setup.goalType === "recovery") {
    return "Add a little more work while keeping symptoms and effort in check.";
  }

  if (input.setup.goalType === "consistency") {
    return "Repeat the plan with a slightly stronger weekly rhythm.";
  }

  if (input.setup.goalType === "running") {
    return "Add a little more running support while monitoring readiness.";
  }

  return "Add a little more work while keeping effort and technique in check.";
}

export function createGuidedStarterPlan(input: PlanDraftInput): StructuredPlanInput {
  const weeklySchedule = makeSchedule(input);
  const primaryExercises = getPrimaryExercises(input);
  const supportExercises = getSupportExercises(input);
  const sessionLength = `${input.setup.sessionMinutes} min`;

  return {
    version: "structured-v1",
    name: getPlanName(input.setup.goalType),
    description: getPlanDescription(input),
    weeklySchedule,
    phases: [
      {
        goal: getPhaseOneGoal(input),
        advancementPreset: "clean_sessions_in_window",
        advancementSettings: { sessions: Math.max(3, input.setup.daysPerWeek), weeks: 2 },
        deloadPreset: "pain_flags_in_window",
        deloadSettings: { painFlags: 2, days: 7 },
        workouts: [
          {
            name:
              input.setup.goalType === "running"
                ? "Running Prep A"
                : `${goalLabels[input.setup.goalType]} Base A`,
            focus: `${goalLabels[input.setup.goalType]} foundation`,
            summary: `A ${sessionLength} session for building your starting point.`,
            scheduledDays: weeklySchedule.slice(0, 1),
            exercises: primaryExercises
          },
          {
            name:
              input.setup.goalType === "running"
                ? "Strength Support"
                : "Support + Mobility",
            focus:
              input.setup.goalType === "running"
                ? "Running support"
                : "Strength balance",
            summary: "A support session for moving well between main training days.",
            scheduledDays: weeklySchedule.slice(1, 2),
            exercises: supportExercises
          }
        ]
      },
      {
        goal: getPhaseTwoGoal(input),
        advancementPreset: "clean_sessions_streak",
        advancementSettings: { sessions: Math.max(3, input.setup.daysPerWeek) },
        deloadPreset: "too_hard_streak",
        deloadSettings: { sessions: 2 },
        workouts: [
          {
            name:
              input.setup.goalType === "running"
                ? "Running Prep B"
                : `${goalLabels[input.setup.goalType]} Base B`,
            focus: "Steady progression",
            summary: "Repeat the basics with a slightly stronger training rhythm.",
            scheduledDays: weeklySchedule.slice(0, 1),
            exercises: primaryExercises
          },
          {
            name:
              input.setup.goalType === "running"
                ? "Stride Support"
                : "Mobility + Core",
            focus:
              input.setup.goalType === "running"
                ? "Running readiness"
                : "Control and recovery",
            summary: "A support session for keeping the plan sustainable.",
            scheduledDays: weeklySchedule.slice(1, 2),
            exercises: supportExercises
          }
        ]
      }
    ]
  };
}
