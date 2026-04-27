"use client";

import { useEffect, useMemo, useState } from "react";
import type { WorkoutTemplate } from "@/lib/types";

type WorkoutChecklistProps = {
  workout: WorkoutTemplate;
  storageKey?: string;
  checkedExerciseIds?: string[];
  onCheckedExerciseIdsChange?: (checkedExerciseIds: string[]) => void;
};

export function WorkoutChecklist({
  workout,
  storageKey,
  checkedExerciseIds,
  onCheckedExerciseIdsChange
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
    <div className="space-y-5">
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
      <div className="space-y-3">
        {workout.exercises.map((exercise, index) => {
          const active = checked.includes(exercise.id);
          const checkboxId = `exercise-check-${exercise.id}`;

          return (
            <div
              key={exercise.id}
              className="grid gap-4 rounded-[24px] border border-border/70 bg-surface p-4 transition hover:border-primary/40 sm:grid-cols-[auto_minmax(0,1fr)]"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-surface-soft text-sm font-black text-copy">
                  {index + 1}
                </span>
                <input
                  id={checkboxId}
                  type="checkbox"
                  className="mt-2 h-6 w-6 accent-[rgb(var(--color-primary))]"
                  checked={active}
                  onChange={() =>
                    setNextChecked(
                      active
                        ? checked.filter((id) => id !== exercise.id)
                        : [...checked, exercise.id]
                    )
                  }
                />
              </div>
              <div className="flex-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <label
                    htmlFor={checkboxId}
                    className="cursor-pointer text-lg font-black leading-tight text-copy"
                  >
                    {exercise.name}
                  </label>
                  <p className="shrink-0 rounded-full bg-surface-soft px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted">
                    {exercise.sets} sets - {exercise.reps}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {exercise.coachingNote}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-muted">
                  <span className="rounded-full bg-shell-elevated px-3 py-2">
                    Rest {exercise.rest}
                  </span>
                  {exercise.videoUrl ? (
                    <a
                      href={exercise.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-shell-elevated px-3 py-2 transition hover:text-accent"
                    >
                      Watch Demo
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
