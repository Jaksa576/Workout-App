"use client";

import { useState } from "react";

type ExerciseDraft = {
  id: string;
  name: string;
  sets: string;
  reps: string;
  rest: string;
};

const initialExercises: ExerciseDraft[] = [
  { id: "1", name: "Goblet squat", sets: "3", reps: "8-10", rest: "90 sec" },
  { id: "2", name: "Romanian deadlift", sets: "3", reps: "8", rest: "90 sec" }
];

export function PlanBuilderForm() {
  const [exercises, setExercises] = useState(initialExercises);

  return (
    <form className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-ink">Plan name</span>
          <input
            type="text"
            defaultValue="Base Strength Reset"
            className="mt-3 w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink">Weekly schedule</span>
          <input
            type="text"
            defaultValue="Mon / Tue / Thu / Sat"
            className="mt-3 w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-ink">Plan description</span>
        <textarea
          rows={4}
          defaultValue="A beginner-friendly plan for rebuilding consistency, movement quality, and simple strength progress."
          className="mt-3 w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="text-sm font-semibold text-ink">Phase goal</span>
          <textarea
            rows={4}
            defaultValue="Rebuild movement quality and repeatable strength patterns."
            className="mt-3 w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink">Advance criteria</span>
          <textarea
            rows={4}
            defaultValue="Complete all planned sessions for 2 weeks with no pain and rate effort as appropriate or easier."
            className="mt-3 w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink">Deload criteria</span>
          <textarea
            rows={4}
            defaultValue="Two pain flags in one week or repeated too hard ratings on the same movement pattern."
            className="mt-3 w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
          />
        </label>
      </div>

      <div className="rounded-[28px] bg-white/70 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">Workout template</p>
            <p className="mt-1 text-sm text-slate">
              Add exercises in the order you want to see them on your phone.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setExercises((current) => [
                ...current,
                {
                  id: crypto.randomUUID(),
                  name: "",
                  sets: "3",
                  reps: "8",
                  rest: "60 sec"
                }
              ])
            }
            className="rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink"
          >
            Add exercise
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {exercises.map((exercise, index) => (
            <div
              key={exercise.id}
              className="grid gap-3 rounded-3xl border border-ink/8 bg-[#fffdf9] p-4 md:grid-cols-[1.8fr_0.7fr_0.8fr_0.8fr]"
            >
              <label className="block">
                <span className="text-xs uppercase tracking-[0.2em] text-slate">
                  Exercise {index + 1}
                </span>
                <input
                  type="text"
                  defaultValue={exercise.name}
                  className="mt-2 w-full rounded-2xl border border-ink/10 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-coral"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-[0.2em] text-slate">
                  Sets
                </span>
                <input
                  type="text"
                  defaultValue={exercise.sets}
                  className="mt-2 w-full rounded-2xl border border-ink/10 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-coral"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-[0.2em] text-slate">
                  Reps
                </span>
                <input
                  type="text"
                  defaultValue={exercise.reps}
                  className="mt-2 w-full rounded-2xl border border-ink/10 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-coral"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-[0.2em] text-slate">
                  Rest
                </span>
                <input
                  type="text"
                  defaultValue={exercise.rest}
                  className="mt-2 w-full rounded-2xl border border-ink/10 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-coral"
                />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-moss/20 bg-moss/10 p-5 text-sm leading-6 text-slate">
        This starter form is intentionally local-first. The next step is wiring
        its submit handler to Supabase so it inserts a workout plan, phase,
        template, and exercise rows in one flow.
      </div>

      <button className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">
        Save plan structure
      </button>
    </form>
  );
}

