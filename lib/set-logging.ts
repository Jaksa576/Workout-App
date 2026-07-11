import type { ExerciseTrackingType, WorkoutSetInput } from "@/lib/types";

export function isSupportedMetricTrackingType(trackingType?: ExerciseTrackingType) {
  return trackingType === "weight_reps" || trackingType === "reps_only";
}

export function isMetricSetValid(
  trackingType: ExerciseTrackingType | undefined,
  row: Pick<WorkoutSetInput, "actualLoad" | "actualReps">,
) {
  const needsLoad = trackingType === "weight_reps";
  const validLoad =
    !needsLoad ||
    (row.actualLoad !== null &&
      row.actualLoad !== undefined &&
      Number.isFinite(row.actualLoad) &&
      row.actualLoad >= 0);
  const validReps =
    row.actualReps !== null &&
    row.actualReps !== undefined &&
    Number.isInteger(row.actualReps) &&
    row.actualReps >= 0;

  return isSupportedMetricTrackingType(trackingType) && validLoad && validReps;
}

export function applyMetricSetEdit(
  trackingType: ExerciseTrackingType | undefined,
  row: WorkoutSetInput,
  patch: Pick<WorkoutSetInput, "actualLoad"> | Pick<WorkoutSetInput, "actualReps">,
): WorkoutSetInput {
  const next = { ...row, ...patch };
  if (row.status === "completed" && !isMetricSetValid(trackingType, next)) {
    return { ...next, status: "incomplete" };
  }
  return next;
}

export function getMetricSetGuidance(
  trackingType: ExerciseTrackingType | undefined,
  row: Pick<WorkoutSetInput, "actualLoad" | "actualReps">,
) {
  if (isMetricSetValid(trackingType, row)) {
    return "";
  }
  return trackingType === "weight_reps"
    ? "Enter weight and whole-number reps to complete this set."
    : "Enter whole-number reps to complete this set.";
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
    return {
      ...(submitted ?? {
        exerciseEntryId: input.exerciseEntryId,
        setId: `${input.exerciseEntryId}:prescribed:${index}`,
        actualLoad: null,
        actualReps: null,
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
