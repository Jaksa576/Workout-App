"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import type { ReactNode } from "react";
import { exerciseCatalog, exerciseCategories, toPlanExercise } from "@/lib/exercise-library";
import { formatPhaseLabel } from "@/lib/plan-labels";
import type {
  AdvancementPreset,
  DeloadPreset,
  PlanCreationSource,
  PlanSetupInput,
  ProgressionMode,
  StructuredExerciseInput,
  StructuredPhaseInput,
  StructuredPlanInput,
  StructuredWorkoutInput,
  TrainingGoalType,
  Weekday
} from "@/lib/types";

type Step = "basics" | "schedule" | "phases" | "workouts" | "criteria" | "review";

const steps: Array<{ id: Step; label: string }> = [
  { id: "basics", label: "Basics" },
  { id: "schedule", label: "Schedule" },
  { id: "phases", label: "Phases" },
  { id: "workouts", label: "Workouts" },
  { id: "criteria", label: "Progression" },
  { id: "review", label: "Review" }
];

const weekdayOptions: Array<{ value: Weekday; label: string }> = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" }
];

const advancementOptions: Array<{ value: AdvancementPreset; label: string }> = [
  { value: "clean_sessions_in_window", label: "Clean sessions over time" },
  { value: "clean_sessions_streak", label: "Clean session streak" },
  { value: "all_scheduled_workouts", label: "Planned workouts completed" }
];

const deloadOptions: Array<{ value: DeloadPreset; label: string }> = [
  { value: "pain_flags_in_window", label: "Pain flags in a recent window" },
  { value: "too_hard_streak", label: "Too-hard sessions in a row" }
];

function makeExercise(overrides?: Partial<StructuredExerciseInput>): StructuredExerciseInput {
  return {
    name: "",
    sets: 3,
    reps: "8",
    rest: "60 sec",
    coachingNote: "",
    videoUrl: "",
    ...overrides
  };
}

function makeWorkout(overrides?: Partial<StructuredWorkoutInput>): StructuredWorkoutInput {
  return {
    name: "Lower Body + Core",
    focus: "Movement quality",
    summary: "Move with control and log how the session felt afterward.",
    scheduledDays: [],
    exercises: [
      makeExercise(toPlanExercise(exerciseCatalog[1])),
      makeExercise(toPlanExercise(exerciseCatalog[4]))
    ],
    ...overrides
  };
}

function makePhase(overrides?: Partial<StructuredPhaseInput>): StructuredPhaseInput {
  return {
    goal: "Build clean, repeatable movement.",
    advancementPreset: "clean_sessions_in_window",
    advancementSettings: { sessions: 4, weeks: 2 },
    deloadPreset: "pain_flags_in_window",
    deloadSettings: { painFlags: 2, days: 7 },
    workouts: [makeWorkout()],
    ...overrides
  };
}

function toggleListValue<T extends string>(values: T[], value: T) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function Field({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-copy">{label}</span>
      <div className="mt-3">{children}</div>
    </label>
  );
}

type PlanBuilderFormProps = {
  initialPlan?: StructuredPlanInput;
  submitLabel?: string;
  setupContext?: PlanSetupInput | null;
  planId?: string;
  flow?: "create" | "edit-details" | "edit-setup";
  editingPlanName?: string;
};

export function PlanBuilderForm({
  initialPlan,
  submitLabel = "Save Workout Plan",
  setupContext = null,
  planId,
  flow = "create",
  editingPlanName
}: PlanBuilderFormProps) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState(initialPlan?.name ?? "Starter Workout Plan");
  const [description, setDescription] = useState(
    initialPlan?.description ??
      "A clear plan with phases, repeatable workouts, and simple progression rules."
  );
  const [goalType] = useState<TrainingGoalType | null>(initialPlan?.goalType ?? null);
  const [progressionMode] = useState<ProgressionMode | null>(
    initialPlan?.progressionMode ?? null
  );
  const [creationSource] = useState<PlanCreationSource>(
    initialPlan?.creationSource ?? "manual"
  );
  const [weeklySchedule, setWeeklySchedule] = useState<Weekday[]>(
    () => initialPlan?.weeklySchedule ?? ["mon", "wed", "fri"]
  );
  const [phases, setPhases] = useState<StructuredPhaseInput[]>(() =>
    initialPlan?.phases ? structuredClone(initialPlan.phases) : [makePhase()]
  );
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [exerciseCategory, setExerciseCategory] = useState("all");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const currentStep = steps[stepIndex];
  const planLabel = editingPlanName ?? name;

  const reviewNotice =
    flow === "edit-details"
      ? "Past workout history stays saved. Changes to this plan apply going forward, including any updated phases, workouts, and exercises."
      : flow === "edit-setup"
        ? `You are reviewing a regenerated version of ${planLabel}. Saving replaces the live plan structure. Old workout and exercise names stay readable in history snapshots, and prior sessions should not be treated as progress toward the regenerated structure.`
        : null;

  const filteredExercises = useMemo(() => {
    const normalizedSearch = exerciseSearch.trim().toLowerCase();

    return exerciseCatalog.filter((exercise) => {
      const matchesCategory =
        exerciseCategory === "all" || exercise.category === exerciseCategory;
      const matchesSearch =
        !normalizedSearch ||
        exercise.name.toLowerCase().includes(normalizedSearch) ||
        exercise.equipmentTags.some((tag) => tag.toLowerCase().includes(normalizedSearch));

      return matchesCategory && matchesSearch;
    });
  }, [exerciseCategory, exerciseSearch]);

  function updatePhase(index: number, nextPhase: StructuredPhaseInput) {
    setPhases((current) =>
      current.map((phase, phaseIndex) => (phaseIndex === index ? nextPhase : phase))
    );
  }

  function updateWorkout(
    phaseIndex: number,
    workoutIndex: number,
    nextWorkout: StructuredWorkoutInput
  ) {
    const phase = phases[phaseIndex];
    updatePhase(phaseIndex, {
      ...phase,
      workouts: phase.workouts.map((workout, index) =>
        index === workoutIndex ? nextWorkout : workout
      )
    });
  }

  function updateExercise(
    phaseIndex: number,
    workoutIndex: number,
    exerciseIndex: number,
    nextExercise: StructuredExerciseInput
  ) {
    const workout = phases[phaseIndex].workouts[workoutIndex];
    updateWorkout(phaseIndex, workoutIndex, {
      ...workout,
      exercises: workout.exercises.map((exercise, index) =>
        index === exerciseIndex ? nextExercise : exercise
      )
    });
  }

  function addCatalogExercise(phaseIndex: number, workoutIndex: number, exerciseId: string) {
    const catalogExercise = exerciseCatalog.find((exercise) => exercise.id === exerciseId);

    if (!catalogExercise) {
      return;
    }

    const workout = phases[phaseIndex].workouts[workoutIndex];
    updateWorkout(phaseIndex, workoutIndex, {
      ...workout,
      exercises: [...workout.exercises, toPlanExercise(catalogExercise)]
    });
  }

  function deletePhase(phaseIndex: number) {
    setPhases((current) =>
      current.length <= 1 ? current : current.filter((_, index) => index !== phaseIndex)
    );
  }

  function deleteWorkout(phaseIndex: number, workoutIndex: number) {
    const phase = phases[phaseIndex];

    if (phase.workouts.length <= 1) {
      return;
    }

    updatePhase(phaseIndex, {
      ...phase,
      workouts: phase.workouts.filter((_, index) => index !== workoutIndex)
    });
  }

  function deleteExercise(phaseIndex: number, workoutIndex: number, exerciseIndex: number) {
    const workout = phases[phaseIndex].workouts[workoutIndex];

    if (workout.exercises.length <= 1) {
      return;
    }

    updateWorkout(phaseIndex, workoutIndex, {
      ...workout,
      exercises: workout.exercises.filter((_, index) => index !== exerciseIndex)
    });
  }

  async function handleSubmit() {
    setSaving(true);
    setStatus(null);

    const payload: StructuredPlanInput = {
      version: "structured-v1",
      name,
      description,
      goalType,
      progressionMode,
      creationSource,
      weeklySchedule,
      phases
    };
    const requestBody = setupContext ? { plan: payload, setupContext } : payload;
    const endpoint = planId ? `/api/plans/${planId}` : "/api/plans";
    const method = planId ? "PATCH" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      const result = (await response.json()) as { id?: string; error?: string };

      if (!response.ok || !result.id) {
        throw new Error(result.error ?? "Unable to save plan.");
      }

      router.push(`/plans/${planId ?? result.id}` as Route);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save plan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="surface-panel-muted grid grid-cols-2 gap-2 p-3 sm:flex sm:flex-wrap">
        {steps.map((step, index) => (
          <button
            key={step.id}
            type="button"
            onClick={() => setStepIndex(index)}
            className={`ui-step-chip ${
              currentStep.id === step.id
                ? "ui-step-chip-active"
                : ""
            }`}
          >
            {index + 1}. {step.label}
          </button>
        ))}
      </div>

      {currentStep.id === "basics" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Plan name">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="ui-input"
            />
          </Field>
          <Field label="Plan description">
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="ui-input min-h-[8rem]"
            />
          </Field>
        </div>
      ) : null}

      {currentStep.id === "schedule" ? (
        <div className="space-y-4">
          <p className="text-sm leading-6 text-muted">
            Pick the days this plan should usually happen. You can assign workouts to days next.
          </p>
          <div className="flex flex-wrap gap-3">
            {weekdayOptions.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => setWeeklySchedule((current) => toggleListValue(current, day.value))}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  weeklySchedule.includes(day.value)
                    ? "bg-accent text-accent-contrast"
                    : "border border-border bg-surface text-copy"
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {currentStep.id === "phases" ? (
        <div className="space-y-4">
          {phases.map((phase, phaseIndex) => (
            <div key={phaseIndex} className="surface-panel">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-copy">
                  {formatPhaseLabel(phaseIndex + 1)}
                </p>
                <button
                  type="button"
                  onClick={() => deletePhase(phaseIndex)}
                  disabled={phases.length <= 1}
                  className="ui-button-ghost px-4 py-2 disabled:opacity-45"
                >
                  Delete Phase
                </button>
              </div>
              <Field label={`${formatPhaseLabel(phaseIndex + 1)} goal`}>
                <input
                  value={phase.goal}
                  onChange={(event) =>
                    updatePhase(phaseIndex, { ...phase, goal: event.target.value })
                  }
                  className="ui-input"
                />
              </Field>
              {phases.length <= 1 ? (
                <p className="mt-3 text-sm leading-6 text-muted">
                  A plan needs at least one phase.
                </p>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setPhases((current) => [...current, makePhase({ goal: "Progress the plan with control." })])}
            className="ui-button-secondary w-full sm:w-auto"
          >
            Add Phase
          </button>
        </div>
      ) : null}

      {currentStep.id === "workouts" ? (
        <div className="space-y-6">
          <div className="surface-panel">
            <p className="text-sm font-semibold text-copy">Exercise library</p>
            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_12rem]">
              <input
                value={exerciseSearch}
                onChange={(event) => setExerciseSearch(event.target.value)}
                placeholder="Search exercises or equipment"
                className="ui-input"
              />
              <select
                value={exerciseCategory}
                onChange={(event) => setExerciseCategory(event.target.value)}
                className="ui-input"
              >
                <option value="all">All categories</option>
                {exerciseCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {phases.map((phase, phaseIndex) => (
            <div key={phaseIndex} className="space-y-4">
              <h3 className="font-display text-2xl text-copy">
                {formatPhaseLabel(phaseIndex + 1)}
              </h3>
              {phase.workouts.map((workout, workoutIndex) => (
                <div key={workoutIndex} className="surface-panel">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-copy">
                      Workout {workoutIndex + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() => deleteWorkout(phaseIndex, workoutIndex)}
                      disabled={phase.workouts.length <= 1}
                      className="ui-button-ghost px-4 py-2 disabled:opacity-45"
                    >
                      Delete Workout
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Field label="Workout name">
                      <input
                        value={workout.name}
                        onChange={(event) =>
                          updateWorkout(phaseIndex, workoutIndex, {
                            ...workout,
                            name: event.target.value
                          })
                        }
                        className="ui-input"
                      />
                    </Field>
                    <Field label="Focus">
                      <input
                        value={workout.focus}
                        onChange={(event) =>
                          updateWorkout(phaseIndex, workoutIndex, {
                            ...workout,
                            focus: event.target.value
                          })
                        }
                        className="ui-input"
                      />
                    </Field>
                    <Field label="Assigned days">
                      <div className="flex flex-wrap gap-2">
                        {weekdayOptions.map((day) => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() =>
                              updateWorkout(phaseIndex, workoutIndex, {
                                ...workout,
                                scheduledDays: toggleListValue(workout.scheduledDays, day.value)
                              })
                            }
                            className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                              workout.scheduledDays.includes(day.value)
                                ? "bg-hero text-white"
                                : "border border-border bg-shell-elevated text-muted"
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </Field>
                  </div>

                  <Field label="Workout summary">
                    <input
                      value={workout.summary}
                      onChange={(event) =>
                        updateWorkout(phaseIndex, workoutIndex, {
                          ...workout,
                          summary: event.target.value
                        })
                      }
                      className="ui-input"
                    />
                  </Field>

                  <div className="mt-5 space-y-3">
                    {workout.exercises.map((exercise, exerciseIndex) => (
                      <div key={exerciseIndex} className="grid gap-3 rounded-[20px] border border-border/70 bg-surface px-4 py-4 md:grid-cols-4">
                        <input
                          value={exercise.name}
                          onChange={(event) =>
                            updateExercise(phaseIndex, workoutIndex, exerciseIndex, {
                              ...exercise,
                              name: event.target.value
                            })
                          }
                          aria-label="Exercise name"
                          className="ui-input px-3 py-2"
                        />
                        <input
                          type="number"
                          min={1}
                          value={exercise.sets}
                          onChange={(event) =>
                            updateExercise(phaseIndex, workoutIndex, exerciseIndex, {
                              ...exercise,
                              sets: Number(event.target.value)
                            })
                          }
                          aria-label="Sets"
                          className="ui-input px-3 py-2"
                        />
                        <input
                          value={exercise.reps}
                          onChange={(event) =>
                            updateExercise(phaseIndex, workoutIndex, exerciseIndex, {
                              ...exercise,
                              reps: event.target.value
                            })
                          }
                          aria-label="Reps"
                          className="ui-input px-3 py-2"
                        />
                        <input
                          value={exercise.rest}
                          onChange={(event) =>
                            updateExercise(phaseIndex, workoutIndex, exerciseIndex, {
                              ...exercise,
                              rest: event.target.value
                            })
                          }
                          aria-label="Rest"
                          className="ui-input px-3 py-2"
                        />
                        <input
                          value={exercise.coachingNote}
                          onChange={(event) =>
                            updateExercise(phaseIndex, workoutIndex, exerciseIndex, {
                              ...exercise,
                              coachingNote: event.target.value
                            })
                          }
                          aria-label="Coaching note"
                          className="ui-input px-3 py-2 md:col-span-2"
                        />
                        <input
                          value={exercise.videoUrl ?? ""}
                          onChange={(event) =>
                            updateExercise(phaseIndex, workoutIndex, exerciseIndex, {
                              ...exercise,
                              videoUrl: event.target.value
                            })
                          }
                          aria-label="Exercise video link"
                          className="ui-input px-3 py-2 md:col-span-2"
                        />
                        <button
                          type="button"
                          onClick={() => deleteExercise(phaseIndex, workoutIndex, exerciseIndex)}
                          disabled={workout.exercises.length <= 1}
                          className="ui-button-ghost px-4 py-2 disabled:opacity-45 md:col-span-4"
                        >
                          Delete Exercise
                        </button>
                      </div>
                    ))}
                    {workout.exercises.length <= 1 ? (
                      <p className="text-sm leading-6 text-muted">
                        A workout needs at least one exercise.
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <select
                      defaultValue=""
                      onChange={(event) => {
                        addCatalogExercise(phaseIndex, workoutIndex, event.target.value);
                        event.currentTarget.value = "";
                      }}
                      className="ui-input w-full rounded-full sm:w-auto"
                    >
                      <option value="" disabled>
                        Add from library
                      </option>
                      {filteredExercises.map((exercise) => (
                        <option key={exercise.id} value={exercise.id}>
                          {exercise.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        updateWorkout(phaseIndex, workoutIndex, {
                          ...workout,
                          exercises: [...workout.exercises, makeExercise()]
                        })
                      }
                      className="ui-button-secondary"
                    >
                      Add blank exercise
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updatePhase(phaseIndex, {
                          ...phase,
                          workouts: [...phase.workouts, structuredClone(workout)]
                        })
                      }
                      className="ui-button-secondary"
                    >
                      Duplicate workout
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  updatePhase(phaseIndex, {
                    ...phase,
                    workouts: [...phase.workouts, makeWorkout({ name: "New Workout" })]
                  })
                }
                className="w-full rounded-full bg-hero px-5 py-3 text-sm font-semibold text-white transition hover:bg-hero/90 sm:w-auto"
              >
                Add Workout to {formatPhaseLabel(phaseIndex + 1)}
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {currentStep.id === "criteria" ? (
        <div className="space-y-4">
          {phases.map((phase, phaseIndex) => (
            <div key={phaseIndex} className="surface-panel">
              <h3 className="font-display text-xl text-copy sm:text-2xl">
                {formatPhaseLabel(phaseIndex + 1)}
              </h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Advance when">
                  <select
                    value={phase.advancementPreset}
                    onChange={(event) =>
                      updatePhase(phaseIndex, {
                        ...phase,
                        advancementPreset: event.target.value as AdvancementPreset
                      })
                    }
                    className="ui-input"
                  >
                    {advancementOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Deload or review when">
                  <select
                    value={phase.deloadPreset}
                    onChange={(event) =>
                      updatePhase(phaseIndex, {
                        ...phase,
                        deloadPreset: event.target.value as DeloadPreset
                      })
                    }
                    className="ui-input"
                  >
                    {deloadOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Clean sessions needed">
                  <input
                    type="number"
                    min={1}
                    value={phase.advancementSettings.sessions ?? 4}
                    onChange={(event) =>
                      updatePhase(phaseIndex, {
                        ...phase,
                        advancementSettings: {
                          ...phase.advancementSettings,
                          sessions: Number(event.target.value)
                        }
                      })
                    }
                    className="ui-input"
                  />
                </Field>
                <Field label="Pain flags before review">
                  <input
                    type="number"
                    min={1}
                    value={phase.deloadSettings.painFlags ?? 2}
                    onChange={(event) =>
                      updatePhase(phaseIndex, {
                        ...phase,
                        deloadSettings: {
                          ...phase.deloadSettings,
                          painFlags: Number(event.target.value)
                        }
                      })
                    }
                    className="ui-input"
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {currentStep.id === "review" ? (
        <div className="space-y-4">
          {reviewNotice ? (
            <div className="rounded-[24px] border border-warning/25 bg-warning/10 p-4 text-sm leading-6 text-muted sm:rounded-[28px]">
              {reviewNotice}
            </div>
          ) : null}
          <div className="surface-panel">
            <p className="ui-eyebrow">Plan</p>
            <h3 className="mt-2 text-xl font-semibold text-copy">{name}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
          </div>
          {phases.map((phase, index) => (
            <div key={index} className="surface-panel" >
              <p className="font-semibold text-copy">
                {formatPhaseLabel(index + 1)}: {phase.goal}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                {phase.workouts.length} workouts,{" "}
                {phase.workouts.reduce((total, workout) => total + workout.exercises.length, 0)} exercises.
              </p>
            </div>
          ))}
          {status ? <p className="text-sm leading-6 text-muted">{status}</p> : null}
        </div>
      ) : null}

      {currentStep.id === "review" ? (
        <div className="ui-mobile-actions">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:flex-wrap">
            <button
              type="button"
              onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
              disabled={stepIndex === 0}
              className="ui-button-secondary disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="ui-button-primary disabled:opacity-60"
            >
              {saving ? "Saving..." : submitLabel}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
            disabled={stepIndex === 0}
            className="ui-button-secondary disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => setStepIndex((index) => Math.min(steps.length - 1, index + 1))}
            className="rounded-full bg-hero px-5 py-3 text-sm font-semibold text-white transition hover:bg-hero/90"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
