import type { ExerciseTrackingType, UnilateralMode } from "@/lib/types";

export type SessionStatus = "Completed" | "Partial";

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

function asNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function sideSum(left: number | null, right: number | null) {
  return asNumber(left) + asNumber(right);
}

function setReps(set: SetMetricRow, mode: UnilateralMode) {
  if (mode === "independent_sides") return sideSum(set.actual_left_reps, set.actual_right_reps);
  const reps = asNumber(set.actual_reps);
  return mode === "same_each_side" ? reps * 2 : reps;
}

function setDuration(set: SetMetricRow, mode: UnilateralMode) {
  if (mode === "independent_sides") return sideSum(set.actual_left_duration_seconds, set.actual_right_duration_seconds);
  const seconds = asNumber(set.actual_duration_seconds);
  return mode === "same_each_side" ? seconds * 2 : seconds;
}

function setDistance(set: SetMetricRow, mode: UnilateralMode) {
  if (mode === "independent_sides") return sideSum(set.actual_left_distance, set.actual_right_distance);
  const distance = asNumber(set.actual_distance);
  return mode === "same_each_side" ? distance * 2 : distance;
}

function setLoadVolume(set: SetMetricRow, mode: UnilateralMode) {
  if (mode === "independent_sides") {
    return asNumber(set.actual_left_load) * asNumber(set.actual_left_reps) + asNumber(set.actual_right_load) * asNumber(set.actual_right_reps);
  }
  const volume = asNumber(set.actual_load) * asNumber(set.actual_reps);
  return mode === "same_each_side" ? volume * 2 : volume;
}

export function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes > 0 ? `${minutes}:${remainder.toString().padStart(2, "0")}` : `${remainder}s`;
}

export function deriveSessionMetrics(session: SessionMetricRow): SessionMetrics {
  const exercises = [...(session.exercise_results ?? [])].sort((a, b) => a.exercise_order - b.exercise_order).map((exercise) => {
    const sets = exercise.exercise_set_results ?? [];
    const completedSets = sets.filter((set) => set.status === "completed");
    const totalReps = completedSets.reduce((sum, set) => sum + setReps(set, exercise.unilateral_mode), 0);
    const loadVolume = completedSets.reduce((sum, set) => sum + setLoadVolume(set, exercise.unilateral_mode), 0);
    const durationSeconds = completedSets.reduce((sum, set) => sum + setDuration(set, exercise.unilateral_mode), 0);
    const distance = completedSets.reduce((sum, set) => sum + setDistance(set, exercise.unilateral_mode), 0);
    const summary = exercise.tracking_type === "distance_duration"
      ? `${Number(distance.toFixed(2))} ${exercise.distance_unit ?? ""} · ${formatDuration(durationSeconds)}`.trim()
      : exercise.tracking_type === "distance"
        ? `${Number(distance.toFixed(2))} ${exercise.distance_unit ?? ""}`.trim()
        : exercise.tracking_type === "duration"
          ? `${completedSets.length} timed sets · ${formatDuration(durationSeconds)} total`
          : exercise.tracking_type === "weight_reps"
            ? `${completedSets.length}/${sets.length} sets · ${Math.round(loadVolume)} ${exercise.load_unit ?? ""} volume`.trim()
            : exercise.tracking_type === "reps_only"
              ? `${completedSets.length}/${sets.length} sets · ${totalReps} reps`
              : `${completedSets.length}/${sets.length} sets`;
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
      completedSets: completedSets.length,
      totalSets: sets.length,
      totalReps,
      loadVolume,
      durationSeconds,
      distance,
      summary,
    };
  });
  const completedSets = exercises.reduce((sum, exercise) => sum + exercise.completedSets, 0);
  const totalSets = exercises.reduce((sum, exercise) => sum + exercise.totalSets, 0);
  const completedExercises = exercises.filter((exercise) => exercise.totalSets > 0 && exercise.completedSets === exercise.totalSets).length;
  const performedExercises = exercises.filter((exercise) => exercise.completedSets > 0).length;
  const distanceExercise = exercises.find((exercise) => exercise.distance > 0 && exercise.distanceUnit);
  const workDurationSeconds = exercises.reduce((sum, exercise) => sum + exercise.durationSeconds, 0);
  const distance = distanceExercise ? exercises.filter((exercise) => exercise.distanceUnit === distanceExercise.distanceUnit).reduce((sum, exercise) => sum + exercise.distance, 0) : 0;
  const status: SessionStatus = session.completed && (totalSets === 0 || completedSets >= totalSets) ? "Completed" : "Partial";
  const summary = distanceExercise
    ? `${Number(distance.toFixed(2))} ${distanceExercise.distanceUnit} · ${formatDuration(workDurationSeconds)}`
    : workDurationSeconds > 0
      ? `${completedSets} timed sets · ${formatDuration(workDurationSeconds)} total`
      : `${performedExercises || completedExercises} exercises · ${completedSets}/${totalSets} sets`;
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
    distanceUnit: distanceExercise?.distanceUnit ?? null,
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
