"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import type { PlanFormInput } from "@/lib/types";

type ExerciseDraft = {
  id: string;
  name: string;
  sets: string;
  reps: string;
  rest: string;
  coachingNote: string;
  videoUrl: string;
};

const initialExercises: ExerciseDraft[] = [
  {
    id: "1",
    name: "Goblet squat",
    sets: "3",
    reps: "8-10",
    rest: "90 sec",
    coachingNote: "Keep ribs stacked and move with control.",
    videoUrl: ""
  },
  {
    id: "2",
    name: "Romanian deadlift",
    sets: "3",
    reps: "8",
    rest: "90 sec",
    coachingNote: "Hinge from the hips and keep the dumbbells close.",
    videoUrl: ""
  }
];

export function PlanBuilderForm() {
  const router = useRouter();
  const [exercises, setExercises] = useState(initialExercises);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);

    const formData = new FormData(event.currentTarget);
    const payload: PlanFormInput = {
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      scheduleSummary: String(formData.get("scheduleSummary") ?? ""),
      phaseGoal: String(formData.get("phaseGoal") ?? ""),
      advanceCriteria: String(formData.get("advanceCriteria") ?? ""),
      deloadCriteria: String(formData.get("deloadCriteria") ?? ""),
      workoutName: String(formData.get("workoutName") ?? ""),
      workoutFocus: String(formData.get("workoutFocus") ?? ""),
      workoutSummary: String(formData.get("workoutSummary") ?? ""),
      exercises: exercises.map((_, index) => ({
        name: String(formData.get(`exercise-name-${index}`) ?? ""),
        sets: Number(formData.get(`exercise-sets-${index}`) ?? "0"),
        reps: String(formData.get(`exercise-reps-${index}`) ?? ""),
        rest: String(formData.get(`exercise-rest-${index}`) ?? ""),
        coachingNote: String(formData.get(`exercise-note-${index}`) ?? ""),
        videoUrl: String(formData.get(`exercise-video-${index}`) ?? "")
      }))
    };

    try {
      const response = await fetch("/api/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = (await response.json()) as { id?: string; error?: string };

      if (!response.ok || !result.id) {
        throw new Error(result.error ?? "Unable to save plan.");
      }

      router.push(`/plans/${result.id}` as Route);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save plan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-ink">Plan name</span>
          <input
            type="text"
            name="name"
            defaultValue="Base Strength Reset"
            className="mt-3 w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink">Weekly schedule</span>
          <input
            type="text"
            name="scheduleSummary"
            defaultValue="Mon / Tue / Thu / Sat"
            className="mt-3 w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-ink">Plan description</span>
        <textarea
          name="description"
          rows={4}
          defaultValue="A beginner-friendly plan for rebuilding consistency, movement quality, and simple strength progress."
          className="mt-3 w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="text-sm font-semibold text-ink">Phase goal</span>
          <textarea
            name="phaseGoal"
            rows={4}
            defaultValue="Rebuild movement quality and repeatable strength patterns."
            className="mt-3 w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink">Advance criteria</span>
          <textarea
            name="advanceCriteria"
            rows={4}
            defaultValue="Complete all planned sessions for 2 weeks with no pain and rate effort as appropriate or easier."
            className="mt-3 w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink">Deload criteria</span>
          <textarea
            name="deloadCriteria"
            rows={4}
            defaultValue="Two pain flags in one week or repeated too hard ratings on the same movement pattern."
            className="mt-3 w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="text-sm font-semibold text-ink">Workout name</span>
          <input
            type="text"
            name="workoutName"
            defaultValue="Lower Body + Core"
            className="mt-3 w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink">Workout focus</span>
          <input
            type="text"
            name="workoutFocus"
            defaultValue="Strength foundation"
            className="mt-3 w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink">Workout summary</span>
          <input
            type="text"
            name="workoutSummary"
            defaultValue="Move with control and log how the session felt afterward."
            className="mt-3 w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
          />
        </label>
      </div>

      <div className="rounded-[28px] bg-white/70 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">Workout exercises</p>
            <p className="mt-1 text-sm text-slate">
              Add exercises in the order you want to do them.
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
                  rest: "60 sec",
                  coachingNote: "",
                  videoUrl: ""
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
              className="grid gap-3 rounded-3xl border border-ink/8 bg-[#fffdf9] p-4 md:grid-cols-2"
            >
              <label className="block">
                <span className="text-xs uppercase tracking-[0.2em] text-slate">
                  Exercise {index + 1}
                </span>
                <input
                  type="text"
                  name={`exercise-name-${index}`}
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
                  name={`exercise-sets-${index}`}
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
                  name={`exercise-reps-${index}`}
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
                  name={`exercise-rest-${index}`}
                  defaultValue={exercise.rest}
                  className="mt-2 w-full rounded-2xl border border-ink/10 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-coral"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-xs uppercase tracking-[0.2em] text-slate">
                  Coaching note
                </span>
                <input
                  type="text"
                  name={`exercise-note-${index}`}
                  defaultValue={exercise.coachingNote}
                  className="mt-2 w-full rounded-2xl border border-ink/10 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-coral"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-xs uppercase tracking-[0.2em] text-slate">
                  Exercise video link
                </span>
                <input
                  type="url"
                  name={`exercise-video-${index}`}
                  defaultValue={exercise.videoUrl}
                  className="mt-2 w-full rounded-2xl border border-ink/10 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-coral"
                />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-moss/20 bg-moss/10 p-5 text-sm leading-6 text-slate">
        Your plan will include this phase, workout, and exercise list.
      </div>

      {status ? <p className="text-sm leading-6 text-slate">{status}</p> : null}

      <button
        className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Workout Plan"}
      </button>
    </form>
  );
}
