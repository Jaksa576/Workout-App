"use client";

import { useMemo, useState } from "react";
import { PlanBuilderForm } from "@/components/plan-builder-form";
import { selectDefaultProgressionMode } from "@/lib/progression-mode";
import type {
  PlanPreferredSplit,
  PlanSetupInput,
  Profile,
  ProgressionMode,
  StructuredPlanInput,
  TrainingGoalType,
  Weekday
} from "@/lib/types";

type WizardStep = "goal" | "details" | "generate" | "review";
type PlanMode = "guided" | "manual";

type PlanSetupWizardProps = {
  profile: Profile | null;
  initialMode?: PlanMode;
};

const defaultDays: Weekday[] = ["mon", "wed", "fri", "tue", "thu", "sat", "sun"];

const steps: Array<{ id: WizardStep; label: string }> = [
  { id: "goal", label: "Goal" },
  { id: "details", label: "Details" },
  { id: "generate", label: "Draft" },
  { id: "review", label: "Review" }
];

const goalOptions: Array<{
  value: TrainingGoalType;
  label: string;
  helper: string;
}> = [
  {
    value: "recovery",
    label: "Recovery",
    helper: "Rebuild safely around current symptoms or limitations."
  },
  {
    value: "general_fitness",
    label: "General fitness",
    helper: "Build a balanced routine for feeling and moving better."
  },
  {
    value: "strength",
    label: "Strength",
    helper: "Practice stronger, repeatable lifts and movement patterns."
  },
  {
    value: "hypertrophy",
    label: "Hypertrophy",
    helper: "Train for muscle with a simple weekly structure."
  },
  {
    value: "running",
    label: "Running",
    helper: "Support running readiness with strength and prep work."
  },
  {
    value: "sport_performance",
    label: "Sport performance",
    helper: "Build support work around athletic demands."
  },
  {
    value: "consistency",
    label: "Consistency",
    helper: "Make the first plan easy to repeat."
  }
];

const splitOptions: Array<{ value: PlanPreferredSplit; label: string }> = [
  { value: "full_body", label: "Full body" },
  { value: "upper_lower", label: "Upper / lower" },
  { value: "push_pull_legs", label: "Push / pull / legs" },
  { value: "run_strength", label: "Run + strength" },
  { value: "mobility_strength", label: "Mobility + strength" },
  { value: "flexible", label: "Flexible" }
];

const progressionModeOptions: Array<{ value: ProgressionMode; label: string }> = [
  { value: "symptom_based", label: "Symptom based" },
  { value: "adherence_based", label: "Adherence based" },
  { value: "performance_based", label: "Performance based" },
  { value: "hybrid", label: "Hybrid" }
];

const weekdays: Array<{ value: Weekday; label: string }> = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" }
];

function getDefaultSchedule(daysPerWeek: number) {
  return defaultDays.slice(0, daysPerWeek);
}

function getDefaultSplit(goalType: TrainingGoalType, daysPerWeek: number): PlanPreferredSplit {
  if (goalType === "running") {
    return "run_strength";
  }

  if (goalType === "recovery") {
    return "mobility_strength";
  }

  if (goalType === "strength" || goalType === "hypertrophy") {
    return daysPerWeek >= 4 ? "upper_lower" : "full_body";
  }

  return "flexible";
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinList(values: string[] | undefined) {
  return values?.join(", ") ?? "";
}

function getInitialConstraints(profile: Profile | null) {
  return [
    ...(profile?.injuries ?? []).filter((item) => item !== "None right now"),
    ...(profile?.limitationsDetail ? [profile.limitationsDetail] : [])
  ];
}

function getInitialSetup(profile: Profile | null): PlanSetupInput {
  const goalType = profile?.primaryGoalType ?? "general_fitness";
  const daysPerWeek = profile?.daysPerWeek ?? 3;

  return {
    goalType,
    objectiveSummary: "",
    daysPerWeek,
    sessionMinutes: profile?.sessionMinutes ?? 45,
    weeklySchedule: getDefaultSchedule(daysPerWeek),
    preferredSplit: getDefaultSplit(goalType, daysPerWeek),
    focusAreas: [
      ...(profile?.exercisePreferences ?? []).slice(0, 2),
      ...(profile?.sportsInterests ?? []).slice(0, 1)
    ],
    currentConstraints: getInitialConstraints(profile),
    progressionModeOverride: null
  };
}

function toggleWeekday(values: Weekday[], value: Weekday) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function PlanSetupWizard({
  profile,
  initialMode = "guided"
}: PlanSetupWizardProps) {
  const [mode, setMode] = useState<PlanMode>(initialMode);
  const [stepIndex, setStepIndex] = useState(0);
  const [setup, setSetup] = useState<PlanSetupInput>(() => getInitialSetup(profile));
  const [draft, setDraft] = useState<StructuredPlanInput | null>(null);
  const [draftKey, setDraftKey] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const step = steps[stepIndex];

  const selectedGoal = goalOptions.find((option) => option.value === setup.goalType);
  const defaultProgressionMode = useMemo(
    () => selectDefaultProgressionMode(setup.goalType),
    [setup.goalType]
  );
  const hasProfileContext = Boolean(profile?.onboardingCompletedAt);
  const hasEquipmentContext = Boolean(profile?.equipment.length);

  function updateGoalType(goalType: TrainingGoalType) {
    setSetup((current) => ({
      ...current,
      goalType,
      preferredSplit: getDefaultSplit(goalType, current.daysPerWeek),
      progressionModeOverride: null
    }));
  }

  function updateDaysPerWeek(daysPerWeek: number) {
    setSetup((current) => ({
      ...current,
      daysPerWeek,
      weeklySchedule: current.weeklySchedule.length
        ? current.weeklySchedule.slice(0, daysPerWeek)
        : getDefaultSchedule(daysPerWeek),
      preferredSplit: getDefaultSplit(current.goalType, daysPerWeek)
    }));
  }

  async function generateDraft() {
    setGenerating(true);
    setGenerationError(null);

    try {
      const response = await fetch("/api/plan-drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(setup)
      });
      const result = (await response.json()) as {
        draft?: StructuredPlanInput;
        error?: string;
      };

      if (!response.ok || !result.draft) {
        throw new Error(result.error ?? "Unable to generate plan draft.");
      }

      setDraft(result.draft);
      setDraftKey((current) => current + 1);
      setStepIndex(3);
    } catch (error) {
      setGenerationError(
        error instanceof Error ? error.message : "Unable to generate plan draft."
      );
    } finally {
      setGenerating(false);
    }
  }

  if (mode === "manual") {
    return (
      <div className="space-y-5 sm:space-y-6">
        <div className="rounded-[24px] bg-white/70 p-4 sm:rounded-[28px]">
          <p className="text-sm font-semibold text-ink">Manual builder</p>
          <p className="mt-2 text-sm leading-6 text-slate">
            Build the structure yourself. This path is still here for advanced edits or plans
            you already have in mind.
          </p>
          <button
            type="button"
            onClick={() => setMode("guided")}
            className="mt-4 rounded-full border border-ink/10 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-coral hover:text-coral"
          >
            Use Guided Setup
          </button>
        </div>
        <PlanBuilderForm submitLabel="Save Manual Plan" />
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 rounded-[24px] bg-white/70 p-4 sm:rounded-[28px] md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">Guided setup</p>
          <p className="mt-1 text-sm leading-6 text-slate">
            Answer a few plan-specific questions, generate a draft, then edit before saving.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMode("manual")}
          className="rounded-full border border-ink/10 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-coral hover:text-coral"
        >
          Manual Builder
        </button>
      </div>

      {!hasProfileContext ? (
        <div className="rounded-[24px] border border-gold/30 bg-gold/10 p-4 text-sm leading-6 text-slate sm:rounded-[28px]">
          Your training profile is missing or incomplete, so this draft will use simple
          starter defaults. You can still edit everything before saving.
        </div>
      ) : !hasEquipmentContext ? (
        <div className="rounded-[24px] border border-gold/30 bg-gold/10 p-4 text-sm leading-6 text-slate sm:rounded-[28px]">
          Your profile does not list equipment yet. This draft will lean on bodyweight-friendly
          choices, and you can swap exercises in review.
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {steps.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setStepIndex(index)}
            disabled={index === 3 && !draft}
            className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] transition sm:px-4 ${
              step.id === item.id
                ? "bg-ink text-white"
                : "bg-white text-slate hover:text-coral disabled:opacity-45"
            }`}
          >
            {index + 1}. {item.label}
          </button>
        ))}
        <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate sm:px-4">
          5. Save
        </span>
      </div>

      {step.id === "goal" ? (
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-3xl text-ink">What are you training for now?</h2>
            <p className="mt-2 text-sm leading-6 text-slate">
              Pick the main track for this plan. Your profile still supplies background context.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {goalOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateGoalType(option.value)}
                className={`rounded-[24px] p-4 text-left transition sm:rounded-[28px] ${
                  setup.goalType === option.value ? "bg-coral text-white" : "bg-white text-ink"
                }`}
              >
                <span className="block font-semibold">{option.label}</span>
                <span className="mt-2 block text-sm leading-6 opacity-80">{option.helper}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step.id === "details" ? (
        <div className="space-y-5">
          <div>
            <h2 className="font-display text-3xl text-ink">Plan details</h2>
            <p className="mt-2 text-sm leading-6 text-slate">
              Keep this specific to the plan you want right now.
            </p>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-ink">Optional objective summary</span>
            <textarea
              value={setup.objectiveSummary ?? ""}
              onChange={(event) =>
                setSetup((current) => ({
                  ...current,
                  objectiveSummary: event.target.value
                }))
              }
              rows={3}
              placeholder="Example: rebuild a consistent three-day routine around knee-friendly lower body work."
              className="mt-3 w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="text-sm font-semibold text-ink">Training days per week</span>
              <input
                type="number"
                min={1}
                max={7}
                value={setup.daysPerWeek}
                onChange={(event) => updateDaysPerWeek(Number(event.target.value))}
                className="mt-3 w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-ink">Session length</span>
              <select
                value={setup.sessionMinutes}
                onChange={(event) =>
                  setSetup((current) => ({
                    ...current,
                    sessionMinutes: Number(event.target.value)
                  }))
                }
                className="mt-3 w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
              >
                {[30, 45, 60, 75].map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} minutes
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-ink">Preferred split</span>
              <select
                value={setup.preferredSplit}
                onChange={(event) =>
                  setSetup((current) => ({
                    ...current,
                    preferredSplit: event.target.value as PlanPreferredSplit
                  }))
                }
                className="mt-3 w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
              >
                {splitOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <p className="text-sm font-semibold text-ink">Training days</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {weekdays.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() =>
                    setSetup((current) => ({
                      ...current,
                      weeklySchedule: toggleWeekday(current.weeklySchedule, day.value)
                    }))
                  }
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    setup.weeklySchedule.includes(day.value)
                      ? "bg-coral text-white"
                      : "bg-white text-ink"
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-ink">Temporary focus areas</span>
              <input
                value={joinList(setup.focusAreas)}
                onChange={(event) =>
                  setSetup((current) => ({
                    ...current,
                    focusAreas: splitList(event.target.value)
                  }))
                }
                placeholder="Glutes, shoulders, running base"
                className="mt-3 w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-ink">Current constraints</span>
              <input
                value={joinList(setup.currentConstraints)}
                onChange={(event) =>
                  setSetup((current) => ({
                    ...current,
                    currentConstraints: splitList(event.target.value)
                  }))
                }
                placeholder="Knee sensitivity, no jumping"
                className="mt-3 w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
              />
            </label>
          </div>

          <details className="rounded-[24px] bg-white/70 p-4 sm:rounded-[28px]">
            <summary className="cursor-pointer text-sm font-semibold text-ink">
              Advanced progression override
            </summary>
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_2fr] md:items-center">
              <select
                value={setup.progressionModeOverride ?? ""}
                onChange={(event) =>
                  setSetup((current) => ({
                    ...current,
                    progressionModeOverride: event.target.value
                      ? (event.target.value as ProgressionMode)
                      : null
                  }))
                }
                className="rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
              >
                <option value="">Use default</option>
                {progressionModeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-sm leading-6 text-slate">
                Default for {selectedGoal?.label ?? "this goal"}:{" "}
                {defaultProgressionMode ?? "not set yet"}.
              </p>
            </div>
          </details>
        </div>
      ) : null}

      {step.id === "generate" ? (
        <div className="space-y-5">
          <div className="rounded-[24px] bg-white/70 p-5 sm:rounded-[28px]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">
              Ready to draft
            </p>
            <h2 className="mt-2 font-display text-3xl text-ink">
              Generate a reviewable {selectedGoal?.label.toLowerCase()} draft.
            </h2>
            <div className="mt-4 space-y-2 text-sm leading-6 text-slate">
              <p>
                {setup.daysPerWeek} days per week, {setup.sessionMinutes} minutes per session.
              </p>
              <p>
                Focus: {setup.focusAreas.length ? setup.focusAreas.join(", ") : "general setup"}.
              </p>
              <p>
                Constraints:{" "}
                {setup.currentConstraints.length
                  ? setup.currentConstraints.join(", ")
                  : "none added for this plan"}.
              </p>
            </div>
          </div>

          {generationError ? (
            <div className="rounded-[24px] border border-coral/30 bg-coral/10 p-4 text-sm leading-6 text-slate sm:rounded-[28px]">
              {generationError}
            </div>
          ) : null}

        </div>
      ) : null}

      {step.id === "review" ? (
        <div className="space-y-5">
          <div className="rounded-[24px] bg-white/70 p-4 sm:rounded-[28px]">
            <p className="text-sm font-semibold text-ink">Review and edit before saving</p>
            <p className="mt-2 text-sm leading-6 text-slate">
              This is the same review path future draft sources can use. Make any changes,
              then save when the structure looks right.
            </p>
          </div>
          {draft ? (
            <PlanBuilderForm
              key={draftKey}
              initialPlan={draft}
              submitLabel="Save Generated Plan"
            />
          ) : (
            <div className="rounded-[24px] bg-white/70 p-5 text-sm leading-6 text-slate sm:rounded-[28px]">
              Generate a draft first, then review it here.
            </div>
          )}
        </div>
      ) : null}

      {step.id !== "review" ? (
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
            className="rounded-full border border-ink/10 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-coral hover:text-coral disabled:opacity-40"
          >
            Back
          </button>
          {step.id === "generate" ? (
            <button
              type="button"
              onClick={generateDraft}
              disabled={generating}
              className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:opacity-60"
            >
              {generating ? "Generating..." : "Generate Draft"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStepIndex((index) => Math.min(steps.length - 1, index + 1))}
              className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
            >
              Continue
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
