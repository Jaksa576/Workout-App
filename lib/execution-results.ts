import type { ExerciseEntry, ExerciseTrackingType, UnilateralMode } from "@/lib/types";

export type ExerciseTrackingMetadata = {
  trackingType: ExerciseTrackingType;
  unilateralMode: UnilateralMode;
  loadUnit: "lb" | "kg" | null;
  distanceUnit: "mi" | "km" | "m" | null;
  primaryValueLabel: string | null;
  secondaryValueLabel: string | null;
};

const weightRepsIds = new Set([
  "goblet-squat",
  "barbell-back-squat",
  "romanian-deadlift",
  "dumbbell-floor-press",
  "dumbbell-shoulder-press",
  "dumbbell-row",
  "farmer-carry",
  "dumbbell-lateral-raise",
  "dumbbell-curl",
  "lateral-lunge"
]);

const durationIds = new Set([
  "low-impact-cardio-march",
  "run-walk-intervals",
  "stride-drills",
  "side-plank",
  "lateral-shuffle"
]);

const distanceDurationIds = new Set(["brisk-walk", "easy-run"]);

const sameEachSideIds = new Set([
  "reverse-lunge",
  "step-up",
  "walking-lunge",
  "dumbbell-row",
  "dead-bug",
  "side-plank",
  "hip-flexor-rockback",
  "thoracic-rotation",
  "ankle-rock",
  "lateral-lunge",
  "skater-hop"
]);

export function getDefaultTrackingMetadata(sourceExerciseId?: string | null): ExerciseTrackingMetadata {
  if (!sourceExerciseId) {
    return {
      trackingType: "completion",
      unilateralMode: "bilateral",
      loadUnit: null,
      distanceUnit: null,
      primaryValueLabel: "Completion",
      secondaryValueLabel: null
    };
  }

  const unilateralMode = sameEachSideIds.has(sourceExerciseId) ? "same_each_side" : "bilateral";

  if (weightRepsIds.has(sourceExerciseId)) {
    return {
      trackingType: "weight_reps",
      unilateralMode,
      loadUnit: "lb",
      distanceUnit: null,
      primaryValueLabel: "Load",
      secondaryValueLabel: "Reps"
    };
  }

  if (distanceDurationIds.has(sourceExerciseId)) {
    return {
      trackingType: "distance_duration",
      unilateralMode,
      loadUnit: null,
      distanceUnit: "mi",
      primaryValueLabel: "Distance",
      secondaryValueLabel: "Duration"
    };
  }

  if (durationIds.has(sourceExerciseId)) {
    return {
      trackingType: "duration",
      unilateralMode,
      loadUnit: null,
      distanceUnit: null,
      primaryValueLabel: "Duration",
      secondaryValueLabel: null
    };
  }

  return {
    trackingType: "reps_only",
    unilateralMode,
    loadUnit: null,
    distanceUnit: null,
    primaryValueLabel: "Reps",
    secondaryValueLabel: null
  };
}

export function buildPrescribedSetRows(exerciseResultId: string, exercise: Pick<ExerciseEntry, "sets">, completed: boolean) {
  return Array.from({ length: exercise.sets }, (_, index) => ({
    exercise_result_id: exerciseResultId,
    set_order: index,
    prescribed_set_index: index,
    set_kind: "prescribed" as const,
    status: completed ? ("completed" as const) : ("incomplete" as const),
    completed_at: completed ? new Date().toISOString() : null
  }));
}
