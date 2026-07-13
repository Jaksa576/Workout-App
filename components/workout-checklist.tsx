"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  formatHistoryDate,
  formatHistorySet,
  formatTrackingDisplay,
} from "@/lib/exercise-history";
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
  const [detailsExerciseId, setDetailsExerciseId] = useState<string | null>(
    null,
  );
  const [detailsSection, setDetailsSection] = useState<"summary" | "history">(
    "summary",
  );
  const detailsButtonRefs = useRef<Record<string, HTMLButtonElement | null>>(
    {},
  );
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const checked = checkedExerciseIds ?? internalChecked;
  const setChecked = onCheckedExerciseIdsChange ?? setInternalChecked;
  const detailsExercise =
    workout.exercises.find((exercise) => exercise.id === detailsExerciseId) ??
    null;

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
                  <button
                    ref={(node) => {
                      detailsButtonRefs.current[exercise.id] = node;
                    }}
                    type="button"
                    className="flex min-h-11 w-full items-start justify-between gap-3 rounded-2xl px-1 py-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    aria-label={`View details for ${exercise.name}`}
                    onClick={() => openExerciseDetails(exercise.id)}
                  >
                    <span className="text-lg font-black leading-tight text-copy">
                      {exercise.name}
                    </span>
                    <span className="shrink-0 rounded-full border border-border bg-surface-soft px-3 py-2 text-xs font-black text-muted">
                      Details
                    </span>
                  </button>
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
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [exercise.id]);

  function onDialogKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    ).filter((node) => !node.hasAttribute("disabled"));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 p-3 pt-[max(1rem,env(safe-area-inset-top))] sm:flex sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="mx-auto flex h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-border bg-surface shadow-2xl sm:h-[min(44rem,92vh)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-details-title"
        onKeyDown={onDialogKeyDown}
      >
        <div className="shrink-0 border-b border-border bg-surface p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">
                Exercise Details
              </p>
              <h2
                id="exercise-details-title"
                className="mt-1 text-2xl font-black text-copy"
              >
                {exercise.name}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {formatPrescription(exercise)}
              </p>
            </div>
            <button
              ref={closeRef}
              type="button"
              className="ui-button-ghost px-3 py-2 text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          <div
            role="tablist"
            aria-label={`Details sections for ${exercise.name}`}
            className="mt-4 grid grid-cols-2 rounded-2xl border border-border bg-surface-soft p-1"
          >
            {(["summary", "history"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={section === tab}
                className={`rounded-xl px-3 py-2 text-sm font-black capitalize ${section === tab ? "bg-primary text-white" : "text-muted"}`}
                onClick={() => onSectionChange(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {section === "summary" ? (
            <ExerciseDetailsSummary exercise={exercise} />
          ) : (
            <ExerciseDetailsHistory exercise={exercise} />
          )}
        </div>
      </div>
    </div>
  );
}

function ExerciseDetailsSummary({
  exercise,
}: {
  exercise: WorkoutTemplate["exercises"][number];
}) {
  const guidance = exercise.guidance;
  const hasDisplayableGuidance = Boolean(
    guidance?.setup ||
    guidance?.executionCues?.length ||
    guidance?.safetyNotes ||
    guidance?.modifications?.length ||
    guidance?.commonMistakes?.length,
  );
  const hasAnyDetail = Boolean(
    hasDisplayableGuidance || exercise.coachingNote || exercise.videoUrl,
  );
  const recent = exercise.completedHistory?.[0];
  return (
    <div className="space-y-4">
      <SummaryBlock title="Tracking">
        <p>{formatTrackingDisplay(exercise)}</p>
      </SummaryBlock>
      {recent ? (
        <SummaryBlock title="Last completed session">
          <p className="font-semibold">
            {recent.sets
              .slice(0, 3)
              .map((set) => formatHistorySet(set, recent))
              .join(", ")}
          </p>
          <p className="mt-1 text-muted">
            From {recent.workoutName} on {formatHistoryDate(recent.completedOn)}
            .
          </p>
        </SummaryBlock>
      ) : null}
      {hasDisplayableGuidance ? (
        <SummaryBlock title="How to perform">
          {guidance?.setup ? <p>{guidance.setup}</p> : null}
          {guidance?.executionCues?.length ? (
            <ul className="mt-3 list-disc space-y-1 pl-5">
              {guidance.executionCues.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          {guidance?.commonMistakes?.length ? (
            <>
              <p className="mt-3 font-black">Common mistakes</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {guidance.commonMistakes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          ) : null}
        </SummaryBlock>
      ) : null}
      {guidance?.safetyNotes || guidance?.modifications?.length ? (
        <SummaryBlock title="Safety and modifications">
          {guidance.safetyNotes ? <p>{guidance.safetyNotes}</p> : null}
          {guidance.modifications?.length ? (
            <ul className="mt-3 list-disc space-y-1 pl-5">
              {guidance.modifications.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </SummaryBlock>
      ) : null}
      {exercise.coachingNote ? (
        <SummaryBlock title="Coaching note">
          <p>{exercise.coachingNote}</p>
        </SummaryBlock>
      ) : null}
      {exercise.videoUrl ? (
        <a
          href={exercise.videoUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex min-h-11 items-center rounded-full bg-primary px-4 py-2 text-sm font-black text-white"
          aria-label={`${isYouTubeUrl(exercise.videoUrl) ? "Watch Demo on YouTube" : "Watch Demo"} (opens in a new tab)`}
        >
          {isYouTubeUrl(exercise.videoUrl)
            ? "Watch Demo on YouTube"
            : "Watch Demo"}
        </a>
      ) : null}
      {!hasAnyDetail ? (
        <p className="rounded-2xl border border-border bg-surface-soft p-4 text-sm text-muted">
          No reviewed guidance is available for this exercise yet.
        </p>
      ) : null}
    </div>
  );
}

function ExerciseDetailsHistory({
  exercise,
}: {
  exercise: WorkoutTemplate["exercises"][number];
}) {
  const entries = exercise.completedHistory ?? [];
  return (
    <div className="space-y-3">
      {entries.length ? (
        entries.map((entry) => (
          <section
            key={`${entry.sessionId}-${entry.exerciseResultId}`}
            className="rounded-2xl border border-border bg-surface-soft p-4"
          >
            <p className="text-sm font-black text-copy">
              {formatHistoryDate(entry.completedOn)}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">
              {entry.workoutName}
            </p>
            <ol className="mt-3 space-y-1 text-sm text-copy">
              {entry.sets.map((set, index) => (
                <li key={`${entry.exerciseResultId}-${index}`}>
                  {formatHistorySet(set, entry)}
                </li>
              ))}
            </ol>
          </section>
        ))
      ) : (
        <p className="rounded-2xl border border-border bg-surface-soft p-4 text-sm text-muted">
          No completed history for this exercise yet.
        </p>
      )}
    </div>
  );
}

function isYouTubeUrl(value: string) {
  try {
    const host = new URL(value).hostname.replace(/^www\./, "");
    return host === "youtube.com" || host === "youtu.be";
  } catch {
    return false;
  }
}

function SummaryBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface-soft p-4">
      <h3 className="text-xs font-black uppercase tracking-[0.14em] text-muted">
        {title}
      </h3>
      <div className="mt-2 text-sm leading-6 text-copy">{children}</div>
    </section>
  );
}

function formatPrescription(exercise: WorkoutTemplate["exercises"][number]) {
  return [`${exercise.sets} sets`, exercise.reps, `Rest ${exercise.rest}`].join(
    " · ",
  );
}
