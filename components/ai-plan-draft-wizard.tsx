"use client";

import { useMemo, useState } from "react";
import { PlanBuilderForm } from "@/components/plan-builder-form";
import {
  equipmentOptions,
  sportsInterestOptions,
  trainingEnvironmentOptions,
  trainingExperienceOptions,
  weekdays as weekdayOptions
} from "@/lib/profile-options";
import {
  aiPromptInputToSetupContext,
  buildAiPlanPrompt,
  buildAiPlanPromptInput,
  convertAiImportToStructuredPlan,
  formatCommaSeparatedInput,
  parseAiPlanImport,
  parseCommaSeparatedInput,
  validateAiPlanPromptInput
} from "@/lib/plan-drafting/ai-draft-import";
import type {
  AiPlanPromptInput,
  PlanSetupInput,
  Profile,
  ProgressionMode,
  TrainingEnvironment,
  TrainingExperience,
  TrainingGoalType,
  Weekday
} from "@/lib/types";

type AiWizardStep = "goal" | "schedule" | "context" | "optional" | "prompt" | "import" | "review";

type AiPlanDraftWizardProps = {
  profile: Profile | null;
  initialSetup: PlanSetupInput;
};

const steps: Array<{ id: AiWizardStep; label: string; helper: string }> = [
  { id: "goal", label: "Goal", helper: "Choose the main plan direction." },
  { id: "schedule", label: "Schedule", helper: "Set the weekly rhythm." },
  { id: "context", label: "Context", helper: "Add the required drafting context." },
  { id: "optional", label: "Optional", helper: "Add extra preferences if helpful." },
  { id: "prompt", label: "Prompt", helper: "Copy the generated external prompt." },
  { id: "import", label: "Import", helper: "Paste the generated plan for validation." },
  { id: "review", label: "Review", helper: "Review and edit before saving." }
];

const goalOptions: Array<{
  value: TrainingGoalType;
  label: string;
  helper: string;
}> = [
  {
    value: "recovery",
    label: "Recovery",
    helper: "Use AI for a conservative, symptom-aware draft."
  },
  {
    value: "general_fitness",
    label: "General fitness",
    helper: "Generate a balanced starter structure."
  },
  {
    value: "strength",
    label: "Strength",
    helper: "Get a simple strength-oriented draft to review."
  },
  {
    value: "hypertrophy",
    label: "Hypertrophy",
    helper: "Create a repeatable muscle-focused structure."
  },
  {
    value: "running",
    label: "Running",
    helper: "Draft a running-supportive plan in the app's current shape."
  },
  {
    value: "sport_performance",
    label: "Sport performance",
    helper: "Generate supportive athletic training without over-specializing."
  },
  {
    value: "consistency",
    label: "Consistency",
    helper: "Create a low-friction plan that is easy to repeat."
  }
];

const progressionModeOptions: Array<{ value: ProgressionMode; label: string }> = [
  { value: "symptom_based", label: "Symptom based" },
  { value: "adherence_based", label: "Adherence based" },
  { value: "performance_based", label: "Performance based" },
  { value: "hybrid", label: "Hybrid" }
];

const externalAssistantOptions = [
  {
    name: "ChatGPT",
    href: "https://chatgpt.com/",
    label: "Recommended",
    helper: "Best first choice for copying the prompt and bringing the plan back here."
  },
  {
    name: "Claude",
    href: "https://claude.ai/",
    label: "Alternative",
    helper: "Also works if you prefer Claude."
  },
  {
    name: "Gemini",
    href: "https://gemini.google.com/",
    label: "Alternative",
    helper: "Also works if you prefer Gemini."
  }
];

function toggleWeekday(values: Weekday[], value: Weekday) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function AiPlanDraftWizard({
  profile,
  initialSetup
}: AiPlanDraftWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [promptInput, setPromptInput] = useState<AiPlanPromptInput>(() =>
    buildAiPlanPromptInput({ profile, setup: initialSetup })
  );
  const [importText, setImportText] = useState("");
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [detailErrors, setDetailErrors] = useState<string[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [draft, setDraft] = useState<ReturnType<typeof convertAiImportToStructuredPlan> | null>(
    null
  );
  const [draftKey, setDraftKey] = useState(0);

  const step = steps[stepIndex];
  const selectedGoal = goalOptions.find((option) => option.value === promptInput.goalTrack);
  const generatedPrompt = useMemo(() => buildAiPlanPrompt(promptInput), [promptInput]);
  const setupContext = useMemo(
    () => aiPromptInputToSetupContext(promptInput),
    [promptInput]
  );

  function updateDaysPerWeek(daysPerWeek: number) {
    setPromptInput((current) => ({
      ...current,
      daysPerWeek,
      weeklySchedule: current.weeklySchedule.length
        ? current.weeklySchedule.slice(0, daysPerWeek)
        : current.weeklySchedule
    }));
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopyStatus("Prompt copied.");
    } catch {
      setCopyStatus("Copy failed. You can still select and copy the prompt manually.");
    }
  }

  function continueFromDetails() {
    const errors = validateAiPlanPromptInput(promptInput);

    if (errors.length) {
      setDetailErrors(errors);
      return;
    }

    setDetailErrors([]);
    setStepById("prompt");
  }

  function importDraft() {
    const parsed = parseAiPlanImport(importText);

    if (!parsed.ok) {
      setImportErrors(parsed.errors);
      setDraft(null);
      return;
    }

    const structuredDraft = convertAiImportToStructuredPlan({
      importedPlan: parsed.data,
      promptInput
    });

    setImportErrors([]);
    setDraft(structuredDraft);
    setDraftKey((current) => current + 1);
    setStepById("review");
  }

  function continueToNextStep() {
    setDetailErrors([]);
    setStepIndex((index) => Math.min(steps.length - 1, index + 1));
  }

  function setStepById(nextStep: AiWizardStep) {
    setStepIndex(steps.findIndex((item) => item.id === nextStep));
  }

  return (
    <div className="space-y-6">
      <div className="surface-panel-muted space-y-3 p-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Step {stepIndex + 1} of {steps.length}
          </p>
          <p className="text-sm leading-6 text-muted">{step.helper}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {steps.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setStepIndex(index)}
            disabled={item.id === "review" && !draft}
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
          8. Save
        </span>
        </div>
      </div>

      {step.id === "goal" ? (
        <div className="space-y-5">
          <div>
            <h2 className="font-display text-3xl text-copy">What should the draft focus on?</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Pick the main goal for this plan. The prompt and imported draft will stay aligned
              to this choice.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {goalOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setPromptInput((current) => ({
                    ...current,
                    goalTrack: option.value
                  }))
                }
                className={`rounded-[24px] border p-4 text-left transition sm:rounded-[28px] ${
                  promptInput.goalTrack === option.value
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

      {step.id === "schedule" ? (
        <div className="space-y-5">
          <div>
            <h2 className="font-display text-3xl text-copy">When will this plan fit?</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Set the training rhythm the external draft should respect. You can edit the final
              schedule again before saving.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="text-sm font-semibold text-copy">Days per week</span>
              <input
                type="number"
                min={1}
                max={7}
                value={promptInput.daysPerWeek}
                onChange={(event) => updateDaysPerWeek(Number(event.target.value))}
                className="ui-input mt-3"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-copy">Session length</span>
              <select
                value={promptInput.sessionDurationMin}
                onChange={(event) =>
                  setPromptInput((current) => ({
                    ...current,
                    sessionDurationMin: Number(event.target.value)
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
          </div>

          <div>
            <p className="text-sm font-semibold text-copy">Exact training days</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              These days stay in the app as your initial schedule. You can adjust them again in
              review before saving.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {weekdayOptions.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() =>
                    setPromptInput((current) => ({
                      ...current,
                      weeklySchedule: toggleWeekday(current.weeklySchedule, day.value)
                    }))
                  }
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    promptInput.weeklySchedule.includes(day.value)
                      ? "bg-accent text-accent-contrast"
                      : "border border-border bg-surface text-copy"
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {step.id === "context" ? (
        <div className="space-y-5">
          <div>
            <h2 className="font-display text-3xl text-copy">What should the assistant know?</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              These required details keep the prompt practical and help the app validate the
              imported plan before review.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-copy">Experience level</span>
                <select
                  value={promptInput.experienceLevel ?? ""}
                  onChange={(event) =>
                    setPromptInput((current) => ({
                      ...current,
                      experienceLevel: event.target.value
                        ? (event.target.value as TrainingExperience)
                        : null
                    }))
                  }
                  className="ui-input mt-3"
              >
                <option value="">Select experience</option>
                {trainingExperienceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-copy">Equipment access</span>
              <input
                value={promptInput.equipmentAccess}
                onChange={(event) =>
                  setPromptInput((current) => ({
                    ...current,
                    equipmentAccess: event.target.value
                  }))
                }
                placeholder={equipmentOptions.join(", ")}
                className="ui-input mt-3"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-copy">Limitations</span>
              <textarea
                value={promptInput.limitations}
                onChange={(event) =>
                  setPromptInput((current) => ({
                    ...current,
                    limitations: event.target.value
                  }))
                }
                rows={3}
                placeholder="Use 'none' if there are no current limitations."
                className="ui-input mt-3 min-h-[7rem]"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-copy">Primary focus</span>
              <textarea
                value={promptInput.primaryFocus}
                onChange={(event) =>
                  setPromptInput((current) => ({
                    ...current,
                    primaryFocus: event.target.value
                  }))
                }
                rows={3}
                placeholder="Example: build strength while keeping overhead work shoulder-friendly."
                className="ui-input mt-3 min-h-[7rem]"
              />
            </label>
          </div>

          {detailErrors.length ? (
            <div className="rounded-[24px] border border-accent/25 bg-accent/10 p-4 text-sm leading-6 text-muted sm:rounded-[28px]">
              {detailErrors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {step.id === "optional" ? (
        <div className="space-y-5">
          <div>
            <h2 className="font-display text-3xl text-copy">Any preferences to include?</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              These are optional. Leave anything blank if it does not matter for this draft.
            </p>
          </div>

          <div className="surface-panel">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-copy">
                  How this plan should progress
                </span>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Choose the type of progress signal the app should lean on, or leave this blank
                  to let the draft use its default.
                </p>
                <select
                  value={promptInput.progressionMode ?? ""}
                  onChange={(event) =>
                    setPromptInput((current) => ({
                      ...current,
                      progressionMode: event.target.value
                        ? (event.target.value as ProgressionMode)
                        : null
                    }))
                  }
                  className="ui-input mt-3"
                >
                  <option value="">Leave blank</option>
                  {progressionModeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-copy">Training environment</span>
                <select
                  value={promptInput.trainingEnvironment ?? ""}
                  onChange={(event) =>
                    setPromptInput((current) => ({
                      ...current,
                      trainingEnvironment: event.target.value
                        ? (event.target.value as TrainingEnvironment)
                        : null
                    }))
                  }
                  className="ui-input mt-3"
                >
                  <option value="">Leave blank</option>
                  {trainingEnvironmentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-copy">Preferences</span>
                <input
                  value={formatCommaSeparatedInput(promptInput.preferences)}
                  onChange={(event) =>
                    setPromptInput((current) => ({
                      ...current,
                      preferences: parseCommaSeparatedInput(event.target.value)
                    }))
                  }
                  className="ui-input mt-3"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-copy">Dislikes</span>
                <input
                  value={formatCommaSeparatedInput(promptInput.dislikes)}
                  onChange={(event) =>
                    setPromptInput((current) => ({
                      ...current,
                      dislikes: parseCommaSeparatedInput(event.target.value)
                    }))
                  }
                  className="ui-input mt-3"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-copy">Sports interests</span>
                <input
                  value={formatCommaSeparatedInput(promptInput.sportsInterests)}
                  onChange={(event) =>
                    setPromptInput((current) => ({
                      ...current,
                      sportsInterests: parseCommaSeparatedInput(event.target.value)
                    }))
                  }
                  placeholder={sportsInterestOptions.join(", ")}
                  className="ui-input mt-3"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-semibold text-copy">
                  Would you like the chatbot to know anything else about the plan?
                </span>
                <textarea
                  value={promptInput.freeformContext ?? ""}
                  onChange={(event) =>
                    setPromptInput((current) => ({
                      ...current,
                      freeformContext: event.target.value
                    }))
                  }
                  rows={3}
                  className="ui-input mt-3 min-h-[7rem]"
                />
              </label>
            </div>
          </div>
        </div>
      ) : null}

      {step.id === "prompt" ? (
        <div className="space-y-5">
          <div className="surface-panel">
            <p className="ui-eyebrow">Draft with AI</p>
            <h2 className="mt-2 font-display text-3xl text-copy">
              Copy the prompt into an external AI tool
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              The app does not connect to ChatGPT, Claude, or Gemini. You copy the prompt, use
              one of those tools yourself, then return here with the generated plan.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {externalAssistantOptions.map((assistant) => (
              <a
                key={assistant.name}
                href={assistant.href}
                target="_blank"
                rel="noreferrer"
                className={`rounded-[24px] border p-4 text-left transition sm:rounded-[28px] ${
                  assistant.name === "ChatGPT"
                    ? "border-accent/30 bg-accent/10 text-copy hover:border-accent"
                    : "border-border/70 bg-surface text-copy hover:border-secondary"
                }`}
              >
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  {assistant.label}
                </span>
                <span className="mt-2 block text-lg font-semibold">{assistant.name}</span>
                <span className="mt-2 block text-sm leading-6 text-muted">
                  {assistant.helper}
                </span>
              </a>
            ))}
          </div>

          <div className="surface-panel">
            <p className="text-sm font-semibold text-copy">Round trip</p>
            <ol className="mt-3 grid gap-2 text-sm leading-6 text-muted md:grid-cols-5">
              {[
                "Copy the prompt.",
                "Open ChatGPT, Claude, or Gemini.",
                "Paste the prompt.",
                "Copy or download the generated plan.",
                "Return here and import it."
              ].map((item, index) => (
                <li key={item} className="rounded-[20px] border border-border/70 bg-surface px-4 py-3">
                  <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    {index + 1}
                  </span>
                  <span className="mt-1 block font-semibold text-copy">{item}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="surface-panel flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-copy">Prompt ready</p>
            <p className="mt-1 text-sm leading-6 text-muted">
                Copy this first, then open your preferred external tool. Ask it to return the
                fenced transfer block exactly as requested.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <button type="button" onClick={copyPrompt} className="ui-button-primary">
                Copy Prompt
              </button>
              {copyStatus ? <p className="text-sm text-muted">{copyStatus}</p> : null}
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-copy">
              Prompt for {selectedGoal?.label.toLowerCase() ?? "this plan"}
            </span>
            <textarea
              readOnly
              value={generatedPrompt}
              rows={22}
              className="ui-input mt-3 min-h-[28rem] font-mono text-xs leading-6"
            />
          </label>
        </div>
      ) : null}

      {step.id === "import" ? (
        <div className="space-y-5">
          <div className="surface-panel">
            <p className="text-sm font-semibold text-copy">Paste the transfer block</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Paste the fenced block that starts with{" "}
              <span className="font-mono text-copy">```adaptive-training-plan</span>. If your
              external tool only gave you the plan text, paste the strict markdown beginning with{" "}
              <span className="font-mono text-copy">PLAN</span>. Validation still rejects bullets,
              JSON, commentary inside the plan, and unsupported extra fields.
            </p>
          </div>
          <label className="block">
            <span className="text-sm font-semibold text-copy">Generated plan text</span>
            <textarea
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              rows={22}
              placeholder={`\`\`\`adaptive-training-plan\nPLAN\ntitle: Example Plan\ngoal_track: strength\nprogression_mode: performance_based\n...\n\`\`\``}
              className="ui-input mt-3 min-h-[28rem] font-mono text-xs leading-6"
            />
          </label>
          {importErrors.length ? (
            <div className="rounded-[24px] border border-accent/25 bg-accent/10 p-4 text-sm leading-6 text-muted sm:rounded-[28px]">
              <p className="font-semibold text-copy">Import needs a quick fix.</p>
              {importErrors.map((error) => (
                <p key={error} className="mt-2">{error}</p>
              ))}
              <p className="mt-3">
                Check that the pasted text includes one plan, starts with `PLAN` inside the
                transfer block, keeps the required field order, and does not include bullets,
                JSON, tables, or extra fields.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {step.id === "review" ? (
        <div className="space-y-5">
          <div className="surface-panel">
            <p className="text-sm font-semibold text-copy">Review and edit before saving</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              The imported markdown is no longer the source of truth here. Review the converted
              plan, make any changes you want, then save through the normal plan flow.
            </p>
          </div>
          {draft ? (
            <PlanBuilderForm
              key={draftKey}
              initialPlan={draft}
              submitLabel="Save AI Draft"
              setupContext={setupContext}
            />
          ) : (
            <div className="surface-panel text-sm leading-6 text-muted">
              Import a valid AI draft first, then review it here.
            </div>
          )}
        </div>
      ) : null}

      {step.id !== "review" ? (
        <div className="ui-mobile-actions">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
            className="ui-button-secondary disabled:opacity-40"
          >
            Back
          </button>
          {["goal", "schedule"].includes(step.id) ? (
            <button
              type="button"
              onClick={continueToNextStep}
              className="ui-button-primary"
            >
              Continue
            </button>
          ) : null}
          {step.id === "context" ? (
            <button
              type="button"
              onClick={() => {
                const errors = validateAiPlanPromptInput(promptInput);

                if (errors.length) {
                  setDetailErrors(errors);
                  return;
                }

                continueToNextStep();
              }}
              className="ui-button-primary"
            >
              Continue
            </button>
          ) : null}
          {step.id === "optional" ? (
            <button
              type="button"
              onClick={continueFromDetails}
              className="ui-button-primary"
            >
              Generate Prompt
            </button>
          ) : null}
          {step.id === "prompt" ? (
            <button
              type="button"
              onClick={() => setStepById("import")}
              className="ui-button-primary"
            >
              Continue to Import
            </button>
          ) : null}
          {step.id === "import" ? (
            <button
              type="button"
              onClick={importDraft}
              className="ui-button-primary"
            >
            Import to Review
          </button>
        ) : null}
        </div>
        </div>
      ) : null}
    </div>
  );
}
