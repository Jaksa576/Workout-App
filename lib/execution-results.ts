import { getExerciseTrackingMetadataBySourceId } from "@/lib/exercise-library";
import type { ExerciseEntry, ExerciseTrackingType, UnilateralMode } from "@/lib/types";

export type ExerciseTrackingMetadata = {
  trackingType: ExerciseTrackingType;
  unilateralMode: UnilateralMode;
  loadUnit: "lb" | "kg" | null;
  distanceUnit: "mi" | "km" | "m" | null;
  primaryValueLabel: string | null;
  secondaryValueLabel: string | null;
};

export function getDefaultTrackingMetadata(sourceExerciseId?: string | null): ExerciseTrackingMetadata {
  const metadata = getExerciseTrackingMetadataBySourceId(sourceExerciseId);
  return {
    trackingType: metadata.trackingType,
    unilateralMode: metadata.unilateralMode,
    loadUnit: metadata.loadUnit,
    distanceUnit: metadata.distanceUnit,
    primaryValueLabel: metadata.primaryValueLabel,
    secondaryValueLabel: metadata.secondaryValueLabel
  };
}

export function buildEffectiveTrackingMetadata(
  exercise: Pick<ExerciseEntry, "sourceExerciseId" | "trackingType" | "unilateralMode" | "loadUnit" | "distanceUnit" | "primaryValueLabel" | "secondaryValueLabel">
): ExerciseTrackingMetadata {
  const defaults = getDefaultTrackingMetadata(exercise.sourceExerciseId);
  const trackingType = exercise.trackingType ?? defaults.trackingType;
  return {
    trackingType,
    unilateralMode: exercise.unilateralMode ?? defaults.unilateralMode,
    loadUnit: trackingType === "weight_reps" ? (exercise.loadUnit ?? defaults.loadUnit ?? "lb") : null,
    distanceUnit: trackingType === "distance_duration" ? (exercise.distanceUnit ?? defaults.distanceUnit ?? "mi") : null,
    primaryValueLabel: exercise.primaryValueLabel ?? defaults.primaryValueLabel,
    secondaryValueLabel: exercise.secondaryValueLabel ?? defaults.secondaryValueLabel
  };
}

export function buildPrescribedSetRows(
  exerciseResultId: string,
  exercise: Pick<ExerciseEntry, "sets">,
  checked: boolean,
  trackingType: ExerciseTrackingType = "completion"
) {
  const completed = checked && trackingType === "completion";
  return Array.from({ length: exercise.sets }, (_, index) => ({
    exercise_result_id: exerciseResultId,
    set_order: index,
    prescribed_set_index: index,
    set_kind: "prescribed" as const,
    status: completed ? ("completed" as const) : ("incomplete" as const),
    completed_at: completed ? new Date().toISOString() : null
  }));
}
