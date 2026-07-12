import type { WorkoutSetInput, WorkoutTemplate } from "@/lib/types";

export const activeWorkoutAutoStartRestDefault = true;

export function getVisibleSetCount(
  exercise: WorkoutTemplate["exercises"][number],
  setResults: WorkoutSetInput[],
) {
  const addedCount = setResults.filter(
    (row) => row.exerciseEntryId === exercise.id && row.setKind === "added",
  ).length;
  return exercise.sets + addedCount;
}

export function getCompletedVisibleSetCount(
  exercise: WorkoutTemplate["exercises"][number],
  setResults: WorkoutSetInput[],
) {
  return setResults.filter(
    (row) => row.exerciseEntryId === exercise.id && row.status === "completed",
  ).length;
}

export function hasUnfinishedVisibleSets(
  exercise: WorkoutTemplate["exercises"][number],
  setResults: WorkoutSetInput[],
) {
  return getCompletedVisibleSetCount(exercise, setResults) < getVisibleSetCount(exercise, setResults);
}

export function selectExerciseForManualRest(input: {
  workout: WorkoutTemplate;
  setResults: WorkoutSetInput[];
  currentExerciseId: string | null;
}) {
  const currentExercise = input.currentExerciseId
    ? input.workout.exercises.find(
        (exercise) => exercise.id === input.currentExerciseId,
      ) ?? null
    : null;

  if (
    currentExercise &&
    hasUnfinishedVisibleSets(currentExercise, input.setResults)
  ) {
    return currentExercise;
  }

  const firstIncomplete = input.workout.exercises.find((exercise) =>
    hasUnfinishedVisibleSets(exercise, input.setResults),
  );
  if (firstIncomplete) return firstIncomplete;

  if (currentExercise) return currentExercise;

  return input.workout.exercises[0] ?? null;
}
