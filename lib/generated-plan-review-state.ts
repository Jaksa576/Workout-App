import type { NormalizedGeneratedExercise } from "@/lib/generated-plan-draft";
import type { StructuredPlanInput } from "@/lib/types";

export type GeneratedExerciseReviewByPath = Record<string, NormalizedGeneratedExercise>;

export type GeneratedExerciseReviewPath = {
  phaseIndex: number;
  workoutIndex: number;
  exerciseIndex: number;
};

export function getGeneratedReviewKey({
  phaseIndex,
  workoutIndex,
  exerciseIndex
}: GeneratedExerciseReviewPath) {
  return `${phaseIndex}-${workoutIndex}-${exerciseIndex}`;
}

export function buildGeneratedExerciseReviewByPath(
  plan: StructuredPlanInput | undefined,
  outcomes: NormalizedGeneratedExercise[] | undefined
) {
  const result: GeneratedExerciseReviewByPath = {};
  let outcomeIndex = 0;
  plan?.phases.forEach((phase, phaseIndex) => {
    phase.workouts.forEach((workout, workoutIndex) => {
      workout.exercises.forEach((_, exerciseIndex) => {
        const outcome = outcomes?.[outcomeIndex++];
        if (outcome) {
          result[getGeneratedReviewKey({ phaseIndex, workoutIndex, exerciseIndex })] = outcome;
        }
      });
    });
  });
  return result;
}

export function countGeneratedReviewBlockers(current: GeneratedExerciseReviewByPath) {
  return Object.values(current).filter((outcome) => outcome.status === "needs_review").length;
}

export function setGeneratedReviewOutcome(
  current: GeneratedExerciseReviewByPath,
  path: GeneratedExerciseReviewPath,
  outcome: NormalizedGeneratedExercise
) {
  return { ...current, [getGeneratedReviewKey(path)]: outcome };
}

export function remapGeneratedReviewAfterDelete(
  current: GeneratedExerciseReviewByPath,
  target: { phaseIndex: number; workoutIndex?: number; exerciseIndex?: number }
) {
  const next: GeneratedExerciseReviewByPath = {};
  for (const [key, outcome] of Object.entries(current)) {
    let [phaseIndex, workoutIndex, exerciseIndex] = key.split("-").map(Number);
    if (target.workoutIndex === undefined) {
      if (phaseIndex === target.phaseIndex) continue;
      if (phaseIndex > target.phaseIndex) phaseIndex -= 1;
    } else if (target.exerciseIndex === undefined) {
      if (phaseIndex === target.phaseIndex && workoutIndex === target.workoutIndex) continue;
      if (phaseIndex === target.phaseIndex && workoutIndex > target.workoutIndex) workoutIndex -= 1;
    } else if (phaseIndex === target.phaseIndex && workoutIndex === target.workoutIndex) {
      if (exerciseIndex === target.exerciseIndex) continue;
      if (exerciseIndex > target.exerciseIndex) exerciseIndex -= 1;
    }
    next[getGeneratedReviewKey({ phaseIndex, workoutIndex, exerciseIndex })] = outcome;
  }
  return next;
}
