"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import type { OnboardingInput, PlanSetupChoice, Weekday } from "@/lib/types";

const goals = [
  "Build strength",
  "Return to running",
  "Rehab or rebuild confidence",
  "Improve consistency",
  "General fitness"
];
const injuries = ["Knee", "Hamstring", "Back", "Shoulder", "Ankle", "None right now"];
const equipment = ["Bodyweight", "Dumbbells", "Bands", "Kettlebell", "Barbell", "Bench"];
const weekdays: Array<{ value: Weekday; label: string }> = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" }
];
const sessionLengths = [30, 45, 60, 75];

type Step = "welcome" | "goal" | "limits" | "equipment" | "schedule" | "plan" | "review";
const steps: Step[] = ["welcome", "goal", "limits", "equipment", "schedule", "plan", "review"];

function toggleValue(values: string[], value: string) {
  if (value === "None right now") {
    return values.includes(value) ? [] : [value];
  }

  const nextValues = values.filter((item) => item !== "None right now");
  return nextValues.includes(value)
    ? nextValues.filter((item) => item !== value)
    : [...nextValues, value];
}

function toggleWeekday(values: Weekday[], value: Weekday) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function OnboardingFlow() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<OnboardingInput>({
    goal: "Improve consistency",
    goalNotes: "",
    injuries: [],
    equipment: ["Bodyweight", "Dumbbells"],
    daysPerWeek: 3,
    sessionMinutes: 45,
    weeklySchedule: ["mon", "wed", "fri"],
    planSetupChoice: "guided"
  });
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const step = steps[stepIndex];

  async function handleFinish() {
    setSaving(true);
    setStatus(null);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const result = (await response.json()) as { redirectTo?: string; error?: string };

      if (!response.ok || !result.redirectTo) {
        throw new Error(result.error ?? "Unable to finish setup.");
      }

      router.push(result.redirectTo as Route);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to finish setup.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 sm:space-y-6">
      <section className="rounded-[24px] bg-ink px-5 py-6 text-white shadow-card sm:rounded-[32px] sm:px-7 sm:py-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/65">
          First setup
        </p>
        <h1 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">
          Set up your first workout plan.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/78">
          A few quick answers shape your schedule, exercises, and progression.
        </p>
      </section>

      <section className="rounded-[24px] border border-white/70 bg-[#fffdf9]/85 p-5 shadow-card sm:rounded-[32px] sm:p-6">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {steps.map((item, index) => (
            <button
              key={item}
              type="button"
              onClick={() => setStepIndex(index)}
              className={`rounded-full px-3 py-2 text-xs font-semibold capitalize transition ${
                index === stepIndex ? "bg-ink text-white" : "bg-white text-slate hover:text-coral"
              }`}
            >
              {index + 1}. {item}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {step === "welcome" ? (
            <div>
              <h2 className="font-display text-3xl text-ink">Start simple</h2>
              <p className="mt-3 text-sm leading-6 text-slate">
                Choose a guided starter plan or build one manually.
              </p>
            </div>
          ) : null}

          {step === "goal" ? (
            <div className="space-y-4">
              <h2 className="font-display text-3xl text-ink">What are you working toward?</h2>
              <div className="flex flex-wrap gap-3">
                {goals.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, goal }))}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      form.goal === goal ? "bg-coral text-white" : "bg-white text-ink"
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
              <textarea
                value={form.goalNotes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, goalNotes: event.target.value }))
                }
                rows={3}
                placeholder="Optional: anything specific to remember?"
                className="w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
              />
            </div>
          ) : null}

          {step === "limits" ? (
            <div className="space-y-4">
              <h2 className="font-display text-3xl text-ink">Any limitations today?</h2>
              <div className="flex flex-wrap gap-3">
                {injuries.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        injuries: toggleValue(current.injuries, item)
                      }))
                    }
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      form.injuries.includes(item) ? "bg-coral text-white" : "bg-white text-ink"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === "equipment" ? (
            <div className="space-y-4">
              <h2 className="font-display text-3xl text-ink">What equipment can you use?</h2>
              <div className="flex flex-wrap gap-3">
                {equipment.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        equipment: toggleValue(current.equipment, item)
                      }))
                    }
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      form.equipment.includes(item) ? "bg-coral text-white" : "bg-white text-ink"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === "schedule" ? (
            <div className="space-y-5">
              <h2 className="font-display text-3xl text-ink">Pick a realistic rhythm</h2>
              <label className="block">
                <span className="text-sm font-semibold text-ink">Days per week</span>
                <input
                  type="range"
                  min={1}
                  max={7}
                  value={form.daysPerWeek}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      daysPerWeek: Number(event.target.value)
                    }))
                  }
                  className="mt-3 w-full"
                />
                <span className="text-sm text-slate">{form.daysPerWeek} days per week</span>
              </label>
              <div className="flex flex-wrap gap-3">
                {weekdays.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        weeklySchedule: toggleWeekday(current.weeklySchedule, day.value)
                      }))
                    }
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      form.weeklySchedule.includes(day.value)
                        ? "bg-coral text-white"
                        : "bg-white text-ink"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              <label className="block">
                <span className="text-sm font-semibold text-ink">Session length</span>
                <select
                  value={form.sessionMinutes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sessionMinutes: Number(event.target.value)
                    }))
                  }
                  className="mt-3 w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
                >
                  {sessionLengths.map((length) => (
                    <option key={length} value={length}>
                      {length} minutes
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}

          {step === "plan" ? (
            <div className="space-y-4">
              <h2 className="font-display text-3xl text-ink">How should we start?</h2>
              {[
                { value: "guided", label: "Use a guided starter plan", helper: "Fastest way to get a usable first plan." },
                { value: "manual", label: "Create my first plan manually", helper: "Go straight to the plan builder." },
                { value: "ai", label: "AI-assisted draft", helper: "Coming soon. No AI calls are made right now.", disabled: true }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={option.disabled}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      planSetupChoice: option.value as PlanSetupChoice
                    }))
                  }
                  className={`block w-full rounded-[24px] p-4 text-left transition sm:rounded-[28px] ${
                    form.planSetupChoice === option.value
                      ? "bg-coral text-white"
                      : "bg-white text-ink disabled:opacity-60"
                  }`}
                >
                  <span className="block font-semibold">{option.label}</span>
                  <span className="mt-1 block text-sm opacity-80">{option.helper}</span>
                </button>
              ))}
            </div>
          ) : null}

          {step === "review" ? (
            <div className="space-y-4">
              <h2 className="font-display text-3xl text-ink">Review your setup</h2>
              <div className="rounded-[28px] bg-white/70 p-4 text-sm leading-6 text-slate">
                <p><span className="font-semibold text-ink">Goal:</span> {form.goal}</p>
                <p><span className="font-semibold text-ink">Equipment:</span> {form.equipment.join(", ") || "None selected"}</p>
                <p><span className="font-semibold text-ink">Limitations:</span> {form.injuries.join(", ") || "None selected"}</p>
                <p><span className="font-semibold text-ink">Schedule:</span> {form.daysPerWeek} days, {form.sessionMinutes} minutes</p>
                <p><span className="font-semibold text-ink">Plan path:</span> {form.planSetupChoice === "guided" ? "Guided starter plan" : "Manual plan builder"}</p>
              </div>
              {status ? <p className="text-sm text-slate">{status}</p> : null}
              <button
                type="button"
                onClick={handleFinish}
                disabled={saving}
                className="w-full rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#f95a2b] disabled:opacity-60 sm:w-auto"
              >
                {saving ? "Finishing..." : "Finish Setup"}
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
            className="rounded-full border border-ink/10 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-coral hover:text-coral disabled:opacity-40"
          >
            Back
          </button>
          {step !== "review" ? (
            <button
              type="button"
              onClick={() => setStepIndex((index) => Math.min(steps.length - 1, index + 1))}
              className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
            >
              Continue
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
