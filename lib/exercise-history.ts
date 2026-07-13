import type { ExerciseTrackingType, UnilateralMode } from "@/lib/types";
import { formatDuration } from "@/lib/session-metrics";

export type ExerciseHistorySet = {
  status: string;
  actualLoad: number | null;
  actualReps: number | null;
  actualDurationSeconds: number | null;
  actualDistance: number | null;
  actualLeftLoad: number | null;
  actualLeftReps: number | null;
  actualLeftDurationSeconds: number | null;
  actualLeftDistance: number | null;
  actualRightLoad: number | null;
  actualRightReps: number | null;
  actualRightDurationSeconds: number | null;
  actualRightDistance: number | null;
};

export type ExerciseHistoryEntry = {
  sessionId: string;
  exerciseResultId: string;
  completedOn: string;
  workoutName: string;
  exerciseName: string;
  trackingType: ExerciseTrackingType;
  unilateralMode: UnilateralMode;
  loadUnit: "lb" | "kg" | null;
  distanceUnit: "mi" | "km" | "m" | null;
  completionStatus: string;
  sets: ExerciseHistorySet[];
};

function hasNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatNumber(value: number) {
  return Number(value.toFixed(2)).toString();
}

export function formatHistoryDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date =
    year && month && day
      ? new Date(Date.UTC(year, month - 1, day))
      : new Date(dateKey);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatTrackingDisplay(input: {
  trackingType?: ExerciseTrackingType;
  unilateralMode?: UnilateralMode;
  loadUnit?: "lb" | "kg" | null;
  distanceUnit?: "mi" | "km" | "m" | null;
}) {
  const tracking = input.trackingType ?? "completion";
  const base =
    tracking === "weight_reps"
      ? `Weight and reps · ${input.loadUnit ?? "lb"}`
      : tracking === "reps_only"
        ? "Reps"
        : tracking === "duration"
          ? "Duration"
          : tracking === "distance_duration"
            ? `Distance and time · ${input.distanceUnit ?? "mi"}`
            : tracking === "distance"
              ? `Distance · ${input.distanceUnit ?? "mi"}`
              : "Completion";
  if (input.unilateralMode === "same_each_side") return `${base} · Each side`;
  if (input.unilateralMode === "independent_sides")
    return `${base} · Left and right separately`;
  return base;
}

function formatSidePair(
  left: number | null,
  right: number | null,
  formatter: (value: number) => string,
) {
  const leftText = hasNumber(left) ? formatter(left) : "—";
  const rightText = hasNumber(right) ? formatter(right) : "—";
  return `L ${leftText} · R ${rightText}`;
}

export function formatHistorySet(
  set: ExerciseHistorySet,
  entry: Pick<
    ExerciseHistoryEntry,
    "trackingType" | "unilateralMode" | "loadUnit" | "distanceUnit"
  >,
) {
  const loadUnit = entry.loadUnit ?? "lb";
  const distanceUnit = entry.distanceUnit ?? "mi";
  if (entry.unilateralMode === "independent_sides") {
    if (entry.trackingType === "weight_reps") {
      return `L ${hasNumber(set.actualLeftLoad) ? `${formatNumber(set.actualLeftLoad)} ${loadUnit}` : "—"} × ${hasNumber(set.actualLeftReps) ? formatNumber(set.actualLeftReps) : "—"} · R ${hasNumber(set.actualRightLoad) ? `${formatNumber(set.actualRightLoad)} ${loadUnit}` : "—"} × ${hasNumber(set.actualRightReps) ? formatNumber(set.actualRightReps) : "—"}`;
    }
    if (entry.trackingType === "duration")
      return formatSidePair(
        set.actualLeftDurationSeconds,
        set.actualRightDurationSeconds,
        formatDuration,
      );
    if (
      entry.trackingType === "distance" ||
      entry.trackingType === "distance_duration"
    )
      return formatSidePair(
        set.actualLeftDistance,
        set.actualRightDistance,
        (v) => `${formatNumber(v)} ${distanceUnit}`,
      );
    if (entry.trackingType === "reps_only")
      return formatSidePair(
        set.actualLeftReps,
        set.actualRightReps,
        (v) => `${formatNumber(v)}`,
      );
  }
  const perSide = entry.unilateralMode === "same_each_side" ? "/side" : "";
  if (entry.trackingType === "weight_reps")
    return `${hasNumber(set.actualLoad) ? `${formatNumber(set.actualLoad)} ${loadUnit}` : "—"} × ${hasNumber(set.actualReps) ? formatNumber(set.actualReps) : "—"}${perSide}`;
  if (entry.trackingType === "reps_only")
    return hasNumber(set.actualReps)
      ? `${formatNumber(set.actualReps)} reps${perSide}`
      : "— reps";
  if (entry.trackingType === "duration")
    return hasNumber(set.actualDurationSeconds)
      ? `${formatDuration(set.actualDurationSeconds)}${perSide}`
      : "—";
  if (entry.trackingType === "distance_duration") {
    const distance = hasNumber(set.actualDistance)
      ? `${formatNumber(set.actualDistance)} ${distanceUnit}`
      : "—";
    const duration = hasNumber(set.actualDurationSeconds)
      ? formatDuration(set.actualDurationSeconds)
      : "—";
    return `${distance}${perSide} · ${duration}`;
  }
  if (entry.trackingType === "distance")
    return hasNumber(set.actualDistance)
      ? `${formatNumber(set.actualDistance)} ${distanceUnit}${perSide}`
      : `— ${distanceUnit}`;
  return "Completed";
}
