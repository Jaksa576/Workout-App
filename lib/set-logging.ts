import type { ExerciseTrackingType, UnilateralMode, WorkoutSetInput } from "@/lib/types";

export type SetValueDefaults = {
  actualLoad: number | null;
  actualReps: number | null;
  actualDurationSeconds?: number | null;
  actualDistance?: number | null;
  actualLeftReps?: number | null;
  actualRightReps?: number | null;
  actualLeftDurationSeconds?: number | null;
  actualRightDurationSeconds?: number | null;
};

export function isSupportedMetricTrackingType(trackingType?: ExerciseTrackingType) {
  return trackingType === "weight_reps" || trackingType === "reps_only" || trackingType === "duration" || trackingType === "distance_duration";
}

export function supportsAddedSets(trackingType?: ExerciseTrackingType) {
  return isSupportedMetricTrackingType(trackingType);
}

function isNonNegativeNumber(value: number | null | undefined) {
  return value === null || value === undefined || (Number.isFinite(value) && value >= 0);
}

function isNonNegativeInteger(value: number | null | undefined) {
  return value === null || value === undefined || (Number.isInteger(value) && value >= 0);
}

export function isSuppliedMetricValuesValid(
  trackingType: ExerciseTrackingType | undefined,
  row: WorkoutSetInput,
  unilateralMode: UnilateralMode = "bilateral",
) {
  if (!isSupportedMetricTrackingType(trackingType)) return false;
  const independent = unilateralMode === "independent_sides";
  const scalarEmpty = row.actualLoad == null && row.actualReps == null && row.actualDurationSeconds == null && row.actualDistance == null;
  const sideEmpty = row.actualLeftLoad == null && row.actualRightLoad == null && row.actualLeftReps == null && row.actualRightReps == null && row.actualLeftDurationSeconds == null && row.actualRightDurationSeconds == null && row.actualLeftDistance == null && row.actualRightDistance == null;
  if (independent ? !scalarEmpty : !sideEmpty) return false;
  if (!isNonNegativeNumber(row.actualLoad) || !isNonNegativeInteger(row.actualReps) || !isNonNegativeInteger(row.actualDurationSeconds) || !isNonNegativeNumber(row.actualDistance)) return false;
  if (!isNonNegativeNumber(row.actualLeftLoad) || !isNonNegativeNumber(row.actualRightLoad) || !isNonNegativeInteger(row.actualLeftReps) || !isNonNegativeInteger(row.actualRightReps) || !isNonNegativeInteger(row.actualLeftDurationSeconds) || !isNonNegativeInteger(row.actualRightDurationSeconds) || !isNonNegativeNumber(row.actualLeftDistance) || !isNonNegativeNumber(row.actualRightDistance)) return false;
  if (trackingType !== "weight_reps" && (row.actualLoad != null || row.actualLeftLoad != null || row.actualRightLoad != null)) return false;
  if (trackingType !== "weight_reps" && trackingType !== "reps_only" && (row.actualReps != null || row.actualLeftReps != null || row.actualRightReps != null)) return false;
  if (trackingType !== "duration" && trackingType !== "distance_duration" && (row.actualDurationSeconds != null || row.actualLeftDurationSeconds != null || row.actualRightDurationSeconds != null)) return false;
  if (trackingType !== "distance_duration" && (row.actualDistance != null || row.actualLeftDistance != null || row.actualRightDistance != null)) return false;
  return true;
}

export function isSetCompleteable(trackingType: ExerciseTrackingType | undefined, row: WorkoutSetInput, unilateralMode: UnilateralMode = "bilateral") {
  if (trackingType === "completion") return true;
  if (!isSuppliedMetricValuesValid(trackingType, row, unilateralMode)) return false;
  const independent = unilateralMode === "independent_sides";
  if (trackingType === "weight_reps") return independent ? row.actualLeftLoad != null && row.actualRightLoad != null && row.actualLeftReps != null && row.actualRightReps != null : row.actualLoad != null && row.actualReps != null;
  if (trackingType === "reps_only") return independent ? row.actualLeftReps != null && row.actualRightReps != null : row.actualReps != null;
  if (trackingType === "duration") return independent ? row.actualLeftDurationSeconds != null && row.actualRightDurationSeconds != null : row.actualDurationSeconds != null;
  if (trackingType === "distance_duration") return independent ? row.actualLeftDistance != null && row.actualRightDistance != null && row.actualLeftDurationSeconds != null && row.actualRightDurationSeconds != null : row.actualDistance != null && row.actualDurationSeconds != null;
  return false;
}

export function applyMetricSetEdit(rowOrTrackingType: WorkoutSetInput | ExerciseTrackingType | undefined, rowOrPatch: WorkoutSetInput | Partial<WorkoutSetInput>, maybePatch?: Partial<WorkoutSetInput>): WorkoutSetInput {
  const row = maybePatch ? (rowOrPatch as WorkoutSetInput) : (rowOrTrackingType as WorkoutSetInput);
  const patch = maybePatch ?? (rowOrPatch as Partial<WorkoutSetInput>);
  return { ...row, ...patch };
}

export function parseDurationInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) return Number.parseInt(trimmed, 10);
  const parts = trimmed.split(":");
  if (parts.length < 2 || parts.length > 3 || !parts.every((part) => /^\d+$/.test(part))) return Number.NaN;
  const numbers = parts.map((part) => Number.parseInt(part, 10));
  const [hours, minutes, seconds] = parts.length === 3 ? numbers : [0, numbers[0], numbers[1]];
  if (minutes >= 60 || seconds >= 60) return Number.NaN;
  return hours * 3600 + minutes * 60 + seconds;
}

export function formatDurationInput(seconds: number | null | undefined) {
  if (seconds == null) return "";
  const safe = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

export function formatPreviousSet(row?: SetValueDefaults, trackingType?: ExerciseTrackingType, unit?: string | null, unilateralMode: UnilateralMode = "bilateral") {
  if (!row) return "—";
  const sideSuffix = unilateralMode === "same_each_side" ? "/side" : "";
  if (unilateralMode === "independent_sides") {
    if (trackingType === "duration") return `${formatDurationInput(row.actualLeftDurationSeconds)} / ${formatDurationInput(row.actualRightDurationSeconds)}`;
    return `${row.actualLeftReps ?? "—"} / ${row.actualRightReps ?? "—"}`;
  }
  if (trackingType === "weight_reps") return row.actualLoad != null ? `${row.actualLoad} ${unit ?? "lb"} × ${row.actualReps ?? "—"}${sideSuffix}` : `${row.actualReps ?? "—"} reps${sideSuffix}`;
  if (trackingType === "reps_only") return `${row.actualReps ?? "—"} reps${sideSuffix}`;
  if (trackingType === "duration") return `${formatDurationInput(row.actualDurationSeconds)}${sideSuffix}`;
  if (trackingType === "distance_duration") return `${row.actualDistance ?? "—"} ${unit ?? "mi"} · ${formatDurationInput(row.actualDurationSeconds)}`;
  return "—";
}

export function parseDeterministicPrescriptionReps(reps: string) {
  const trimmed = reps.trim().toLowerCase();
  const leadingNumber = trimmed.match(/^\d+/)?.[0];
  if (!leadingNumber) return null;
  return Number.parseInt(leadingNumber, 10);
}

export function getInitialSetValues(input: { setIndex: number; previousSetDefaults?: SetValueDefaults[]; prescribedReps: string; defaultLoad?: number | null; }): SetValueDefaults {
  const exactPrevious = input.previousSetDefaults?.[input.setIndex];
  if (exactPrevious) return exactPrevious;
  const mostRecentPrevious = input.previousSetDefaults?.find((set) => set.actualLoad !== null || set.actualReps !== null || set.actualDurationSeconds != null || set.actualDistance != null);
  if (mostRecentPrevious) return mostRecentPrevious;
  return { actualLoad: input.defaultLoad ?? null, actualReps: parseDeterministicPrescriptionReps(input.prescribedReps) };
}

export function calculateSetProgress(input: { exercises: Array<{ id: string; sets: number; trackingType?: ExerciseTrackingType }>; setResults: WorkoutSetInput[]; checkedExerciseIds: string[]; }) {
  let completed = 0; let total = 0;
  for (const exercise of input.exercises) {
    if (isSupportedMetricTrackingType(exercise.trackingType)) {
      const rows = input.setResults.filter((row) => row.exerciseEntryId === exercise.id);
      total += exercise.sets + rows.filter((row) => row.setKind === "added").length;
      completed += rows.filter((row) => row.status === "completed").length;
    } else { total += exercise.sets || 1; if (input.checkedExerciseIds.includes(exercise.id)) completed += exercise.sets || 1; }
  }
  return { completed, total };
}

export type CanonicalSetMergeResult = { ok: true; rows: WorkoutSetInput[] } | { ok: false; error: string };

export function buildCanonicalMetricSetRows(input: { exerciseEntryId: string; prescribedSetCount: number; submittedRows: WorkoutSetInput[]; defaults?: SetValueDefaults[]; }): CanonicalSetMergeResult {
  const prescribedByIndex = new Map<number, WorkoutSetInput>();
  for (const row of input.submittedRows) {
    if (row.setKind !== "prescribed") continue;
    if (row.prescribedSetIndex === null || row.prescribedSetIndex < 0 || row.prescribedSetIndex >= input.prescribedSetCount) return { ok: false, error: "Submitted prescribed set index is invalid." };
    if (prescribedByIndex.has(row.prescribedSetIndex)) return { ok: false, error: "Duplicate prescribed set indexes are not allowed." };
    prescribedByIndex.set(row.prescribedSetIndex, row);
  }
  const prescribed = Array.from({ length: input.prescribedSetCount }, (_, index) => ({
    ...(prescribedByIndex.get(index) ?? { exerciseEntryId: input.exerciseEntryId, setId: `${input.exerciseEntryId}:prescribed:${index}`, status: "incomplete" as const, ...(input.defaults?.[index] ?? {}) }),
    exerciseEntryId: input.exerciseEntryId, setOrder: index, prescribedSetIndex: index, setKind: "prescribed" as const,
  }));
  const added = input.submittedRows.filter((row) => row.setKind === "added").sort((a, b) => a.setOrder - b.setOrder).map((row, index) => ({ ...row, exerciseEntryId: input.exerciseEntryId, setOrder: input.prescribedSetCount + index, prescribedSetIndex: null, setKind: "added" as const }));
  return { ok: true, rows: [...prescribed, ...added] };
}
