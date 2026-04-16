"use client";

import { useMemo, useState } from "react";
import { PlanBuilderForm } from "@/components/plan-builder-form";
import {
  buildDefaultPlanSetup,
  getDefaultPlanSplit,
  getDefaultSchedule
} from "@/lib/plan-setup-context";
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
  initialSetup?: PlanSetupInput;
  editingPlan?: {
    id: string;
    name: string;
  };
  setupContextNotices?: string[];
  setupContextMissingFields?: string[];
  allowManualMode?: boolean;
};

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

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinList(values: string[] | undefined) {
  return values?.join(", ") ?? "";
}

function toggleWeekday(values: Weekday[], value: Weekday) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function PlanSetupWizard({
  profile,
  initialMode = "guided",
  initialSetup,
  editingPlan,
  setupContextNotices = [],
  setupContextMissingFields = [],
  allowManualMode = true
}: PlanSetupWizardProps) {
  const [mode, setMode] = useState<PlanMode>(initialMode);
  const [stepIndex, setStepIndex] = useState(0);
  const [setup, setSetup] = useState<PlanSetupInput>(
    () => initialSetup ?? buildDefaultPlanSetup(profile)
  );
  const [draft, setDraft] = useState<StructuredPlanInput | null>(null);
  const [draftKey, setDraftKey] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const step = steps[stepIndex];
  const effectiveMode = allowManualMode ? mode : "guided";
  const isEditing = Boolean(editingPlan);

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
      preferredSplit: getDefaultPlanSplit(goalType, current.daysPerWeek),
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
      preferredSplit: getDefaultPlanSplit(current.goalType, daysPerWeek)
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

  if (effectiveMode === "manual") {
    return (
      <div className="space-y-6">
        <div className="surface-panel">
          <p className="text-sm font-semibold text-copy">Manual builder</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Build the structure yourself. This path is still here for advanced edits or plans
            you already have in mind.
          </p>
          <button
            type="button"
            onClick={() => setMode("guided")}
            className="ui-button-secondary mt-4"
          >
            Use Guided Setup
          </button>
        </div>
        <PlanBuilderForm submitLabel="Save Manual Plan" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="surface-panel flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-copy">Guided setup</p>
          <p className="mt-1 text-sm leading-6 text-muted">
            {isEditing
              ? "Update this plan's setup inputs, regenerate a draft, then review before saving."
              : "Answer a few plan-specific questions, generate a draft, then edit before saving."}
          </p>
        </div>
        {allowManualMode ? (
          <button
            type="button"
            onClick={() => setMode("manual")}
            className="ui-button-secondary"
          >
            Manual Builder
          </button>
        ) : null}
      </div>

      {setupContextNotices.length ? (
        <div className="rounded-[24px] border border-warning/25 bg-warning/10 p-4 text-sm leading-6 text-muted sm:rounded-[28px]">
          <div className="space-y-2">
            {setupContextNotices.map((notice) => (
              <p key={notice}>{notice}</p>
            ))}
            {setupContextMissingFields.length ? (
              <p>
                Please confirm: {setupContextMissingFields.join(", ")}.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {!hasProfileContext ? (
        <div className="rounded-[24px] border border-warning/25 bg-warning/10 p-4 text-sm leading-6 text-muted sm:rounded-[28px]">
          Your training profile is missing or incomplete, so this draft will use simple
          starter defaults. You can still edit everything before saving.
        </div>
      ) : !hasEquipmentContext ? (
        <div className="rounded-[24px] border border-warning/25 bg-warning/10 p-4 text-sm leading-6 text-muted sm:rounded-[28px]">
          Your profile does not list equipment yet. This draft will lean on bodyweight-friendly
          choices, and you can swap exercises in review.
        </div>
      ) : null}

      <div className="surface-panel-muted grid grid-cols-2 gap-2 p-3 sm:flex sm:flex-wrap">
        {steps.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setStepIndex(index)}
            disabled={index === 3 && !draft}
            className={`ui-step-chip ${
              step.id === item.id
                ? "ui-step-chip-active"
                : "disabled:opacity-45"
            }`}
          >
            {index + 1}. {item.label}
          </button>
        ))}
        <span className="rounded-full border border-border bg-surface px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted sm:px-4">
          5. Save
        </span>
      </div>

      {step.id === "goal" ? (
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-3xl text-copy">What are you training for now?</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {isEditing
                ? "Confirm the main track for this updated plan. This does not rerun onboarding."
                : "Pick the main track for this plan. Your profile still supplies background context."}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {goalOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateGoalType(option.value)}
                className={`rounded-[24px] border p-4 text-left transition sm:rounded-[28px] ${
                  setup.goalType === option.value
                    ? "border-transparent bg-accent text-accent-contrast"
                    : "border-border/70 bg-surface text-copy"
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
            <h2 className="font-display text-3xl text-copy">Plan details</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {isEditing
                ? "Update only the setup details that should guide the new draft."
                : "Keep this specific to the plan you want right now."}
            </p>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-copy">Optional objective summary</span>
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
              className="ui-input mt-3 min-h-[7.5rem]"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="text-sm font-semibold text-copy">Training days per week</span>
              <input
                type="number"
                min={1}
                max={7}
                value={setup.daysPerWeek}
                onChange={(event) => updateDaysPerWeek(Number(event.target.value))}
                className="ui-input mt-3"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-copy">Session length</span>
              <select
                value={setup.sessionMinutes}
                onChange={(event) =>
                  setSetup((current) => ({
                    ...current,
                    sessionMinutes: Number(event.target.value)
                  }))
                }
                className="ui-input mt-3"
              >
                {[30, 45, 60, 75].map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} minutes
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-copy">Preferred split</span>
              <select
                value={setup.preferredSplit}
                onChange={(event) =>
                  setSetup((current) => ({
                    ...current,
                    preferredSplit: event.target.value as PlanPreferredSplit
                  }))
                }
                className="ui-input mt-3"
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
            <p className="text-sm font-semibold text-copy">Training days</p>
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
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    setup.weeklySchedule.includes(day.value)
                      ? "bg-accent text-accent-contrast"
                      : "border border-border bg-surface text-copy"
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-copy">Temporary focus areas</span>
              <input
                value={joinList(setup.focusAreas)}
                onChange={(event) =>
                  setSetup((current) => ({
                    ...current,
                    focusAreas: splitList(event.target.value)
                  }))
                }
                placeholder="Glutes, shoulders, running base"
                className="ui-input mt-3"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-copy">Current constraints</span>
              <input
                value={joinList(setup.currentConstraints)}
                onChange={(event) =>
                  setSetup((current) => ({
                    ...current,
                    currentConstraints: splitList(event.target.value)
                  }))
                }
                placeholder="Knee sensitivity, no jumping"
                className="ui-input mt-3"
              />
            </label>
          </div>

          <details className="surface-panel">
            <summary className="cursor-pointer text-sm font-semibold text-copy">
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
                className="ui-input"
              >
                <option value="">Use default</option>
                {progressionModeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-sm leading-6 text-muted">
                Default for {selectedGoal?.label ?? "this goal"}:{" "}
                {defaultProgressionMode ?? "not set yet"}.
              </p>
            </div>
          </details>
        </div>
      ) : null}

      {step.id === "generate" ? (
        <div className="space-y-5">
          <div className="surface-panel">
            <p className="ui-eyebrow">Ready to draft</p>
            <h2 className="mt-2 font-display text-3xl text-copy">
              {isEditing
                ? `Generate an updated ${selectedGoal?.label.toLowerCase()} draft.`
                : `Generate a reviewable ${selectedGoal?.label.toLowerCase()} draft.`}
            </h2>
            <div className="mt-4 space-y-2 text-sm leading-6 text-muted">
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
            <div className="rounded-[24px] border border-accent/25 bg-accent/10 p-4 text-sm leading-6 text-muted sm:rounded-[28px]">
              {generationError}
            </div>
          ) : null}

        </div>
      ) : null}

      {step.id === "review" ? (
        <div className="space-y-5">
          <div className="surface-panel">
            <p className="text-sm font-semibold text-copy">Review and edit before saving</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              {isEditing
                ? `You are reviewing a regenerated version of ${editingPlan?.name ?? "this plan"}. Make any changes, then save when it looks right.`
                : "This is the same review path future draft sources can use. Make any changes, then save when the structure looks right."}
            </p>
          </div>
          {draft ? (
            <PlanBuilderForm
              key={draftKey}
              initialPlan={draft}
              submitLabel={isEditing ? "Save regenerated plan" : "Save Generated Plan"}
              setupContext={setup}
              planId={editingPlan?.id}
              flow={isEditing ? "edit-setup" : "create"}
              editingPlanName={editingPlan?.name}
            />
          ) : (
            <div className="surface-panel text-sm leading-6 text-muted">
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
            className="ui-button-secondary disabled:opacity-40"
          >
            Back
          </button>
          {step.id === "generate" ? (
            <button
              type="button"
              onClick={generateDraft}
              disabled={generating}
              className="rounded-full bg-hero px-5 py-3 text-sm font-semibold text-white transition hover:bg-hero/90 disabled:opacity-60"
            >
              {generating ? "Generating..." : "Generate Draft"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStepIndex((index) => Math.min(steps.length - 1, index + 1))}
              className="rounded-full bg-hero px-5 py-3 text-sm font-semibold text-white transition hover:bg-hero/90"
            >
              Continue
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
