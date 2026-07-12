import type { ExerciseTrackingType, WorkoutSetInput } from "@/lib/types";

export type SetValueDefaults = {
  actualLoad: number | null;
  actualReps: number | null;
};

export function isSupportedMetricTrackingType(trackingType?: ExerciseTrackingType) {
  return trackingType === "weight_reps" || trackingType === "reps_only";
}

export function isSuppliedMetricValuesValid(
  trackingType: ExerciseTrackingType | undefined,
  row: Pick<WorkoutSetInput, "actualLoad" | "actualReps">,
) {
  const loadAllowed = trackingType === "weight_reps";
  const validLoad =
    row.actualLoad === null ||
    row.actualLoad === undefined ||
    (loadAllowed && Number.isFinite(row.actualLoad) && row.actualLoad >= 0);
  const validReps =
    row.actualReps === null ||
    row.actualReps === undefined ||
    (Number.isInteger(row.actualReps) && row.actualReps >= 0);

  return isSupportedMetricTrackingType(trackingType) && validLoad && validReps;
}

export function applyMetricSetEdit(
  _trackingType: ExerciseTrackingType | undefined,
  row: WorkoutSetInput,
  patch: Pick<WorkoutSetInput, "actualLoad"> | Pick<WorkoutSetInput, "actualReps">,
): WorkoutSetInput {
  return { ...row, ...patch };
}

export function parseDeterministicPrescriptionReps(reps: string) {
  const trimmed = reps.trim().toLowerCase();
  const leadingNumber = trimmed.match(/^\d+/)?.[0];
  if (!leadingNumber) return null;
  return Number.parseInt(leadingNumber, 10);
}

export function getInitialSetValues(input: {
  setIndex: number;
  previousSetDefaults?: SetValueDefaults[];
  prescribedReps: string;
  defaultLoad?: number | null;
}): SetValueDefaults {
  const exactPrevious = input.previousSetDefaults?.[input.setIndex];
  if (exactPrevious) return exactPrevious;

  const mostRecentPrevious = input.previousSetDefaults?.find(
    (set) => set.actualLoad !== null || set.actualReps !== null,
  );
  if (mostRecentPrevious) return mostRecentPrevious;

  return {
    actualLoad: input.defaultLoad ?? null,
    actualReps: parseDeterministicPrescriptionReps(input.prescribedReps),
  };
}

export function calculateSetProgress(input: {
  exercises: Array<{ id: string; sets: number; trackingType?: ExerciseTrackingType }>;
  setResults: WorkoutSetInput[];
  checkedExerciseIds: string[];
}) {
  let completed = 0;
  let total = 0;
  for (const exercise of input.exercises) {
    if (isSupportedMetricTrackingType(exercise.trackingType)) {
      const rows = input.setResults.filter((row) => row.exerciseEntryId === exercise.id);
      total += exercise.sets + rows.filter((row) => row.setKind === "added").length;
      completed += rows.filter((row) => row.status === "completed").length;
    } else {
      total += 1;
      if (input.checkedExerciseIds.includes(exercise.id)) completed += 1;
    }
  }
  return { completed, total };
}

export type CanonicalSetMergeResult =
  | { ok: true; rows: WorkoutSetInput[] }
  | { ok: false; error: string };

export function buildCanonicalMetricSetRows(input: {
  exerciseEntryId: string;
  prescribedSetCount: number;
  submittedRows: WorkoutSetInput[];
  defaults?: SetValueDefaults[];
}): CanonicalSetMergeResult {
  const prescribedByIndex = new Map<number, WorkoutSetInput>();
  for (const row of input.submittedRows) {
    if (row.setKind !== "prescribed") continue;
    if (
      row.prescribedSetIndex === null ||
      row.prescribedSetIndex < 0 ||
      row.prescribedSetIndex >= input.prescribedSetCount
    ) {
      return { ok: false, error: "Submitted prescribed set index is invalid." };
    }
    if (prescribedByIndex.has(row.prescribedSetIndex)) {
      return { ok: false, error: "Duplicate prescribed set indexes are not allowed." };
    }
    prescribedByIndex.set(row.prescribedSetIndex, row);
  }

  const prescribed = Array.from({ length: input.prescribedSetCount }, (_, index) => {
    const submitted = prescribedByIndex.get(index);
    const defaults = input.defaults?.[index] ?? { actualLoad: null, actualReps: null };
    return {
      ...(submitted ?? {
        exerciseEntryId: input.exerciseEntryId,
        setId: `${input.exerciseEntryId}:prescribed:${index}`,
        actualLoad: defaults.actualLoad,
        actualReps: defaults.actualReps,
        status: "incomplete" as const,
      }),
      exerciseEntryId: input.exerciseEntryId,
      setOrder: index,
      prescribedSetIndex: index,
      setKind: "prescribed" as const,
    };
  });

  const added = input.submittedRows
    .filter((row) => row.setKind === "added")
    .sort((a, b) => a.setOrder - b.setOrder)
    .map((row, index) => ({
      ...row,
      exerciseEntryId: input.exerciseEntryId,
      setOrder: input.prescribedSetCount + index,
      prescribedSetIndex: null,
      setKind: "added" as const,
    }));

  return { ok: true, rows: [...prescribed, ...added] };
}
