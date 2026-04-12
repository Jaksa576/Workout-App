"use client";

import { useMemo, useState } from "react";
import type { WorkoutTemplate } from "@/lib/types";

export function WorkoutChecklist({ workout }: { workout: WorkoutTemplate }) {
  const [checked, setChecked] = useState<string[]>([]);

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
                  setChecked((current) =>
                    active
                      ? current.filter((id) => id !== exercise.id)
                      : [...current, exercise.id]
                  )
                }
              />
              <div className="flex-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-base font-semibold text-ink">
                    {exercise.name}
                  </p>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate">
                    {exercise.sets} sets • {exercise.reps}
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
                    <span className="rounded-full bg-mist px-3 py-2">
                      Video linked
                    </span>
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

