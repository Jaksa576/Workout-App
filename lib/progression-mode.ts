import type { ProgressionMode, TrainingGoalType } from "@/lib/types";

export function selectDefaultProgressionMode(
  goalType: TrainingGoalType | null | undefined
): ProgressionMode | null {
  if (!goalType) {
    return null;
  }

  if (goalType === "recovery") {
    return "symptom_based";
  }

  if (goalType === "consistency" || goalType === "general_fitness") {
    return "adherence_based";
  }

  if (goalType === "running" || goalType === "sport_performance") {
    return "hybrid";
  }

  return "performance_based";
}

export function inferTrainingGoalTypeFromText(
  goal: string | null | undefined
): TrainingGoalType | null {
  const normalizedGoal = goal?.trim().toLowerCase() ?? "";

  if (!normalizedGoal) {
    return null;
  }

  if (/\b(rehab|prehab|recover|recovery|injury|pain)\b/.test(normalizedGoal)) {
    return "recovery";
  }

  if (/\b(run|running|runner|5k|10k|marathon)\b/.test(normalizedGoal)) {
    return "running";
  }

  if (/\b(hypertrophy|muscle|bodybuilding)\b/.test(normalizedGoal)) {
    return "hypertrophy";
  }

  if (/\b(strength|strong|powerlifting)\b/.test(normalizedGoal)) {
    return "strength";
  }

  if (/\b(sport|sports|athletic|athlete|performance)\b/.test(normalizedGoal)) {
    return "sport_performance";
  }

  if (/\b(consistency|consistent)\b/.test(normalizedGoal)) {
    return "consistency";
  }

  if (/\bgeneral fitness\b|\bfitness\b/.test(normalizedGoal)) {
    return "general_fitness";
  }

  return null;
}
