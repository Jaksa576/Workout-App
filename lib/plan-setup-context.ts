import type {
  PlanPreferredSplit,
  PlanSetupInput,
  Profile,
  TrainingGoalType,
  Weekday,
  WorkoutPlan
} from "@/lib/types";
import { isPlanSetupInput, normalizeWeekdays } from "@/lib/validation";

type SetupContextSource = "persisted" | "reconstructed";

export type PlanSetupContextResult = {
  setup: PlanSetupInput;
  source: SetupContextSource;
  missingFields: string[];
  notices: string[];
};

const defaultDays: Weekday[] = ["mon", "wed", "fri", "tue", "thu", "sat", "sun"];

export function getDefaultSchedule(daysPerWeek: number) {
  return defaultDays.slice(0, Math.max(1, Math.min(daysPerWeek, 7)));
}

export function getDefaultPlanSplit(
  goalType: TrainingGoalType,
  daysPerWeek: number
): PlanPreferredSplit {
  if (goalType === "running") {
    return "run_strength";
  }

  if (goalType === "recovery") {
    return "mobility_strength";
  }

  if (goalType === "strength" || goalType === "hypertrophy") {
    return daysPerWeek >= 4 ? "upper_lower" : "full_body";
  }

  return "flexible";
}

export function getInitialPlanConstraints(profile: Profile | null) {
  return [
    ...(profile?.injuries ?? []).filter((item) => item !== "None right now"),
    ...(profile?.limitationsDetail ? [profile.limitationsDetail] : [])
  ];
}

export function buildDefaultPlanSetup(profile: Profile | null): PlanSetupInput {
  const goalType = profile?.primaryGoalType ?? "general_fitness";
  const daysPerWeek = profile?.daysPerWeek ?? 3;

  return {
    goalType,
    objectiveSummary: "",
    daysPerWeek,
    sessionMinutes: profile?.sessionMinutes ?? 45,
    weeklySchedule: getDefaultSchedule(daysPerWeek),
    preferredSplit: getDefaultPlanSplit(goalType, daysPerWeek),
    focusAreas: [
      ...(profile?.exercisePreferences ?? []).slice(0, 2),
      ...(profile?.sportsInterests ?? []).slice(0, 1)
    ],
    currentConstraints: getInitialPlanConstraints(profile),
    progressionModeOverride: null
  };
}

function getPlanSchedule(plan: WorkoutPlan, profile: Profile | null) {
  const planSchedule = normalizeWeekdays(plan.weeklySchedule);

  if (planSchedule.length) {
    return planSchedule;
  }

  const workoutSchedule = normalizeWeekdays(
    plan.workouts.flatMap((workout) => workout.scheduledDays)
  );

  if (workoutSchedule.length) {
    return workoutSchedule;
  }

  return getDefaultSchedule(profile?.daysPerWeek ?? 3);
}

export function buildPlanSetupContext({
  plan,
  profile
}: {
  plan: WorkoutPlan;
  profile: Profile | null;
}): PlanSetupContextResult {
  if (isPlanSetupInput(plan.setupContext)) {
    return {
      setup: {
        ...plan.setupContext,
        weeklySchedule: normalizeWeekdays(plan.setupContext.weeklySchedule)
      },
      source: "persisted",
      missingFields: [],
      notices: [
        "This setup is prefilled from the answers saved with this plan."
      ]
    };
  }

  const weeklySchedule = getPlanSchedule(plan, profile);
  const goalType = plan.goalType ?? profile?.primaryGoalType ?? "general_fitness";
  const daysPerWeek = weeklySchedule.length || profile?.daysPerWeek || 3;
  const hasPlanGoal = Boolean(plan.goalType);
  const hasPlanSchedule = plan.weeklySchedule.length > 0;
  const missingFields = [
    ...(!hasPlanGoal ? ["goal track"] : []),
    "plan-specific objective",
    "preferred split",
    "focus areas",
    "current constraints",
    ...(!hasPlanSchedule ? ["weekly schedule"] : [])
  ];

  return {
    setup: {
      goalType,
      objectiveSummary: "",
      daysPerWeek,
      sessionMinutes: profile?.sessionMinutes ?? 45,
      weeklySchedule,
      preferredSplit: getDefaultPlanSplit(goalType, daysPerWeek),
      focusAreas: [
        ...(profile?.exercisePreferences ?? []).slice(0, 2),
        ...(profile?.sportsInterests ?? []).slice(0, 1)
      ],
      currentConstraints: getInitialPlanConstraints(profile),
      progressionModeOverride: plan.progressionMode ?? null
    },
    source: "reconstructed",
    missingFields,
    notices: [
      "This older plan does not have every setup answer saved, so the edit flow is prefilled from the current plan and your profile where it is safe.",
      "Please review the missing setup details before generating the updated draft."
    ]
  };
}
