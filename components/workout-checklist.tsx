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
      <div className="rounded-3xl bg-white/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">Completion</p>
            <p className="mt-1 text-sm text-slate">
              {checked.length} of {workout.exercises.length} exercises checked
            </p>
          </div>
          <div className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">
            {completion}%
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {workout.exercises.map((exercise) => {
          const active = checked.includes(exercise.id);

          return (
            <label
              key={exercise.id}
              className="flex cursor-pointer items-start gap-4 rounded-3xl border border-ink/8 bg-white/70 p-4 transition hover:border-coral/40"
            >
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 accent-[#ff6a3d]"
                checked={active}
                onChange={() =>
                  setNextChecked(
                    active
                      ? checked.filter((id) => id !== exercise.id)
                      : [...checked, exercise.id]
                  )
                }
              />
              <div className="flex-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-base font-semibold text-ink">
                    {exercise.name}
                  </p>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate">
                    {exercise.sets} sets - {exercise.reps}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate">
                  {exercise.coachingNote}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-slate">
                  <span className="rounded-full bg-mist px-3 py-2">
                    Rest {exercise.rest}
                  </span>
                  {exercise.videoUrl ? (
                    <a
                      href={exercise.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-mist px-3 py-2 transition hover:text-coral"
                    >
                      Watch demo
                    </a>
                  ) : null}
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
