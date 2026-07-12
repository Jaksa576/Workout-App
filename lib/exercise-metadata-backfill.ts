import type { ExerciseTrackingType, UnilateralMode } from "@/lib/types";

export type ExerciseMetadataBackfillMapping = {
  sourceExerciseId?: string;
  normalizedName?: string;
  repsPattern?: RegExp;
  trackingType: ExerciseTrackingType;
  unilateralMode: UnilateralMode;
  loadUnit: "lb" | "kg" | null;
  distanceUnit: "mi" | "km" | "m" | null;
  primaryValueLabel: string;
  secondaryValueLabel: string | null;
  reviewGroup: "safe_auto" | "explicit_reviewed" | "genuine_completion" | "ambiguous_deferred";
  note: string;
};

const weightReps = (sourceExerciseId: string): ExerciseMetadataBackfillMapping => ({
  sourceExerciseId,
  trackingType: "weight_reps",
  unilateralMode: sourceExerciseId === "dumbbell-row" || sourceExerciseId === "lateral-lunge" ? "same_each_side" : "bilateral",
  loadUnit: "lb",
  distanceUnit: null,
  primaryValueLabel: "Load",
  secondaryValueLabel: "Reps",
  reviewGroup: "safe_auto",
  note: "Catalog-backed loaded strength entry."
});

const repsOnly = (sourceExerciseId: string, unilateralMode: UnilateralMode = "bilateral"): ExerciseMetadataBackfillMapping => ({
  sourceExerciseId,
  trackingType: "reps_only",
  unilateralMode,
  loadUnit: null,
  distanceUnit: null,
  primaryValueLabel: "Reps",
  secondaryValueLabel: null,
  reviewGroup: "safe_auto",
  note: "Catalog-backed reps-only entry."
});

const duration = (sourceExerciseId: string, unilateralMode: UnilateralMode = "bilateral"): ExerciseMetadataBackfillMapping => ({
  sourceExerciseId,
  trackingType: "duration",
  unilateralMode,
  loadUnit: null,
  distanceUnit: null,
  primaryValueLabel: "Duration",
  secondaryValueLabel: null,
  reviewGroup: "safe_auto",
  note: "Catalog-backed timed entry."
});

const distanceDuration = (sourceExerciseId: string): ExerciseMetadataBackfillMapping => ({
  sourceExerciseId,
  trackingType: "distance_duration",
  unilateralMode: "bilateral",
  loadUnit: null,
  distanceUnit: "mi",
  primaryValueLabel: "Distance",
  secondaryValueLabel: "Duration",
  reviewGroup: "safe_auto",
  note: "Catalog-backed distance-plus-duration entry."
});

export const issue14ExerciseMetadataBackfillMappings: ExerciseMetadataBackfillMapping[] = [
  ...["goblet-squat", "barbell-back-squat", "romanian-deadlift", "dumbbell-floor-press", "dumbbell-shoulder-press", "dumbbell-row", "farmer-carry", "dumbbell-lateral-raise", "dumbbell-curl", "lateral-lunge"].map(weightReps),
  ...["bodyweight-squat", "box-squat", "hip-hinge-drill", "glute-bridge", "incline-push-up", "push-up", "band-row", "calf-raise", "tibialis-raise"].map((id) => repsOnly(id)),
  ...["reverse-lunge", "step-up", "walking-lunge", "dead-bug", "bird-dog", "hip-flexor-rockback", "thoracic-rotation", "ankle-rock", "skater-hop"].map((id) => repsOnly(id, "same_each_side")),
  duration("side-plank", "same_each_side"),
  ...["low-impact-cardio-march", "run-walk-intervals", "stride-drills", "lateral-shuffle"].map((id) => duration(id)),
  distanceDuration("brisk-walk"),
  distanceDuration("easy-run"),
  {
    normalizedName: "hamstring bridge hold",
    repsPattern: /^\d+\s*(sec|secs|second|seconds|s)\b/i,
    trackingType: "duration",
    unilateralMode: "bilateral",
    loadUnit: null,
    distanceUnit: null,
    primaryValueLabel: "Duration",
    secondaryValueLabel: null,
    reviewGroup: "explicit_reviewed",
    note: "QA-reported timed isometric hold."
  },
  {
    normalizedName: "lateral band walk",
    repsPattern: /^\d+\s*(per side|each side|steps each way|steps per side)\b/i,
    trackingType: "reps_only",
    unilateralMode: "same_each_side",
    loadUnit: null,
    distanceUnit: null,
    primaryValueLabel: "Reps",
    secondaryValueLabel: null,
    reviewGroup: "explicit_reviewed",
    note: "QA-reported band walk counted with one shared per-side value."
  },
  {
    normalizedName: "half kneeling hip flexor stretch",
    repsPattern: /^\d+\s*(sec|secs|second|seconds|s)\s*(per side|each side)\b/i,
    trackingType: "duration",
    unilateralMode: "same_each_side",
    loadUnit: null,
    distanceUnit: null,
    primaryValueLabel: "Duration",
    secondaryValueLabel: null,
    reviewGroup: "explicit_reviewed",
    note: "QA-reported timed stretch per side."
  },
  {
    normalizedName: "dead bug",
    repsPattern: /^\d+\s*(per side|each side)\b/i,
    trackingType: "reps_only",
    unilateralMode: "same_each_side",
    loadUnit: null,
    distanceUnit: null,
    primaryValueLabel: "Reps",
    secondaryValueLabel: null,
    reviewGroup: "explicit_reviewed",
    note: "QA-reported core exercise counted per side."
  }
];

export const issue14AmbiguousDistanceOnlyPatterns = [
  "meter/mile prescriptions without an intended time entry",
  "carries prescribed by distance when only load plus distance would be truthful",
  "marches/shuffles/runs where the prescription is distance-only rather than time or distance plus elapsed time"
];

export function normalizeExerciseBackfillName(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function findIssue14BackfillMapping(input: { sourceExerciseId?: string | null; name: string; reps: string; currentTrackingType?: ExerciseTrackingType | null; currentUnilateralMode?: UnilateralMode | null; }) {
  if (input.currentTrackingType && input.currentTrackingType !== "completion") return null;
  const sourceId = input.sourceExerciseId?.trim() || null;
  const normalizedName = normalizeExerciseBackfillName(input.name);
  return issue14ExerciseMetadataBackfillMappings.find((mapping) => {
    if (mapping.sourceExerciseId && mapping.sourceExerciseId === sourceId) return true;
    if (mapping.normalizedName && mapping.normalizedName === normalizedName) return mapping.repsPattern ? mapping.repsPattern.test(input.reps.trim()) : true;
    return false;
  }) ?? null;
}
