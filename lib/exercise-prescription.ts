import type { WorkoutTemplate } from "@/lib/types";

export function formatExercisePrescription(
  exercise: WorkoutTemplate["exercises"][number],
) {
  const reps = exercise.reps.trim();
  const setsLabel = exercise.sets === 1 ? "1 set" : `${exercise.sets} sets`;

  if (!reps) {
    return setsLabel;
  }

  if (/^rounds?$/i.test(reps)) {
    return `${exercise.sets} ${exercise.sets === 1 ? "round" : "rounds"}`;
  }

  return `${exercise.sets} × ${reps}`;
}

export function formatExercisePrescriptionWithRest(
  exercise: WorkoutTemplate["exercises"][number],
) {
  return [
    formatExercisePrescription(exercise),
    exercise.rest ? `Rest ${exercise.rest}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}
