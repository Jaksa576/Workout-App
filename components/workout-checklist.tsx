"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { hasExerciseGuidance } from "@/lib/exercise-guidance";
import {
  applyMetricSetEdit,
  formatDurationInput,
  formatPreviousSet,
  getInitialSetValues,
  isSetCompleteable,
  isSupportedMetricTrackingType,
  parseDurationInput,
  supportsAddedSets,
} from "@/lib/set-logging";
import type { WorkoutSetInput, WorkoutTemplate } from "@/lib/types";

type WorkoutChecklistProps = {
  workout: WorkoutTemplate;
  storageKey?: string;
  checkedExerciseIds?: string[];
  onCheckedExerciseIdsChange?: (checkedExerciseIds: string[]) => void;
  setResults?: WorkoutSetInput[];
  onSetResultsChange?: (setResults: WorkoutSetInput[]) => void;
  compactExecution?: boolean;
  onSetCompleted?: (input: {
    exercise: WorkoutTemplate["exercises"][number];
    setId: string;
  }) => void;
};

export function WorkoutChecklist({
  workout,
  storageKey,
  checkedExerciseIds,
  onCheckedExerciseIdsChange,
  setResults = [],
  onSetResultsChange,
  compactExecution = false,
  onSetCompleted,
}: WorkoutChecklistProps) {
  const [internalChecked, setInternalChecked] = useState<string[]>([]);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [detailsExerciseId, setDetailsExerciseId] = useState<string | null>(null);
  const [detailsSection, setDetailsSection] = useState<"summary" | "history">("summary");
  const detailsButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const checked = checkedExerciseIds ?? internalChecked;
  const setChecked = onCheckedExerciseIdsChange ?? setInternalChecked;
  const detailsExercise = workout.exercises.find((exercise) => exercise.id === detailsExerciseId) ?? null;

  function openExerciseDetails(exerciseId: string) {
    setDetailsSection("summary");
    setDetailsExerciseId(exerciseId);
  }

  function closeExerciseDetails() {
    const originId = detailsExerciseId;
    setDetailsExerciseId(null);
    window.setTimeout(() => {
      if (originId) detailsButtonRefs.current[originId]?.focus();
    }, 0);
  }

  function setNextChecked(nextChecked: string[]) {
    setChecked(nextChecked);
  }

  function updateSetResult(next: WorkoutSetInput) {
    setRowErrors((current) => {
      const { [next.setId]: _cleared, ...rest } = current;
      return rest;
    });
    const withoutPrevious = setResults.filter((row) => {
      if (next.setKind === "prescribed") {
        return !(
          row.exerciseEntryId === next.exerciseEntryId &&
          row.setKind === "prescribed" &&
          row.prescribedSetIndex === next.prescribedSetIndex
        );
      }
      return row.setId !== next.setId;
    });
    onSetResultsChange?.([...withoutPrevious, next]);
  }

  function completeSet(
    row: WorkoutSetInput,
    exercise: WorkoutTemplate["exercises"][number],
  ) {
    if (
      row.status !== "completed" &&
      !isSetCompleteable(exercise.trackingType, row, exercise.unilateralMode)
    ) {
      updateSetResult({ ...row, status: "incomplete" });
      const firstInvalidKey = getFirstMissingFieldKey(row, exercise);
      setRowErrors((current) => ({
        ...current,
        [row.setId]: "Enter the required values before completing this set.",
      }));
      if (firstInvalidKey) inputRefs.current[firstInvalidKey]?.focus();
      return;
    }
    const nextStatus = row.status === "completed" ? "incomplete" : "completed";
    updateSetResult({
      ...row,
      status: nextStatus,
    });
    if (nextStatus === "completed") {
      onSetCompleted?.({ exercise, setId: row.setId });
    }
  }

  function removeAddedSet(setId: string) {
    onSetResultsChange?.(setResults.filter((row) => row.setId !== setId));
  }

  function getExerciseRows(exercise: WorkoutTemplate["exercises"][number]) {
    const existing = setResults.filter(
      (row) => row.exerciseEntryId === exercise.id,
    );
    const existingByPrescribedIndex = new Map(
      existing
        .filter(
          (row) =>
            row.setKind === "prescribed" && row.prescribedSetIndex !== null,
        )
        .map((row) => [row.prescribedSetIndex, row]),
    );
    const prescribed = Array.from({ length: exercise.sets }, (_, index) => {
      const setId = `${exercise.id}:prescribed:${index}`;
      const defaults = getInitialSetValues({
        setIndex: index,
        previousSetDefaults: exercise.previousSetDefaults,
        prescribedReps: exercise.reps,
        defaultLoad: null,
      });
      return (
        existingByPrescribedIndex.get(index) ?? {
          exerciseEntryId: exercise.id,
          setId,
          setOrder: index,
          prescribedSetIndex: index,
          setKind: "prescribed" as const,
          status: "incomplete" as const,
          actualLoad:
            exercise.trackingType === "weight_reps"
              ? defaults.actualLoad
              : null,
          actualReps:
            exercise.trackingType === "reps_only" ||
            exercise.trackingType === "weight_reps"
              ? defaults.actualReps
              : null,
          actualDurationSeconds: defaults.actualDurationSeconds ?? null,
          actualDistance: defaults.actualDistance ?? null,
          actualLeftLoad: defaults.actualLeftLoad ?? null,
          actualRightLoad: defaults.actualRightLoad ?? null,
          actualLeftReps: defaults.actualLeftReps ?? null,
          actualRightReps: defaults.actualRightReps ?? null,
          actualLeftDurationSeconds: defaults.actualLeftDurationSeconds ?? null,
          actualRightDurationSeconds:
            defaults.actualRightDurationSeconds ?? null,
          actualLeftDistance: defaults.actualLeftDistance ?? null,
          actualRightDistance: defaults.actualRightDistance ?? null,
        }
      );
    });
    const added = existing
      .filter((row) => row.setKind === "added")
      .sort((a, b) => a.setOrder - b.setOrder);
    return [...prescribed, ...added];
  }

  function addSet(exercise: WorkoutTemplate["exercises"][number]) {
    const rows = getExerciseRows(exercise);
    const order = rows.length;
    updateSetResult({
      exerciseEntryId: exercise.id,
      setId: `${exercise.id}:added:${Date.now()}`,
      setOrder: order,
      prescribedSetIndex: null,
      setKind: "added",
      status: "incomplete",
      actualLoad: null,
      actualReps: null,
      actualDurationSeconds: null,
      actualDistance: null,
      actualLeftLoad: null,
      actualRightLoad: null,
      actualLeftReps: null,
      actualRightReps: null,
      actualLeftDurationSeconds: null,
      actualRightDurationSeconds: null,
      actualLeftDistance: null,
      actualRightDistance: null,
    });
  }

  function getFirstMissingFieldKey(
    row: WorkoutSetInput,
    exercise: WorkoutTemplate["exercises"][number],
  ) {
    const prefix = `${row.setId}:`;
    if (exercise.unilateralMode === "independent_sides") {
      if (exercise.trackingType === "weight_reps") {
        if (row.actualLeftLoad == null) return `${prefix}actualLeftLoad`;
        if (row.actualLeftReps == null) return `${prefix}actualLeftReps`;
        if (row.actualRightLoad == null) return `${prefix}actualRightLoad`;
        if (row.actualRightReps == null) return `${prefix}actualRightReps`;
      }
      if (exercise.trackingType === "reps_only") {
        if (row.actualLeftReps == null) return `${prefix}actualLeftReps`;
        if (row.actualRightReps == null) return `${prefix}actualRightReps`;
      }
      if (exercise.trackingType === "duration") {
        if (row.actualLeftDurationSeconds == null)
          return `${prefix}actualLeftDurationSeconds`;
        if (row.actualRightDurationSeconds == null)
          return `${prefix}actualRightDurationSeconds`;
      }
      if (
        exercise.trackingType === "distance" ||
        exercise.trackingType === "distance_duration"
      ) {
        if (row.actualLeftDistance != null && row.actualRightDistance == null)
          return `${prefix}actualRightDistance`;
        if (row.actualRightDistance != null && row.actualLeftDistance == null)
          return `${prefix}actualLeftDistance`;
      }
      if (exercise.trackingType === "distance_duration") {
        if (
          row.actualLeftDurationSeconds != null &&
          row.actualRightDurationSeconds == null
        )
          return `${prefix}actualRightDurationSeconds`;
        if (
          row.actualRightDurationSeconds != null &&
          row.actualLeftDurationSeconds == null
        )
          return `${prefix}actualLeftDurationSeconds`;
      }
    }
    if (exercise.trackingType === "weight_reps" && row.actualLoad == null)
      return `${prefix}actualLoad`;
    if (
      (exercise.trackingType === "weight_reps" ||
        exercise.trackingType === "reps_only") &&
      row.actualReps == null
    )
      return `${prefix}actualReps`;
    if (
      (exercise.trackingType === "duration" ||
        exercise.trackingType === "distance_duration") &&
      row.actualDurationSeconds == null
    )
      return `${prefix}actualDurationSeconds`;
    if (
      (exercise.trackingType === "distance" ||
        exercise.trackingType === "distance_duration") &&
      row.actualDistance == null
    )
      return `${prefix}actualDistance`;
    return null;
  }

  function setInputRef(key: string) {
    return (node: HTMLInputElement | null) => {
      inputRefs.current[key] = node;
    };
  }

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    const rawValue = window.sessionStorage.getItem(storageKey);
    if (!rawValue) {
      return;
    }

    try {
      setNextChecked(JSON.parse(rawValue) as string[]);
    } catch {
      window.sessionStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    window.sessionStorage.setItem(storageKey, JSON.stringify(checked));
  }, [checked, storageKey]);

  const canLogSets = Boolean(onSetResultsChange);
  const loggableExercises = workout.exercises.filter(
    (exercise) =>
      canLogSets &&
      (isSupportedMetricTrackingType(exercise.trackingType) ||
        exercise.trackingType === "completion"),
  );
  const completedSetCount = loggableExercises.reduce(
    (sum, exercise) =>
      sum +
      getExerciseRows(exercise).filter((row) => row.status === "completed")
        .length,
    0,
  );
  const totalLoggableSets = loggableExercises.reduce(
    (sum, exercise) => sum + getExerciseRows(exercise).length,
    0,
  );
  const completion = useMemo(() => {
    const denominator = totalLoggableSets || workout.exercises.length;
    if (denominator === 0) {
      return 0;
    }

    return Math.round(
      ((totalLoggableSets ? completedSetCount : checked.length) / denominator) *
        100,
    );
  }, [
    checked.length,
    completedSetCount,
    totalLoggableSets,
    workout.exercises.length,
  ]);

  return (
    <div className={compactExecution ? "space-y-3" : "space-y-5"}>
      <div className="rounded-[24px] border border-border bg-surface-soft p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-copy">Completion</p>
            <p className="mt-1 text-sm text-muted">
              {totalLoggableSets
                ? `${completedSetCount} of ${totalLoggableSets} sets complete`
                : `${checked.length} of ${workout.exercises.length} exercises checked`}
            </p>
          </div>
          <div className="rounded-full bg-hero px-4 py-2 text-sm font-semibold text-white">
            {completion}%
          </div>
        </div>
      </div>
      <div className={compactExecution ? "space-y-2" : "space-y-3"}>
        {workout.exercises.map((exercise, index) => {
          const rows = getExerciseRows(exercise);
          const supportsSetLogging =
            canLogSets &&
            (isSupportedMetricTrackingType(exercise.trackingType) ||
              exercise.trackingType === "completion");
          const active = supportsSetLogging
            ? rows.some((row) => row.status === "completed")
            : checked.includes(exercise.id);
          const checkboxId = `exercise-check-${exercise.id}`;

          return (
            <article
              key={exercise.id}
              className={`rounded-[20px] border border-border/70 bg-surface transition hover:border-primary/40 ${
                compactExecution ? "p-3" : "p-4"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-surface-soft text-sm font-black text-copy">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <button
                      type="button"
                      className="min-h-11 text-left text-lg font-black leading-tight text-copy underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      aria-label={`View details for ${exercise.name}`}
                      onClick={() => openExerciseDetails(exercise.id)}
                    >
                      {exercise.name}
                    </button>
                    <button
                      ref={(node) => { detailsButtonRefs.current[exercise.id] = node; }}
                      type="button"
                      className="ui-button-ghost min-h-11 shrink-0 px-3 py-2 text-xs"
                      aria-label={`View details for ${exercise.name}`}
                      onClick={() => openExerciseDetails(exercise.id)}
                    >
                      Details
                    </button>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-muted">
                    <span className="rounded-full bg-shell-elevated px-3 py-2">
                      Rest {exercise.rest}
                    </span>
                  </div>
                </div>
              </div>
              {supportsSetLogging ? (
                <div className="mt-2 overflow-hidden rounded-[18px] border border-border bg-surface-soft">
                  <div
                    className={`grid gap-2 px-2 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.12em] text-muted ${exercise.trackingType === "completion" ? "grid-cols-[2.1rem_1fr_3rem]" : exercise.trackingType === "weight_reps" ? "grid-cols-[2.1rem_1fr_4.7rem_3.8rem_3rem]" : exercise.trackingType === "distance_duration" ? "grid-cols-[2.1rem_1fr_4rem_4.2rem_3rem]" : exercise.trackingType === "distance" ? "grid-cols-[2.1rem_1fr_4.2rem_3rem]" : "grid-cols-[2.1rem_1fr_4rem_3rem]"}`}
                  >
                    <span>Set</span>
                    <span>Previous</span>
                    {exercise.trackingType === "weight_reps" ? (
                      <span>Weight</span>
                    ) : null}
                    {exercise.trackingType !== "completion" ? (
                      <span>
                        {exercise.trackingType === "duration"
                          ? exercise.unilateralMode === "same_each_side"
                            ? "Duration/side"
                            : "Duration"
                          : exercise.trackingType === "distance_duration"
                            ? "Time"
                            : exercise.trackingType === "distance"
                              ? exercise.unilateralMode === "same_each_side"
                                ? `Distance/side (${exercise.distanceUnit ?? "mi"})`
                                : `Distance (${exercise.distanceUnit ?? "mi"})`
                              : exercise.unilateralMode === "same_each_side"
                                ? "Reps/side"
                                : "Reps"}
                      </span>
                    ) : null}
                    {exercise.trackingType === "distance_duration" ? (
                      <span>Distance</span>
                    ) : null}
                    <span>✓</span>
                  </div>
                  {rows.map((row, rowIndex) => {
                    const isCompletionRow =
                      exercise.trackingType === "completion";
                    const needsLoad = exercise.trackingType === "weight_reps";
                    const independent =
                      exercise.unilateralMode === "independent_sides";
                    const rowError = rowErrors[row.setId];
                    const durationInput = (
                      field: keyof WorkoutSetInput,
                      label: string,
                    ) => (
                      <input
                        ref={setInputRef(`${row.setId}:${field}`)}
                        aria-label={`${label} for set ${rowIndex + 1} of ${exercise.name}`}
                        aria-invalid={Boolean(rowError)}
                        aria-describedby={
                          rowError ? `${row.setId}-error` : undefined
                        }
                        inputMode="numeric"
                        className="min-w-0 rounded-xl border border-border bg-surface px-2 py-2 text-sm font-semibold"
                        value={formatDurationInput(
                          row[field] as number | null | undefined,
                        )}
                        placeholder="0:45"
                        onChange={(event) => {
                          const parsed = parseDurationInput(event.target.value);
                          if (parsed === null)
                            updateSetResult(
                              applyMetricSetEdit(row, { [field]: null }),
                            );
                          else if (!Number.isNaN(parsed) && parsed >= 0)
                            updateSetResult(
                              applyMetricSetEdit(row, { [field]: parsed }),
                            );
                        }}
                      />
                    );
                    const numberInput = (
                      field: keyof WorkoutSetInput,
                      label: string,
                      integer = false,
                    ) => (
                      <input
                        ref={setInputRef(`${row.setId}:${field}`)}
                        aria-label={`${label} for set ${rowIndex + 1} of ${exercise.name}`}
                        aria-invalid={Boolean(rowError)}
                        aria-describedby={
                          rowError ? `${row.setId}-error` : undefined
                        }
                        inputMode={integer ? "numeric" : "decimal"}
                        className="min-w-0 rounded-xl border border-border bg-surface px-2 py-2 text-sm font-semibold"
                        value={(row[field] as number | null | undefined) ?? ""}
                        onChange={(event) => {
                          const value = event.target.value;
                          const parsed = Number(value);
                          if (value === "")
                            updateSetResult(
                              applyMetricSetEdit(row, { [field]: null }),
                            );
                          else if (
                            (integer
                              ? Number.isInteger(parsed)
                              : !Number.isNaN(parsed)) &&
                            parsed >= 0
                          )
                            updateSetResult(
                              applyMetricSetEdit(row, { [field]: parsed }),
                            );
                        }}
                      />
                    );
                    return (
                      <div
                        key={row.setId}
                        className={`grid items-center gap-2 border-t border-border px-2 py-1.5 ${isCompletionRow ? "grid-cols-[2.1rem_1fr_3rem]" : independent ? "grid-cols-[2.1rem_1fr_minmax(0,1fr)_minmax(0,1fr)_3rem] sm:grid-cols-[2.1rem_1fr_repeat(4,minmax(3.6rem,1fr))_3rem]" : exercise.trackingType === "weight_reps" ? "grid-cols-[2.1rem_1fr_4.7rem_3.8rem_3rem]" : exercise.trackingType === "distance_duration" ? "grid-cols-[2.1rem_1fr_4rem_4.2rem_3rem]" : exercise.trackingType === "distance" ? "grid-cols-[2.1rem_1fr_4.2rem_3rem]" : "grid-cols-[2.1rem_1fr_4rem_3rem]"} ${row.status === "completed" ? "bg-success/5" : ""}`}
                      >
                        <span className="text-sm font-black text-copy">
                          {rowIndex + 1}
                          {row.setKind === "added" ? "+" : ""}
                        </span>
                        <span className="text-xs font-semibold text-muted">
                          {exercise.previousSetSummaries?.[rowIndex] ??
                            formatPreviousSet(
                              exercise.previousSetDefaults?.[rowIndex],
                              exercise.trackingType,
                              exercise.distanceUnit ?? exercise.loadUnit,
                              exercise.unilateralMode,
                            )}
                        </span>
                        {isCompletionRow ? null : independent ? (
                          <>
                            {needsLoad
                              ? numberInput(
                                  "actualLeftLoad",
                                  `Left weight in ${exercise.loadUnit ?? "lb"}`,
                                )
                              : null}
                            {exercise.trackingType === "weight_reps" ||
                            exercise.trackingType === "reps_only"
                              ? numberInput("actualLeftReps", "Left reps", true)
                              : null}
                            {exercise.trackingType === "duration" ||
                            exercise.trackingType === "distance_duration"
                              ? durationInput(
                                  "actualLeftDurationSeconds",
                                  "Left duration",
                                )
                              : null}
                            {exercise.trackingType === "distance" ||
                            exercise.trackingType === "distance_duration"
                              ? numberInput(
                                  "actualLeftDistance",
                                  `Left distance in ${exercise.distanceUnit ?? "mi"}`,
                                )
                              : null}
                            {needsLoad
                              ? numberInput(
                                  "actualRightLoad",
                                  `Right weight in ${exercise.loadUnit ?? "lb"}`,
                                )
                              : null}
                            {exercise.trackingType === "weight_reps" ||
                            exercise.trackingType === "reps_only"
                              ? numberInput(
                                  "actualRightReps",
                                  "Right reps",
                                  true,
                                )
                              : null}
                            {exercise.trackingType === "duration" ||
                            exercise.trackingType === "distance_duration"
                              ? durationInput(
                                  "actualRightDurationSeconds",
                                  "Right duration",
                                )
                              : null}
                            {exercise.trackingType === "distance" ||
                            exercise.trackingType === "distance_duration"
                              ? numberInput(
                                  "actualRightDistance",
                                  `Right distance in ${exercise.distanceUnit ?? "mi"}`,
                                )
                              : null}
                          </>
                        ) : (
                          <>
                            {needsLoad
                              ? numberInput(
                                  "actualLoad",
                                  `Weight in ${exercise.loadUnit ?? "lb"}`,
                                )
                              : null}
                            {exercise.trackingType === "duration" ||
                            exercise.trackingType === "distance_duration"
                              ? durationInput(
                                  "actualDurationSeconds",
                                  exercise.unilateralMode === "same_each_side"
                                    ? "Duration each side"
                                    : "Duration",
                                )
                              : exercise.trackingType === "distance"
                                ? numberInput(
                                    "actualDistance",
                                    exercise.unilateralMode === "same_each_side"
                                      ? `Distance each side in ${exercise.distanceUnit ?? "mi"}`
                                      : `Distance in ${exercise.distanceUnit ?? "mi"}`,
                                  )
                                : numberInput(
                                    "actualReps",
                                    exercise.unilateralMode === "same_each_side"
                                      ? "Reps each side"
                                      : "Reps",
                                    true,
                                  )}
                            {exercise.trackingType === "distance_duration"
                              ? numberInput(
                                  "actualDistance",
                                  `Distance in ${exercise.distanceUnit ?? "mi"}`,
                                )
                              : null}
                          </>
                        )}
                        <button
                          type="button"
                          aria-label={`${row.status === "completed" ? "Uncomplete" : "Complete"} set ${rowIndex + 1} of ${exercise.name}`}
                          aria-pressed={row.status === "completed"}
                          className={`min-h-11 rounded-xl border text-sm font-black ${row.status === "completed" ? "border-success bg-success text-white" : "border-border bg-surface text-copy"}`}
                          onClick={() => completeSet(row, exercise)}
                        >
                          ✓
                        </button>
                        {rowError ? (
                          <p
                            id={`${row.setId}-error`}
                            className="col-span-full text-xs font-bold text-danger"
                          >
                            {rowError}
                          </p>
                        ) : null}
                        {row.setKind === "added" ? (
                          <button
                            type="button"
                            className="col-span-full text-left text-xs font-bold text-muted underline"
                            onClick={() => removeAddedSet(row.setId)}
                          >
                            Remove added set
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                  {supportsAddedSets(exercise.trackingType) ? (
                    <div className="border-t border-border p-1.5">
                      <button
                        type="button"
                        className="ui-button-ghost px-3 py-2 text-xs"
                        onClick={() => addSet(exercise)}
                      >
                        Add set
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <label
                  htmlFor={checkboxId}
                  className={`mt-3 flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-[18px] border px-4 py-3 text-sm font-bold transition ${
                    active
                      ? "border-success/30 bg-success/10 text-success"
                      : "border-primary/25 bg-primary/10 text-copy hover:border-primary/50"
                  }`}
                >
                  <span>{active ? "Marked complete" : "Mark complete"}</span>
                  <input
                    id={checkboxId}
                    type="checkbox"
                    className="h-6 w-6 accent-[rgb(var(--color-primary))]"
                    checked={active}
                    aria-label={`${active ? "Mark incomplete" : "Mark complete"}: ${exercise.name}`}
                    onChange={() =>
                      setNextChecked(
                        active
                          ? checked.filter((id) => id !== exercise.id)
                          : [...checked, exercise.id],
                      )
                    }
                  />
                </label>
              )}
            </article>
          );
        })}
      </div>
      {detailsExercise ? (
        <ExerciseDetailsSurface
          exercise={detailsExercise}
          section={detailsSection}
          onSectionChange={setDetailsSection}
          onClose={closeExerciseDetails}
        />
      ) : null}
    </div>
  );
}

function ExerciseDetailsSurface({
  exercise,
  section,
  onSectionChange,
  onClose,
}: {
  exercise: WorkoutTemplate["exercises"][number];
  section: "summary" | "history";
  onSectionChange: (section: "summary" | "history") => void;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, [exercise.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="exercise-details-title">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[28px] border border-border bg-surface p-4 shadow-2xl sm:mx-auto sm:max-w-2xl sm:rounded-[28px] sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Exercise Details</p>
            <h2 id="exercise-details-title" className="mt-1 text-2xl font-black text-copy">{exercise.name}</h2>
            <p className="mt-1 text-sm text-muted">{formatPrescription(exercise)}</p>
          </div>
          <button ref={closeRef} type="button" className="ui-button-ghost px-3 py-2 text-sm" onClick={onClose}>Close</button>
        </div>

        <div role="tablist" aria-label={`Details sections for ${exercise.name}`} className="mt-4 grid grid-cols-2 rounded-2xl border border-border bg-surface-soft p-1">
          {(["summary", "history"] as const).map((tab) => (
            <button key={tab} type="button" role="tab" aria-selected={section === tab} className={`rounded-xl px-3 py-2 text-sm font-black capitalize ${section === tab ? "bg-primary text-white" : "text-muted"}`} onClick={() => onSectionChange(tab)}>
              {tab}
            </button>
          ))}
        </div>

        {section === "summary" ? <ExerciseDetailsSummary exercise={exercise} /> : <ExerciseDetailsHistory exercise={exercise} />}
      </div>
    </div>
  );
}

function ExerciseDetailsSummary({ exercise }: { exercise: WorkoutTemplate["exercises"][number] }) {
  const guidance = exercise.guidance;
  const hasGuidance = hasExerciseGuidance(guidance);
  const hasAnyDetail = Boolean(hasGuidance || exercise.coachingNote || exercise.videoUrl);
  return (
    <div className="mt-4 space-y-4">
      <SummaryBlock title="Current prescription">
        <p>{formatPrescription(exercise)}</p>
        <p className="mt-1 text-muted">Tracking: {formatTrackingLabel(exercise)}</p>
      </SummaryBlock>
      {exercise.previousSetSummaries?.length ? (
        <SummaryBlock title="Recent performance">
          <p>{exercise.previousSetSummaries.slice(0, 3).join(" · ")}</p>
        </SummaryBlock>
      ) : null}
      {exercise.videoUrl ? (
        <a href={exercise.videoUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-full bg-primary px-4 py-2 text-sm font-black text-white">
          Open reviewed demo externally
        </a>
      ) : null}
      {guidance?.setup ? <SummaryBlock title="Setup"><p>{guidance.setup}</p></SummaryBlock> : null}
      {guidance?.executionCues?.length ? <SummaryList title="Cues" items={guidance.executionCues} /> : null}
      {guidance?.safetyNotes ? <SummaryBlock title="Safety"><p>{guidance.safetyNotes}</p></SummaryBlock> : null}
      {guidance?.modifications?.length ? <SummaryList title="Modifications" items={guidance.modifications} /> : null}
      {guidance?.commonMistakes?.length ? <SummaryList title="Common mistakes" items={guidance.commonMistakes} /> : null}
      {exercise.coachingNote ? <SummaryBlock title="Coaching note"><p>{exercise.coachingNote}</p></SummaryBlock> : null}
      {!hasAnyDetail ? <p className="rounded-2xl border border-border bg-surface-soft p-4 text-sm text-muted">No reviewed guidance is available for this exercise yet.</p> : null}
    </div>
  );
}

function ExerciseDetailsHistory({ exercise }: { exercise: WorkoutTemplate["exercises"][number] }) {
  const rows = exercise.previousSetSummaries ?? [];
  return (
    <div className="mt-4">
      {rows.length ? (
        <div className="rounded-2xl border border-border bg-surface-soft p-4">
          <p className="text-sm font-black text-copy">Most recent completed session</p>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">{exercise.name}</p>
          <ol className="mt-3 space-y-2 text-sm text-copy">
            {rows.map((row, index) => <li key={`${row}-${index}`}>Set {index + 1}: {row}</li>)}
          </ol>
        </div>
      ) : (
        <p className="rounded-2xl border border-border bg-surface-soft p-4 text-sm text-muted">No completed history for this exercise yet.</p>
      )}
    </div>
  );
}

function SummaryBlock({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-2xl border border-border bg-surface-soft p-4"><h3 className="text-xs font-black uppercase tracking-[0.14em] text-muted">{title}</h3><div className="mt-2 text-sm leading-6 text-copy">{children}</div></section>;
}

function SummaryList({ title, items }: { title: string; items: string[] }) {
  return <SummaryBlock title={title}><ul className="space-y-1">{items.map((item) => <li key={item}>{item}</li>)}</ul></SummaryBlock>;
}

function formatPrescription(exercise: WorkoutTemplate["exercises"][number]) {
  return [`${exercise.sets} sets`, exercise.reps, `Rest ${exercise.rest}`].join(" · ");
}

function formatTrackingLabel(exercise: WorkoutTemplate["exercises"][number]) {
  const type = exercise.trackingType ?? "completion";
  const unit = type === "weight_reps" ? ` (${exercise.loadUnit ?? "lb"})` : type === "distance" || type === "distance_duration" ? ` (${exercise.distanceUnit ?? "mi"})` : "";
  const side = exercise.unilateralMode && exercise.unilateralMode !== "bilateral" ? ` · ${exercise.unilateralMode.replaceAll("_", " ")}` : "";
  return `${type.replaceAll("_", " ")}${unit}${side}`;
}

