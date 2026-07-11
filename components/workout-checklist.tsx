"use client";

import { useEffect, useMemo, useState } from "react";
import { ExerciseGuidancePanel } from "@/components/exercise-guidance-panel";
import type { WorkoutTemplate } from "@/lib/types";

type WorkoutChecklistProps = {
  workout: WorkoutTemplate;
  storageKey?: string;
  checkedExerciseIds?: string[];
  onCheckedExerciseIdsChange?: (checkedExerciseIds: string[]) => void;
  compactExecution?: boolean;
};

export function WorkoutChecklist({
  workout,
  storageKey,
  checkedExerciseIds,
  onCheckedExerciseIdsChange,
  compactExecution = false
}: WorkoutChecklistProps) {
  const [internalChecked, setInternalChecked] = useState<string[]>([]);
  const checked = checkedExerciseIds ?? internalChecked;
  const setChecked = onCheckedExerciseIdsChange ?? setInternalChecked;

  function setNextChecked(nextChecked: string[]) {
    setChecked(nextChecked);
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

  const completion = useMemo(() => {
    if (workout.exercises.length === 0) {
      return 0;
    }

    return Math.round((checked.length / workout.exercises.length) * 100);
  }, [checked.length, workout.exercises.length]);

  return (
    <div className={compactExecution ? "space-y-3" : "space-y-5"}>
      <div className="rounded-[24px] border border-border bg-surface-soft p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-copy">Completion</p>
            <p className="mt-1 text-sm text-muted">
              {checked.length} of {workout.exercises.length} exercises checked
            </p>
          </div>
          <div className="rounded-full bg-hero px-4 py-2 text-sm font-semibold text-white">
            {completion}%
          </div>
        </div>
      </div>
      <div className={compactExecution ? "space-y-2" : "space-y-3"}>
        {workout.exercises.map((exercise, index) => {
          const active = checked.includes(exercise.id);
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
