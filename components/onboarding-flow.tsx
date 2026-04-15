"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import type {
  ActivityLevel,
  OnboardingInput,
  PlanSetupChoice,
  Profile,
  TrainingEnvironment,
  TrainingExperience,
  Weekday
} from "@/lib/types";
import {
  activityLevelOptions,
  equipmentOptions,
  exerciseDislikeOptions,
  exercisePreferenceOptions,
  limitationAreas,
  sessionLengths,
  sportsInterestOptions,
  trainingEnvironmentOptions,
  trainingExperienceOptions,
  weekdays
} from "@/lib/profile-options";

type Step = "welcome" | "basics" | "environment" | "limits" | "schedule" | "preferences" | "review";
const steps: Array<{ id: Step; label: string }> = [
  { id: "welcome", label: "Start" },
  { id: "basics", label: "Basics" },
  { id: "environment", label: "Environment" },
  { id: "limits", label: "Limits" },
  { id: "schedule", label: "Availability" },
  { id: "preferences", label: "Preferences" },
  { id: "review", label: "Review" }
];

function toggleValue(values: string[], value: string) {
  if (value === "None right now") {
    return values.includes(value) ? [] : [value];
  }

  const nextValues = values.filter((item) => item !== "None right now");
  return nextValues.includes(value)
    ? nextValues.filter((item) => item !== value)
    : [...nextValues, value];
}

function toggleListValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function toggleWeekday(values: Weekday[], value: Weekday) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function toNullableNumber(value: string) {
  return value.trim() ? Number(value) : null;
}

type OnboardingFlowProps = {
  initialProfile?: Profile | null;
};

function Field({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <div className="mt-3">{children}</div>
    </label>
  );
}

function initialListValue(value: string[] | undefined, fallback: string[], hasExistingProfile: boolean) {
  if (value && value.length > 0) {
    return value;
  }

  return hasExistingProfile ? [] : fallback;
}

export function OnboardingFlow({ initialProfile = null }: OnboardingFlowProps) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<OnboardingInput>(() => ({
    goal: "Build a sustainable routine.",
    goalNotes: "",
    injuries: initialProfile?.injuries ?? [],
    limitationsDetail: initialProfile?.limitationsDetail ?? "",
    equipment: initialListValue(
      initialProfile?.equipment,
      ["Bodyweight", "Dumbbells"],
      Boolean(initialProfile)
    ),
    age: initialProfile?.age ?? null,
    weight: initialProfile?.weight ?? null,
    trainingExperience: initialProfile?.trainingExperience ?? null,
    activityLevel: initialProfile?.activityLevel ?? null,
    trainingEnvironment: initialProfile?.trainingEnvironment ?? null,
    exercisePreferences: initialProfile?.exercisePreferences ?? [],
    exerciseDislikes: initialProfile?.exerciseDislikes ?? [],
    sportsInterests: initialProfile?.sportsInterests ?? [],
    daysPerWeek: initialProfile?.daysPerWeek ?? 3,
    sessionMinutes: initialProfile?.sessionMinutes ?? 45,
    weeklySchedule: ["mon", "wed", "fri"],
    planSetupChoice: "guided"
  }));
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
          Profile setup
        </p>
        <h1 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">
          Set up your training profile.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/78">
          These answers help future plans account for your experience, equipment, availability,
          preferences, and limitations.
        </p>
      </section>

      <section className="rounded-[24px] border border-white/70 bg-[#fffdf9]/85 p-5 shadow-card sm:rounded-[32px] sm:p-6">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {steps.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStepIndex(index)}
              className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                index === stepIndex ? "bg-ink text-white" : "bg-white text-slate hover:text-coral"
              }`}
            >
              {index + 1}. {item.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {step.id === "welcome" ? (
            <div>
              <h2 className="font-display text-3xl text-ink">Start with what stays true</h2>
              <p className="mt-3 text-sm leading-6 text-slate">
                Onboarding saves reusable profile context. Your specific plan goal and plan details
                can still change each time you create a new plan.
              </p>
            </div>
          ) : null}

          {step.id === "basics" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Age">
                <input
                  type="number"
                  min={13}
                  max={120}
                  value={form.age ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, age: toNullableNumber(event.target.value) }))
                  }
                  placeholder="Optional"
                  className="w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
                />
              </Field>
              <Field label="Weight">
                <input
                  type="number"
                  min={1}
                  step="0.1"
                  value={form.weight ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      weight: toNullableNumber(event.target.value)
                    }))
                  }
                  placeholder="Optional"
                  className="w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
                />
              </Field>
              <Field label="Training experience">
                <select
                  value={form.trainingExperience ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      trainingExperience: event.target.value
                        ? (event.target.value as TrainingExperience)
                        : null
                    }))
                  }
                  className="w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
                >
                  <option value="">Select experience</option>
                  {trainingExperienceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Current activity level">
                <select
                  value={form.activityLevel ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      activityLevel: event.target.value ? (event.target.value as ActivityLevel) : null
                    }))
                  }
                  className="w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
                >
                  <option value="">Select activity level</option>
                  {activityLevelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          ) : null}

          {step.id === "environment" ? (
            <div className="space-y-5">
              <h2 className="font-display text-3xl text-ink">Where do you usually train?</h2>
              <Field label="Training environment">
                <select
                  value={form.trainingEnvironment ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      trainingEnvironment: event.target.value
                        ? (event.target.value as TrainingEnvironment)
                        : null
                    }))
                  }
                  className="w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
                >
                  <option value="">Select environment</option>
                  {trainingEnvironmentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <div>
                <p className="text-sm font-semibold text-ink">Equipment you can usually use</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {equipmentOptions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          equipment: toggleListValue(current.equipment, item)
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
            </div>
          ) : null}

          {step.id === "limits" ? (
            <div className="space-y-4">
              <h2 className="font-display text-3xl text-ink">Anything to work around?</h2>
              <div className="flex flex-wrap gap-3">
                {limitationAreas.map((item) => (
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
              <textarea
                value={form.limitationsDetail ?? ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, limitationsDetail: event.target.value }))
                }
                rows={4}
                placeholder="Optional: pain triggers, movements to modify, or anything a future plan should respect."
                className="w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
              />
            </div>
          ) : null}

          {step.id === "schedule" ? (
            <div className="space-y-5">
              <h2 className="font-display text-3xl text-ink">What is your typical availability?</h2>
              <label className="block">
                <span className="text-sm font-semibold text-ink">Typical days per week</span>
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
              <div>
                <p className="text-sm font-semibold text-ink">Typical training days</p>
                <div className="mt-3 flex flex-wrap gap-3">
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
              </div>
              <Field label="Typical session duration">
                <select
                  value={form.sessionMinutes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sessionMinutes: Number(event.target.value)
                    }))
                  }
                  className="w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
                >
                  {sessionLengths.map((length) => (
                    <option key={length} value={length}>
                      {length} minutes
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          ) : null}

          {step.id === "preferences" ? (
            <div className="space-y-5">
              <h2 className="font-display text-3xl text-ink">What should plans know?</h2>
              <div>
                <p className="text-sm font-semibold text-ink">Exercise preferences</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {exercisePreferenceOptions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          exercisePreferences: toggleListValue(
                            current.exercisePreferences ?? [],
                            item
                          )
                        }))
                      }
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        form.exercisePreferences?.includes(item)
                          ? "bg-coral text-white"
                          : "bg-white text-ink"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Exercise dislikes or hard no's</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {exerciseDislikeOptions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          exerciseDislikes: toggleListValue(current.exerciseDislikes ?? [], item)
                        }))
                      }
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        form.exerciseDislikes?.includes(item)
                          ? "bg-coral text-white"
                          : "bg-white text-ink"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Sports or interests</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {sportsInterestOptions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          sportsInterests: toggleListValue(current.sportsInterests ?? [], item)
                        }))
                      }
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        form.sportsInterests?.includes(item)
                          ? "bg-coral text-white"
                          : "bg-white text-ink"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {step.id === "review" ? (
            <div className="space-y-4">
              <h2 className="font-display text-3xl text-ink">Review your profile</h2>
              <div className="rounded-[28px] bg-white/70 p-4 text-sm leading-6 text-slate">
                <p>
                  <span className="font-semibold text-ink">Experience:</span>{" "}
                  {trainingExperienceOptions.find((item) => item.value === form.trainingExperience)
                    ?.label ?? "Not selected"}
                </p>
                <p>
                  <span className="font-semibold text-ink">Environment:</span>{" "}
                  {trainingEnvironmentOptions.find((item) => item.value === form.trainingEnvironment)
                    ?.label ?? "Not selected"}
                </p>
                <p>
                  <span className="font-semibold text-ink">Equipment:</span>{" "}
                  {form.equipment.join(", ") || "None selected"}
                </p>
                <p>
                  <span className="font-semibold text-ink">Limitations:</span>{" "}
                  {form.injuries.join(", ") || "None selected"}
                </p>
                <p>
                  <span className="font-semibold text-ink">Typical availability:</span>{" "}
                  {form.daysPerWeek} days, {form.sessionMinutes} minutes
                </p>
              </div>
              <div className="rounded-[28px] bg-white/70 p-4">
                <p className="text-sm font-semibold text-ink">After profile setup</p>
                <p className="mt-1 text-sm leading-6 text-slate">
                  Next you will create a plan from the dedicated plan setup page.
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {[
                    {
                      value: "guided",
                      label: "Go to guided plan setup",
                      helper: "Choose a goal track and generate an editable draft."
                    },
                    {
                      value: "manual",
                      label: "Go to manual plan builder",
                      helper: "Save your profile, then build the plan yourself."
                    }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          planSetupChoice: option.value as PlanSetupChoice
                        }))
                      }
                      className={`block rounded-[24px] p-4 text-left transition sm:rounded-[28px] ${
                        form.planSetupChoice === option.value
                          ? "bg-coral text-white"
                          : "bg-white text-ink"
                      }`}
                    >
                      <span className="block font-semibold">{option.label}</span>
                      <span className="mt-1 block text-sm opacity-80">{option.helper}</span>
                    </button>
                  ))}
                </div>
              </div>
              {status ? <p className="text-sm text-slate">{status}</p> : null}
              <button
                type="button"
                onClick={handleFinish}
                disabled={saving}
                className="w-full rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#f95a2b] disabled:opacity-60 sm:w-auto"
              >
                {saving ? "Finishing..." : "Save Profile"}
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
          {step.id !== "review" ? (
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
