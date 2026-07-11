"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExerciseGuidancePanel } from "@/components/exercise-guidance-panel";
import { applyMetricSetEdit, getMetricSetGuidance, isMetricSetValid, isSupportedMetricTrackingType } from "@/lib/set-logging";
import type { WorkoutSetInput, WorkoutTemplate } from "@/lib/types";

type WorkoutChecklistProps = {
  workout: WorkoutTemplate;
  storageKey?: string;
  checkedExerciseIds?: string[];
  onCheckedExerciseIdsChange?: (checkedExerciseIds: string[]) => void;
  setResults?: WorkoutSetInput[];
  onSetResultsChange?: (setResults: WorkoutSetInput[]) => void;
  compactExecution?: boolean;
};

export function WorkoutChecklist({
  workout,
  storageKey,
  checkedExerciseIds,
  onCheckedExerciseIdsChange,
  setResults = [],
  onSetResultsChange,
  compactExecution = false
}: WorkoutChecklistProps) {
  const [internalChecked, setInternalChecked] = useState<string[]>([]);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const checked = checkedExerciseIds ?? internalChecked;
  const setChecked = onCheckedExerciseIdsChange ?? setInternalChecked;

  function setNextChecked(nextChecked: string[]) {
    setChecked(nextChecked);
  }

  function updateSetResult(next: WorkoutSetInput) {
    setRowErrors((current) => ({ ...current, [next.setId]: "" }));
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

  function completeSet(row: WorkoutSetInput, exercise: WorkoutTemplate["exercises"][number], rowIndex: number) {
    if (row.status === "completed") {
      updateSetResult({ ...row, status: "incomplete" });
      return;
    }
    if (!isMetricSetValid(exercise.trackingType, row)) {
      const needsLoad = exercise.trackingType === "weight_reps";
      const missingLoad = needsLoad && (row.actualLoad === null || row.actualLoad === undefined || row.actualLoad < 0);
      setRowErrors((current) => ({ ...current, [row.setId]: getMetricSetGuidance(exercise.trackingType, row) }));
      inputRefs.current[`${row.setId}:${missingLoad ? "load" : "reps"}`]?.focus();
      return;
    }
    updateSetResult({ ...row, status: "completed" });
  }

  function removeAddedSet(setId: string) {
    onSetResultsChange?.(setResults.filter((row) => row.setId !== setId));
  }

  function getExerciseRows(exercise: WorkoutTemplate["exercises"][number]) {
    const existing = setResults.filter((row) => row.exerciseEntryId === exercise.id);
    const existingByPrescribedIndex = new Map(
      existing
        .filter((row) => row.setKind === "prescribed" && row.prescribedSetIndex !== null)
        .map((row) => [row.prescribedSetIndex, row]),
    );
    const prescribed = Array.from({ length: exercise.sets }, (_, index) => {
      const setId = `${exercise.id}:prescribed:${index}`;
      return existingByPrescribedIndex.get(index) ?? {
        exerciseEntryId: exercise.id,
        setId,
        setOrder: index,
        prescribedSetIndex: index,
        setKind: "prescribed" as const,
        status: "incomplete" as const,
        actualLoad: null,
        actualReps: null,
      };
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
    });
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
  const loggableExercises = workout.exercises.filter((exercise) => canLogSets && (isSupportedMetricTrackingType(exercise.trackingType)));
  const completedSetCount = loggableExercises.reduce((sum, exercise) => sum + getExerciseRows(exercise).filter((row) => row.status === "completed").length, 0);
  const totalLoggableSets = loggableExercises.reduce((sum, exercise) => sum + getExerciseRows(exercise).length, 0);
  const completion = useMemo(() => {
    const denominator = totalLoggableSets || workout.exercises.length;
    if (denominator === 0) {
      return 0;
    }

    return Math.round(((totalLoggableSets ? completedSetCount : checked.length) / denominator) * 100);
  }, [checked.length, completedSetCount, totalLoggableSets, workout.exercises.length]);

  return (
    <div className={compactExecution ? "space-y-3" : "space-y-5"}>
      <div className="rounded-[24px] border border-border bg-surface-soft p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-copy">Completion</p>
            <p className="mt-1 text-sm text-muted">
              {totalLoggableSets ? `${completedSetCount} of ${totalLoggableSets} sets complete` : `${checked.length} of ${workout.exercises.length} exercises checked`}
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
          const supportsSetLogging = canLogSets && (isSupportedMetricTrackingType(exercise.trackingType));
          const active = supportsSetLogging ? rows.some((row) => row.status === "completed") : checked.includes(exercise.id);
          const checkboxId = `exercise-check-${exercise.id}`;

          return (
            <article
              key={exercise.id}
              className={`rounded-[24px] border border-border/70 bg-surface transition hover:border-primary/40 ${
                compactExecution ? "p-3" : "p-4"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-surface-soft text-sm font-black text-copy">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <label
                      htmlFor={checkboxId}
                      className="cursor-pointer text-lg font-black leading-tight text-copy"
                    >
                      {exercise.name}
                    </label>
                    <p className="shrink-0 rounded-full bg-surface-soft px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted">
                      {exercise.sets} sets · {exercise.reps}
                    </p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-muted">
                    <span className="rounded-full bg-shell-elevated px-3 py-2">
                      Rest {exercise.rest}
                    </span>
                    {active ? (
                      <span className="rounded-full bg-success/10 px-3 py-2 text-success">
                        Completed
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              {supportsSetLogging ? (
                <div className="mt-3 overflow-hidden rounded-[18px] border border-border bg-surface-soft">
                  <div className={`grid gap-2 px-3 py-2 text-[0.65rem] font-black uppercase tracking-[0.12em] text-muted ${exercise.trackingType === "weight_reps" ? "grid-cols-[2.1rem_1fr_4.7rem_3.8rem_3rem]" : "grid-cols-[2.1rem_1fr_4rem_3rem]"}`}>
                    <span>Set</span><span>Previous</span>{exercise.trackingType === "weight_reps" ? <span>Weight</span> : null}<span>Reps</span><span>✓</span>
                  </div>
                  {rows.map((row, rowIndex) => {
                    const needsLoad = exercise.trackingType === "weight_reps";
                    return (
                      <div key={row.setId} className={`grid items-center gap-2 border-t border-border px-3 py-2 ${exercise.trackingType === "weight_reps" ? "grid-cols-[2.1rem_1fr_4.7rem_3.8rem_3rem]" : "grid-cols-[2.1rem_1fr_4rem_3rem]"} ${row.status === "completed" ? "bg-success/5" : ""}`}>
                        <span className="text-sm font-black text-copy">{rowIndex + 1}{row.setKind === "added" ? "+" : ""}</span>
                        <span className="text-xs font-semibold text-muted">{exercise.previousSetSummaries?.[rowIndex] ?? "—"}</span>
                        {needsLoad ? (
                          <input aria-label={`Weight for set ${rowIndex + 1} of ${exercise.name}`} inputMode="decimal" ref={(node) => { inputRefs.current[`${row.setId}:load`] = node; }} className="min-w-0 rounded-xl border border-border bg-surface px-2 py-2 text-sm font-semibold" value={row.actualLoad ?? ""} onChange={(event) => { const value = event.target.value; const parsed = Number(value); if (value === "") updateSetResult(applyMetricSetEdit(exercise.trackingType, row, { actualLoad: null })); else if (!Number.isNaN(parsed) && parsed >= 0) updateSetResult(applyMetricSetEdit(exercise.trackingType, row, { actualLoad: parsed })); }} />
                        ) : null}
                        <input aria-label={`Reps for set ${rowIndex + 1} of ${exercise.name}`} inputMode="numeric" ref={(node) => { inputRefs.current[`${row.setId}:reps`] = node; }} className="min-w-0 rounded-xl border border-border bg-surface px-2 py-2 text-sm font-semibold" value={row.actualReps ?? ""} onChange={(event) => { const value = event.target.value; const parsed = Number(value); if (value === "") updateSetResult(applyMetricSetEdit(exercise.trackingType, row, { actualReps: null })); else if (Number.isInteger(parsed) && parsed >= 0) updateSetResult(applyMetricSetEdit(exercise.trackingType, row, { actualReps: parsed })); }} />
                        <button type="button" aria-label={`${row.status === "completed" ? "Uncomplete" : "Complete"} set ${rowIndex + 1} of ${exercise.name}`} aria-pressed={row.status === "completed"} className={`min-h-11 rounded-xl border text-sm font-black ${row.status === "completed" ? "border-success bg-success text-white" : "border-border bg-surface text-copy"}`} onClick={() => completeSet(row, exercise, rowIndex)}>✓</button>
                        {rowErrors[row.setId] ? <p className="col-span-full text-xs font-semibold text-danger">{rowErrors[row.setId]}</p> : null}
                        {row.setKind === "added" ? <button type="button" className="col-span-full text-left text-xs font-bold text-muted underline" onClick={() => removeAddedSet(row.setId)}>Remove added set</button> : null}
                      </div>
                    );
                  })}
                  <div className="border-t border-border p-2"><button type="button" className="ui-button-ghost px-3 py-2 text-xs" onClick={() => addSet(exercise)}>Add set</button></div>
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
                        : [...checked, exercise.id]
                    )
                  }
                />
              </label>
              )}
              <ExerciseGuidancePanel
                exercise={exercise}
                compact
                defaultOpen={!compactExecution}
              />
            </article>
          );
        })}
      </div>
    </div>
  );
}
