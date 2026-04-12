"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { generateRecommendation } from "@/lib/recommendation";
import type { WorkoutTemplate } from "@/lib/types";

const effortOptions = ["Too easy", "Appropriate", "Too hard"] as const;

export function CheckInForm({ workout }: { workout: WorkoutTemplate }) {
  const router = useRouter();
  const [completed, setCompleted] = useState(true);
  const [pain, setPain] = useState(false);
  const [effort, setEffort] = useState<(typeof effortOptions)[number]>(
    "Appropriate"
  );
  const [notes, setNotes] = useState("");
  const [completedExerciseIds, setCompletedExerciseIds] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const rawValue = window.sessionStorage.getItem(`workout-checklist:${workout.id}`);

    if (!rawValue) {
      return;
    }

    try {
      setCompletedExerciseIds(JSON.parse(rawValue) as string[]);
    } catch {
      window.sessionStorage.removeItem(`workout-checklist:${workout.id}`);
    }
  }, [workout.id]);

  const recommendation = generateRecommendation({
    completed,
    pain,
    effort
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          workoutTemplateId: workout.id,
          completed,
          painOccurred: pain,
          perceivedDifficulty:
            effort === "Too easy"
              ? "too_easy"
              : effort === "Too hard"
                ? "too_hard"
                : "appropriate",
          notes,
          recommendation: recommendation.title,
          completedExerciseIds
        })
      });

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to save workout session.");
      }

      window.sessionStorage.removeItem(`workout-checklist:${workout.id}`);
      router.push("/");
      router.refresh();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Unable to save workout session."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="rounded-[28px] bg-white/70 p-4 text-sm text-slate">
        <p className="font-semibold text-ink">{workout.name}</p>
        <p className="mt-2 leading-6">
          {completedExerciseIds.length} of {workout.exercises.length} exercises
          checked off today.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <fieldset className="rounded-3xl bg-white/70 p-4">
          <legend className="text-sm font-semibold text-ink">
            Did you finish the workout?
          </legend>
          <div className="mt-4 flex gap-3">
            {[
              { label: "Yes", value: true },
              { label: "No", value: false }
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setCompleted(option.value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  completed === option.value
                    ? "bg-ink text-white"
                    : "bg-mist text-slate"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="rounded-3xl bg-white/70 p-4">
          <legend className="text-sm font-semibold text-ink">
            Did anything hurt?
          </legend>
          <div className="mt-4 flex gap-3">
            {[
              { label: "No pain", value: false },
              { label: "Yes", value: true }
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setPain(option.value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  pain === option.value
                    ? "bg-ink text-white"
                    : "bg-mist text-slate"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <fieldset className="rounded-3xl bg-white/70 p-4">
        <legend className="text-sm font-semibold text-ink">
          Session difficulty
        </legend>
        <div className="mt-4 flex flex-wrap gap-3">
          {effortOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setEffort(option)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                effort === option ? "bg-coral text-white" : "bg-mist text-slate"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block rounded-3xl bg-white/70 p-4">
        <span className="text-sm font-semibold text-ink">Notes</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={5}
          placeholder="Anything worth remembering for the next session?"
          className="mt-3 w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
        />
      </label>

      <div className="rounded-[28px] border border-coral/20 bg-coral/10 p-5">
        <p className="text-xs uppercase tracking-[0.22em] text-coral">
          Suggested next step
        </p>
        <p className="mt-3 text-lg font-semibold text-ink">
          {recommendation.title}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate">
          {recommendation.description}
        </p>
      </div>

      {status ? <p className="text-sm leading-6 text-slate">{status}</p> : null}

      <button
        className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Workout"}
      </button>
    </form>
  );
}
