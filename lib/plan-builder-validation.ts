import { normalizeExerciseVideoUrl } from "@/lib/validation";
import type { StructuredPlanInput } from "@/lib/types";

export type ValidationAttentionItem = {
  key: string;
  label: string;
};

/**
 * Mirrors the client-visible parts of the structured plan save validation.
 * Keys use hierarchy indexes rather than entered names so they remain stable
 * while a person corrects the form.
 */
export function getPlanBuilderValidationAttentionItems(
  plan: StructuredPlanInput,
): ValidationAttentionItem[] {
  const items: ValidationAttentionItem[] = [];

  if (!plan.name.trim()) {
    items.push({ key: "plan-name", label: "Add a plan name" });
  }

  plan.phases.forEach((phase, phaseIndex) => {
    const phaseLabel = `Phase ${phaseIndex + 1}`;

    if (!phase.goal.trim()) {
      items.push({ key: `phase-${phaseIndex}-goal`, label: `${phaseLabel}: add a goal` });
    }

    if (phase.workouts.length === 0) {
      items.push({ key: `phase-${phaseIndex}-workouts`, label: `${phaseLabel}: add a workout` });
    }

    phase.workouts.forEach((workout, workoutIndex) => {
      const workoutLabel = `${phaseLabel}, workout ${workoutIndex + 1}`;

      if (!workout.name.trim()) {
        items.push({ key: `phase-${phaseIndex}-workout-${workoutIndex}-name`, label: `${workoutLabel}: add a name` });
      }

      if (workout.exercises.length === 0) {
        items.push({ key: `phase-${phaseIndex}-workout-${workoutIndex}-exercises`, label: `${workoutLabel}: add an exercise` });
      }

      workout.exercises.forEach((exercise, exerciseIndex) => {
        const exerciseLabel = `${workoutLabel}, exercise ${exerciseIndex + 1}`;

        if (!exercise.name.trim() || !exercise.reps.trim() || !exercise.rest.trim()) {
          items.push({ key: `phase-${phaseIndex}-workout-${workoutIndex}-exercise-${exerciseIndex}-required`, label: `${exerciseLabel}: complete name, reps, and rest` });
        }

        if (!Number.isInteger(exercise.sets) || exercise.sets < 1) {
          items.push({ key: `phase-${phaseIndex}-workout-${workoutIndex}-exercise-${exerciseIndex}-sets`, label: `${exerciseLabel}: use at least one whole set` });
        }

        if (normalizeExerciseVideoUrl(exercise.videoUrl ?? "") === null) {
          items.push({ key: `phase-${phaseIndex}-workout-${workoutIndex}-exercise-${exerciseIndex}-video`, label: `${exerciseLabel}: use a YouTube video link or leave it blank` });
        }
      });
    });
  });

  return items;
}
