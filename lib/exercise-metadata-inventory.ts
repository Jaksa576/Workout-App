import { exerciseCatalog } from "@/lib/exercise-library";
import type { ExerciseTrackingType, UnilateralMode } from "@/lib/types";

export type InventoryReviewStatus = "reviewed";
export type FutureMetricFlag = "load_distance_candidate" | null;

const exerciseTrackingTypes = ["weight_reps", "reps_only", "duration", "distance", "distance_duration", "completion"] as const satisfies readonly ExerciseTrackingType[];

export type ExerciseMetadataInventoryItem = {
  inventoryKey: string;
  normalizedName: string;
  aliases: string[];
  prescriptionMatcher: { sets: number; reps: string; rest: string };
  trackingType: ExerciseTrackingType;
  unilateralMode: UnilateralMode;
  loadUnit: "lb" | "kg" | null;
  distanceUnit: "mi" | "km" | "m" | null;
  primaryValueLabel: string | null;
  secondaryValueLabel: string | null;
  reviewStatus: InventoryReviewStatus;
  rationale: string;
  futureMetricFlag: FutureMetricFlag;
  affectedRowCount: number | null;
  intentionalCompletionReason: string | null;
};

function normalizeExerciseName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function rationaleFor(item: { trackingType: ExerciseTrackingType; loadUnit: string | null; distanceUnit: string | null; equipmentTags: string[]; reps: string; name: string }) {
  if (item.trackingType === "weight_reps") return "External load and repetitions are meaningful progression signals for this catalog exercise.";
  if (item.trackingType === "duration") return "Prescription is intentionally time-based, so duration is the primary set metric.";
  if (item.trackingType === "distance") return "Prescription is intentionally distance-based, so distance is the primary set metric.";
  if (item.trackingType === "distance_duration") return "Both distance and elapsed time are useful history/progression signals for this endurance exercise.";
  if (item.trackingType === "completion") return "No supported numeric, timed, or distance metric truthfully represents this activity.";
  return "Count-based bodyweight, mobility, jump, drill, or step work where load is not the default progression signal.";
}

function futureMetricFlagFor(item: { id: string; movementPattern: string; trackingType: ExerciseTrackingType }) {
  if (item.trackingType === "weight_reps" && item.movementPattern === "carry") return "load_distance_candidate" as const;
  return null;
}

export const exerciseMetadataInventory: ExerciseMetadataInventoryItem[] = exerciseCatalog.map((item) => ({
  inventoryKey: item.id,
  normalizedName: normalizeExerciseName(item.name),
  aliases: [item.name],
  prescriptionMatcher: { sets: item.sets, reps: item.reps, rest: item.rest },
  trackingType: item.trackingType,
  unilateralMode: item.unilateralMode,
  loadUnit: item.loadUnit,
  distanceUnit: item.distanceUnit,
  primaryValueLabel: item.primaryValueLabel,
  secondaryValueLabel: item.secondaryValueLabel,
  reviewStatus: "reviewed",
  rationale: rationaleFor(item),
  futureMetricFlag: futureMetricFlagFor(item),
  affectedRowCount: null,
  intentionalCompletionReason: item.trackingType === "completion" ? rationaleFor(item) : null
}));

export function findInventoryItemsByNormalizedName(name: string) {
  const normalized = normalizeExerciseName(name);
  return exerciseMetadataInventory.filter((item) => item.normalizedName === normalized || item.aliases.some((alias) => normalizeExerciseName(alias) === normalized));
}

export function getInventoryTotals() {
  const initialTotals = Object.fromEntries(exerciseTrackingTypes.map((trackingType) => [trackingType, { names: 0, rows: null }])) as Record<
    ExerciseTrackingType,
    { names: number; rows: number | null }
  >;

  return exerciseMetadataInventory.reduce<Record<ExerciseTrackingType, { names: number; rows: number | null }>>((totals, item) => {
    totals[item.trackingType].names += 1;
    totals[item.trackingType].rows = null;
    return totals;
  }, initialTotals);
}
