import type { ExerciseTrackingType, UnilateralMode } from "@/lib/types";

export type SessionStatus = "Completed" | "Partial";

type Unit = "lb" | "kg" | "mi" | "km" | "m";

export type SetMetricRow = {
  status: string;
  actual_load: number | null;
  actual_reps: number | null;
  actual_duration_seconds: number | null;
  actual_distance: number | null;
  actual_left_load: number | null;
  actual_left_reps: number | null;
  actual_left_duration_seconds: number | null;
  actual_left_distance: number | null;
  actual_right_load: number | null;
  actual_right_reps: number | null;
  actual_right_duration_seconds: number | null;
  actual_right_distance: number | null;
};

export type ExerciseMetricRow = {
  id: string;
  exercise_entry_id: string | null;
  source_exercise_id: string | null;
  exercise_name: string;
  exercise_order: number;
  tracking_type: ExerciseTrackingType;
  unilateral_mode: UnilateralMode;
  load_unit: "lb" | "kg" | null;
  distance_unit: "mi" | "km" | "m" | null;
  completion_status: string;
  exercise_set_results?: SetMetricRow[] | null;
};

export type SessionMetricRow = {
  id: string;
  completed: boolean;
  elapsed_seconds?: number | null;
  completed_on: string;
  workout_template_id: string | null;
  workout_name_snapshot: string;
  exercise_results?: ExerciseMetricRow[] | null;
};

export type ExerciseMetrics = {
  exerciseResultId: string;
  exerciseEntryId: string | null;
  sourceExerciseId: string | null;
  exerciseName: string;
  exerciseOrder: number;
  trackingType: ExerciseTrackingType;
  unilateralMode: UnilateralMode;
  loadUnit: "lb" | "kg" | null;
  distanceUnit: "mi" | "km" | "m" | null;
  completedSets: number;
  totalSets: number;
  totalReps: number;
  loadVolume: number;
  durationSeconds: number;
  distance: number;
  hasReps: boolean;
  hasLoadVolume: boolean;
  hasDuration: boolean;
  hasDistance: boolean;
  summary: string;
};

export type SessionMetrics = {
  status: SessionStatus;
  elapsedSeconds: number;
  completedSets: number;
  totalSets: number;
  completedExercises: number;
  performedExercises: number;
  totalExercises: number;
  loadVolume: number;
  totalReps: number;
  workDurationSeconds: number;
  distance: number;
  distanceUnit: "mi" | "km" | "m" | null;
  summary: string;
  exercises: ExerciseMetrics[];
};

function isNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function sideMetric(left: number | null, right: number | null) {
  const hasLeft = isNumber(left);
  const hasRight = isNumber(right);
  return { hasValue: hasLeft || hasRight, value: (hasLeft ? left : 0) + (hasRight ? right : 0) };
}

function scalarMetric(value: number | null, mode: UnilateralMode) {
  if (!isNumber(value)) return { hasValue: false, value: 0 };
  return { hasValue: true, value: mode === "same_each_side" ? value * 2 : value };
}

function setReps(set: SetMetricRow, mode: UnilateralMode) {
  return mode === "independent_sides" ? sideMetric(set.actual_left_reps, set.actual_right_reps) : scalarMetric(set.actual_reps, mode);
}

function setDuration(set: SetMetricRow, mode: UnilateralMode) {
  return mode === "independent_sides"
    ? sideMetric(set.actual_left_duration_seconds, set.actual_right_duration_seconds)
    : scalarMetric(set.actual_duration_seconds, mode);
}

function setDistance(set: SetMetricRow, mode: UnilateralMode) {
  return mode === "independent_sides" ? sideMetric(set.actual_left_distance, set.actual_right_distance) : scalarMetric(set.actual_distance, mode);
}

function setLoadVolume(set: SetMetricRow, mode: UnilateralMode) {
  if (mode === "independent_sides") {
    const left = isNumber(set.actual_left_load) && isNumber(set.actual_left_reps) ? set.actual_left_load * set.actual_left_reps : 0;
    const right = isNumber(set.actual_right_load) && isNumber(set.actual_right_reps) ? set.actual_right_load * set.actual_right_reps : 0;
    return { hasValue: left > 0 || right > 0 || (isNumber(set.actual_left_load) && isNumber(set.actual_left_reps)) || (isNumber(set.actual_right_load) && isNumber(set.actual_right_reps)), value: left + right };
  }
  if (!isNumber(set.actual_load) || !isNumber(set.actual_reps)) return { hasValue: false, value: 0 };
  const volume = set.actual_load * set.actual_reps;
  return { hasValue: true, value: mode === "same_each_side" ? volume * 2 : volume };
}

function addMetric(total: { value: number; hasValue: boolean }, metric: { value: number; hasValue: boolean }) {
  if (metric.hasValue) {
    total.value += metric.value;
    total.hasValue = true;
  }
}

function plural(count: number, singular: string, pluralText = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralText}`;
}

function setsSummary(completed: number, total: number) {
  return `${completed}/${total} ${total === 1 ? "set" : "sets"}`;
}

export function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes > 0 ? `${minutes}:${remainder.toString().padStart(2, "0")}` : `${remainder}s`;
}

function formatDistance(distance: number, unit: Unit | null) {
  return `${Number(distance.toFixed(2))}${unit ? ` ${unit}` : ""}`;
}

function exerciseSummary(exercise: ExerciseMetricRow, values: Pick<ExerciseMetrics, "completedSets" | "totalSets" | "totalReps" | "loadVolume" | "durationSeconds" | "distance" | "hasReps" | "hasLoadVolume" | "hasDuration" | "hasDistance">) {
  if (exercise.tracking_type === "weight_reps" && values.hasLoadVolume) return `${setsSummary(values.completedSets, values.totalSets)} · ${Math.round(values.loadVolume)} ${exercise.load_unit ?? ""} volume`.trim();
  if (exercise.tracking_type === "reps_only" && values.hasReps) return `${setsSummary(values.completedSets, values.totalSets)} · ${values.totalReps} reps`;
  if (exercise.tracking_type === "duration" && values.hasDuration) return `${setsSummary(values.completedSets, values.totalSets)} · ${formatDuration(values.durationSeconds)} total`;
  if (exercise.tracking_type === "distance" && values.hasDistance) return formatDistance(values.distance, exercise.distance_unit);
  if (exercise.tracking_type === "distance_duration") {
    const parts = [];
    if (values.hasDistance) parts.push(formatDistance(values.distance, exercise.distance_unit));
    if (values.hasDuration) parts.push(formatDuration(values.durationSeconds));
    if (parts.length) return parts.join(" · ");
  }
  return `${setsSummary(values.completedSets, values.totalSets)} completed`;
}

export function deriveSessionMetrics(session: SessionMetricRow): SessionMetrics {
  const exercises = [...(session.exercise_results ?? [])].sort((a, b) => a.exercise_order - b.exercise_order).map((exercise) => {
    const sets = exercise.exercise_set_results ?? [];
    const completedSets = sets.filter((set) => set.status === "completed");
    const reps = { value: 0, hasValue: false };
    const loadVolume = { value: 0, hasValue: false };
    const duration = { value: 0, hasValue: false };
    const distance = { value: 0, hasValue: false };
    for (const set of completedSets) {
      addMetric(reps, setReps(set, exercise.unilateral_mode));
      addMetric(loadVolume, setLoadVolume(set, exercise.unilateral_mode));
      addMetric(duration, setDuration(set, exercise.unilateral_mode));
      addMetric(distance, setDistance(set, exercise.unilateral_mode));
    }
    const values = {
      completedSets: completedSets.length,
      totalSets: sets.length,
      totalReps: reps.value,
      loadVolume: loadVolume.value,
      durationSeconds: duration.value,
      distance: distance.value,
      hasReps: reps.hasValue,
      hasLoadVolume: loadVolume.hasValue,
      hasDuration: duration.hasValue,
      hasDistance: distance.hasValue,
    };
    return {
      exerciseResultId: exercise.id,
      exerciseEntryId: exercise.exercise_entry_id,
      sourceExerciseId: exercise.source_exercise_id,
      exerciseName: exercise.exercise_name,
      exerciseOrder: exercise.exercise_order,
      trackingType: exercise.tracking_type,
      unilateralMode: exercise.unilateral_mode,
      loadUnit: exercise.load_unit,
      distanceUnit: exercise.distance_unit,
      ...values,
      summary: exerciseSummary(exercise, values),
    };
  });
  const completedSets = exercises.reduce((sum, exercise) => sum + exercise.completedSets, 0);
  const totalSets = exercises.reduce((sum, exercise) => sum + exercise.totalSets, 0);
  const completedExercises = exercises.filter((exercise) => exercise.totalSets > 0 && exercise.completedSets === exercise.totalSets).length;
  const performedExercises = exercises.filter((exercise) => exercise.completedSets > 0).length;
  const workDurationSeconds = exercises.reduce((sum, exercise) => sum + exercise.durationSeconds, 0);
  const distanceGroups = new Map<string, ExerciseMetrics[]>();
  for (const exercise of exercises) {
    if (!exercise.hasDistance || !exercise.distanceUnit) continue;
    const unit = exercise.distanceUnit;
    distanceGroups.set(unit, [...(distanceGroups.get(unit) ?? []), exercise]);
  }
  const compatibleDistance = distanceGroups.size === 1 ? [...distanceGroups.values()][0] ?? [] : [];
  const distance = compatibleDistance.reduce((sum, exercise) => sum + exercise.distance, 0);
  const distanceUnit = compatibleDistance[0]?.distanceUnit ?? null;
  const compatibleDuration = compatibleDistance.length > 0 && exercises.every((exercise) => !exercise.hasDuration || compatibleDistance.includes(exercise));
  const hasOnlyDuration = exercises.some((exercise) => exercise.hasDuration) && exercises.every((exercise) => !exercise.hasDistance && !exercise.hasLoadVolume && !exercise.hasReps);
  const status: SessionStatus = session.completed && (totalSets === 0 || completedSets >= totalSets) ? "Completed" : "Partial";
  const summary = distanceUnit && compatibleDistance.length > 0 && (compatibleDuration || !workDurationSeconds)
    ? [formatDistance(distance, distanceUnit), compatibleDuration && workDurationSeconds ? formatDuration(workDurationSeconds) : null].filter(Boolean).join(" · ")
    : hasOnlyDuration
      ? `${setsSummary(completedSets, totalSets)} · ${formatDuration(workDurationSeconds)} total`
      : `${plural(performedExercises || completedExercises, "exercise")} · ${setsSummary(completedSets, totalSets)}`;
  return {
    status,
    elapsedSeconds: session.elapsed_seconds ?? 0,
    completedSets,
    totalSets,
    completedExercises,
    performedExercises,
    totalExercises: exercises.length,
    loadVolume: exercises.reduce((sum, exercise) => sum + exercise.loadVolume, 0),
    totalReps: exercises.reduce((sum, exercise) => sum + exercise.totalReps, 0),
    workDurationSeconds,
    distance,
    distanceUnit,
    summary,
    exercises,
  };
}

export function buildTrendSeries(sessions: SessionMetricRow[]) {
  return sessions.map((session) => ({
    sessionId: session.id,
    date: session.completed_on,
    workoutTemplateId: session.workout_template_id,
    workoutName: session.workout_name_snapshot,
    metrics: deriveSessionMetrics(session),
  })).sort((a, b) => a.date.localeCompare(b.date));
}
