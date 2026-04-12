import type { WorkoutSessionInput } from "@/lib/types";

export const perceivedDifficultyValues = [
  "too_easy",
  "appropriate",
  "too_hard"
] as const;

export function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export function isValidCompletedOn(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.toISOString().slice(0, 10) === value && value <= getTodayDateString();
}

export function isWorkoutSessionInput(value: unknown): value is WorkoutSessionInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const input = value as Partial<WorkoutSessionInput>;

  return (
    typeof input.workoutTemplateId === "string" &&
    typeof input.completedOn === "string" &&
    isValidCompletedOn(input.completedOn) &&
    typeof input.completed === "boolean" &&
    typeof input.painOccurred === "boolean" &&
    typeof input.perceivedDifficulty === "string" &&
    perceivedDifficultyValues.includes(input.perceivedDifficulty) &&
    typeof input.notes === "string" &&
    Array.isArray(input.completedExerciseIds) &&
    input.completedExerciseIds.every((id) => typeof id === "string")
  );
}
