import {
  trainingEnvironmentOptions,
  trainingExperienceOptions
} from "@/lib/profile-options";
import { getDefaultPlanSplit, getDefaultSchedule } from "@/lib/plan-setup-context";
import type {
  AiImportedExercise,
  AiImportedPhase,
  AiImportedPlan,
  AiImportedWorkout,
  AiPlanPromptInput,
  PlanSetupInput,
  Profile,
  StructuredExerciseInput,
  StructuredPhaseInput,
  StructuredPlanInput,
  StructuredWorkoutInput,
  TrainingEnvironment,
  TrainingExperience,
  TrainingGoalType,
  Weekday
} from "@/lib/types";
import { isProgressionMode, isTrainingGoalType } from "@/lib/validation";

const BASE_INSTRUCTION_BLOCK = `You are drafting a structured workout plan for import into a workout application.

Important rules:
- Return ONLY the required markdown format.
- Do not include commentary before or after the plan.
- Do not use bullet points, tables, or JSON.
- Use the exact section labels and field labels shown below.
- Keep all values concise and parseable.
- Use only the allowed enum values for goal_track and progression_mode.
- Respect the selected assigned_days when organizing workouts for the week.
- Include at least 1 phase.
- Include at least 1 workout per phase.
- Include at least 1 exercise per workout.
- Keep notes short.
- Do not include medical advice or diagnosis.
- Do not add extra fields.`;

const GOAL_ROLE_GUIDANCE: Record<TrainingGoalType, string> = {
  recovery: "Use a rehab-informed, symptom-aware planning voice for this recovery plan.",
  general_fitness:
    "Use a concise coaching voice matched to general fitness without adding extra format variation.",
  strength:
    "Use a practical coaching voice focused on progressive training structure for this strength plan.",
  hypertrophy:
    "Use a practical coaching voice focused on progressive training structure for this hypertrophy plan.",
  running:
    "Use a concise coaching voice matched to running without adding extra format variation.",
  sport_performance:
    "Use a concise coaching voice matched to sport performance without adding extra format variation.",
  consistency:
    "Use a concise coaching voice matched to consistency without adding extra format variation."
};

const EXACT_OUTPUT_EXAMPLE_BLOCK = `Return the plan in exactly this format:

PLAN
title: Example Plan
goal_track: strength
progression_mode: performance_based
days_per_week: 4
session_duration_min: 60
summary: Brief one-line summary

PHASE 1
name: Foundation
duration_weeks: 4
objective: Build base tolerance and movement quality

WORKOUT
name: Lower A
focus: Squat and hinge emphasis

EXERCISE
name: Goblet Squat
sets: 3
reps: 8
rest_seconds: 90
notes: Controlled tempo

EXERCISE
name: Romanian Deadlift
sets: 3
reps: 8
rest_seconds: 90
notes: Stop with 2 reps in reserve`;

const GOAL_GUIDANCE: Record<TrainingGoalType, string> = {
  recovery: `Planning guidance for this goal:
- Build a progression-based recovery plan with multiple phases when the training goal calls for progression over time.
- Use conservative progression.
- Favor symptom-aware exercise selection.
- Prefer simple, repeatable sessions.
- Progress from lower-demand work toward higher tolerance or confidence as appropriate.
- Keep exercise notes practical and caution-oriented.
- Avoid implying diagnosis or treatment.`,
  general_fitness: `Planning guidance for this goal:
- Prioritize balanced, sustainable training.
- Keep the structure simple and repeatable.
- Avoid unnecessary complexity or excessive exercise variety.`,
  strength: `Planning guidance for this goal:
- Organize training around a few clear movement priorities.
- Use progressive loading logic appropriate for performance-based progress.
- Keep accessory work supportive, not dominant.`,
  hypertrophy: `Planning guidance for this goal:
- Emphasize repeatable volume and muscle-group coverage.
- Keep exercise variety moderate, not excessive.
- Use concise notes oriented toward effort and control.`,
  running: `Planning guidance for this goal:
- Keep running sessions simple and structured.
- Use exercise-like workout items only if needed for compatibility with the app.
- Avoid highly specialized running terminology unless clearly useful.`,
  sport_performance: `Planning guidance for this goal:
- Keep the structure practical and broadly applicable.
- Emphasize supportive strength, power, or conditioning work without over-specializing.
- Keep the plan usable for a general adaptive training app.`,
  consistency: `Planning guidance for this goal:
- Prioritize low-friction adherence.
- Keep sessions approachable and easy to repeat consistently.
- Favor simpler structure over aggressive progression.`
};

const DEFAULT_ADVANCEMENT_PRESET = "clean_sessions_in_window";
const DEFAULT_ADVANCEMENT_SETTINGS = { sessions: 4, weeks: 2 };
const DEFAULT_DELOAD_PRESET = "pain_flags_in_window";
const DEFAULT_DELOAD_SETTINGS = { painFlags: 2, days: 7 };

const PHASE_LIMITS = {
  minPhases: 1,
  maxPhases: 4,
  minWorkoutsPerPhase: 1,
  maxWorkoutsPerPhase: 7,
  minExercisesPerWorkout: 1,
  maxExercisesPerWorkout: 10
} as const;

type ParseSuccess = {
  ok: true;
  data: AiImportedPlan;
};

type ParseFailure = {
  ok: false;
  errors: string[];
};

export type AiImportParseResult = ParseSuccess | ParseFailure;

function joinList(values: string[] | undefined) {
  return (values ?? []).map((value) => value.trim()).filter(Boolean).join(", ");
}

function getExperienceLabel(value: TrainingExperience | null | undefined) {
  return (
    trainingExperienceOptions.find((option) => option.value === value)?.value ?? ""
  );
}

function getEnvironmentLabel(value: TrainingEnvironment | null | undefined) {
  return trainingEnvironmentOptions.find((option) => option.value === value)?.value ?? "";
}

function sanitizeCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatPromptField(value: string) {
  return value.trim();
}

function formatAssignedDays(values: Weekday[]) {
  return values.join(", ");
}

function formatFocusFromSetup(setup: PlanSetupInput) {
  const parts = [setup.objectiveSummary ?? "", ...setup.focusAreas].filter(Boolean);
  return parts.join(". ").trim();
}

function formatLimitations(profile: Profile | null, setup: PlanSetupInput) {
  const profileParts = [
    ...(profile?.injuries ?? []).filter((injury) => injury !== "None right now"),
    profile?.limitationsDetail ?? ""
  ].filter(Boolean);
  const setupParts = setup.currentConstraints.filter(Boolean);
  return Array.from(new Set([...profileParts, ...setupParts].map((part) => part.trim())))
    .filter(Boolean)
    .join(", ")
    .trim();
}

export function buildAiPlanPromptInput({
  profile,
  setup
}: {
  profile: Profile | null;
  setup: PlanSetupInput;
}): AiPlanPromptInput {
  return {
    goalTrack: setup.goalType,
    daysPerWeek: setup.daysPerWeek,
    sessionDurationMin: setup.sessionMinutes,
    weeklySchedule: setup.weeklySchedule.length
      ? setup.weeklySchedule
      : getDefaultSchedule(setup.daysPerWeek),
    equipmentAccess: joinList(profile?.equipment),
    experienceLevel: profile?.trainingExperience ?? null,
    limitations: formatLimitations(profile, setup),
    primaryFocus: formatFocusFromSetup(setup),
    progressionMode: setup.progressionModeOverride ?? null,
    trainingEnvironment: profile?.trainingEnvironment ?? null,
    preferences: profile?.exercisePreferences ?? [],
    dislikes: profile?.exerciseDislikes ?? [],
    sportsInterests: profile?.sportsInterests ?? [],
    freeformContext: ""
  };
}

export function normalizeAiPlanPromptInput(input: AiPlanPromptInput): AiPlanPromptInput {
  return {
    ...input,
    weeklySchedule: Array.from(new Set(input.weeklySchedule)),
    equipmentAccess: input.equipmentAccess.trim(),
    limitations: input.limitations.trim(),
    primaryFocus: input.primaryFocus.trim(),
    preferences: (input.preferences ?? []).map((value) => value.trim()).filter(Boolean),
    dislikes: (input.dislikes ?? []).map((value) => value.trim()).filter(Boolean),
    sportsInterests: (input.sportsInterests ?? [])
      .map((value) => value.trim())
      .filter(Boolean),
    freeformContext: input.freeformContext?.trim() ?? ""
  };
}

export function validateAiPlanPromptInput(input: AiPlanPromptInput) {
  const normalized = normalizeAiPlanPromptInput(input);
  const errors: string[] = [];

  if (!normalized.equipmentAccess) {
    errors.push("Equipment access is required.");
  }

  if (!normalized.experienceLevel) {
    errors.push("Experience level is required.");
  }

  if (!normalized.limitations) {
    errors.push("Limitations are required. Use \"none\" if there are no current limitations.");
  }

  if (!normalized.primaryFocus) {
    errors.push("Primary focus is required.");
  }

  if (!normalized.weeklySchedule.length) {
    errors.push("Choose at least one training day.");
  }

  return errors;
}

export function aiPromptInputToSetupContext(input: AiPlanPromptInput): PlanSetupInput {
  const normalized = normalizeAiPlanPromptInput(input);
  return {
    goalType: normalized.goalTrack,
    objectiveSummary: normalized.freeformContext || normalized.primaryFocus,
    daysPerWeek: normalized.daysPerWeek,
    sessionMinutes: normalized.sessionDurationMin,
    weeklySchedule: normalized.weeklySchedule.length
      ? normalized.weeklySchedule
      : getDefaultSchedule(normalized.daysPerWeek),
    preferredSplit: getDefaultPlanSplit(normalized.goalTrack, normalized.daysPerWeek),
    focusAreas: [normalized.primaryFocus],
    currentConstraints: normalized.limitations ? [normalized.limitations] : [],
    progressionModeOverride: normalized.progressionMode ?? null
  };
}

export function buildAiPlanPrompt(input: AiPlanPromptInput) {
  const normalized = normalizeAiPlanPromptInput(input);
  return [
    BASE_INSTRUCTION_BLOCK,
    "",
    GOAL_ROLE_GUIDANCE[normalized.goalTrack],
    "",
    GOAL_GUIDANCE[normalized.goalTrack],
    "",
    "User context:",
    `goal_track: ${normalized.goalTrack}`,
    `days_per_week: ${normalized.daysPerWeek}`,
    `assigned_days: ${formatAssignedDays(normalized.weeklySchedule)}`,
    `session_duration_min: ${normalized.sessionDurationMin}`,
    `equipment_access: ${formatPromptField(normalized.equipmentAccess)}`,
    `experience_level: ${formatPromptField(getExperienceLabel(normalized.experienceLevel))}`,
    `limitations: ${formatPromptField(normalized.limitations)}`,
    `primary_focus: ${formatPromptField(normalized.primaryFocus)}`,
    `progression_mode: ${normalized.progressionMode ?? ""}`,
    `training_environment: ${formatPromptField(
      getEnvironmentLabel(normalized.trainingEnvironment)
    )}`,
    `preferences: ${joinList(normalized.preferences)}`,
    `dislikes: ${joinList(normalized.dislikes)}`,
    `sports_interests: ${joinList(normalized.sportsInterests)}`,
    `freeform_context: ${formatPromptField(normalized.freeformContext ?? "")}`,
    "",
    EXACT_OUTPUT_EXAMPLE_BLOCK
  ].join("\n");
}

function normalizeImportedMarkdown(input: string) {
  return input
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

function getNonEmptyLines(input: string) {
  return normalizeImportedMarkdown(input)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function createFailure(message: string): ParseFailure {
  return {
    ok: false,
    errors: [message]
  };
}

function parsePositiveInteger(value: string, label: string, context: string) {
  if (!/^\d+$/.test(value)) {
    throw new Error(`${context}: ${label} must be an integer.`);
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${context}: ${label} must be greater than 0.`);
  }

  return parsed;
}

function parseNonNegativeInteger(value: string, label: string, context: string) {
  if (!/^\d+$/.test(value)) {
    throw new Error(`${context}: ${label} must be an integer.`);
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${context}: ${label} must be greater than or equal to 0.`);
  }

  return parsed;
}

function parseRequiredField({
  lines,
  index,
  label,
  context,
  knownLabels,
  seenLabels
}: {
  lines: string[];
  index: number;
  label: string;
  context: string;
  knownLabels?: string[];
  seenLabels?: Set<string>;
}) {
  const line = lines[index];

  if (!line) {
    throw new Error(`${context}: missing \`${label}\` field.`);
  }

  const separatorIndex = line.indexOf(":");

  if (separatorIndex === -1) {
    throw new Error(`${context}: expected \`${label}: ...\`.`);
  }

  const nextLabel = line.slice(0, separatorIndex).trim();
  const value = line.slice(separatorIndex + 1).trim();

  if (seenLabels?.has(nextLabel)) {
    throw new Error(`${context}: duplicate field \`${nextLabel}\`.`);
  }

  if (nextLabel !== label) {
    if (knownLabels?.includes(nextLabel)) {
      throw new Error(`${context}: out-of-order field \`${nextLabel}\`.`);
    }

    throw new Error(`${context}: expected \`${label}\`, found \`${nextLabel}\`.`);
  }

  seenLabels?.add(nextLabel);

  return {
    value,
    nextIndex: index + 1
  };
}

function expectHeader({
  lines,
  index,
  expected,
  context
}: {
  lines: string[];
  index: number;
  expected: string;
  context: string;
}) {
  const line = lines[index];

  if (line !== expected) {
    throw new Error(`${context}: expected header \`${expected}\`.`);
  }

  return index + 1;
}

function parseExercise(lines: string[], index: number, workoutNumber: number, phaseNumber: number) {
  const context = `Phase ${phaseNumber}, Workout ${workoutNumber}, Exercise`;
  const fieldLabels = ["name", "sets", "reps", "rest_seconds", "notes"];
  const seenLabels = new Set<string>();
  let nextIndex = expectHeader({
    lines,
    index,
    expected: "EXERCISE",
    context
  });

  const name = parseRequiredField({
    lines,
    index: nextIndex,
    label: "name",
    context,
    knownLabels: fieldLabels,
    seenLabels
  });
  nextIndex = name.nextIndex;
  const sets = parseRequiredField({
    lines,
    index: nextIndex,
    label: "sets",
    context,
    knownLabels: fieldLabels,
    seenLabels
  });
  nextIndex = sets.nextIndex;
  const reps = parseRequiredField({
    lines,
    index: nextIndex,
    label: "reps",
    context,
    knownLabels: fieldLabels,
    seenLabels
  });
  nextIndex = reps.nextIndex;
  const restSeconds = parseRequiredField({
    lines,
    index: nextIndex,
    label: "rest_seconds",
    context,
    knownLabels: fieldLabels,
    seenLabels
  });
  nextIndex = restSeconds.nextIndex;
  const notes = parseRequiredField({
    lines,
    index: nextIndex,
    label: "notes",
    context,
    knownLabels: fieldLabels,
    seenLabels
  });

  return {
    data: {
      name: name.value,
      sets: parsePositiveInteger(sets.value, "sets", context),
      reps: reps.value,
      restSeconds: restSeconds.value
        ? parseNonNegativeInteger(restSeconds.value, "rest_seconds", context)
        : null,
      notes: notes.value
    } satisfies AiImportedExercise,
    nextIndex: notes.nextIndex
  };
}

function parseWorkout(lines: string[], index: number, workoutNumber: number, phaseNumber: number) {
  const context = `Phase ${phaseNumber}, Workout ${workoutNumber}`;
  const fieldLabels = ["name", "focus"];
  const seenLabels = new Set<string>();
  let nextIndex = expectHeader({
    lines,
    index,
    expected: "WORKOUT",
    context
  });

  const name = parseRequiredField({
    lines,
    index: nextIndex,
    label: "name",
    context,
    knownLabels: fieldLabels,
    seenLabels
  });
  nextIndex = name.nextIndex;
  const focus = parseRequiredField({
    lines,
    index: nextIndex,
    label: "focus",
    context,
    knownLabels: fieldLabels,
    seenLabels
  });
  nextIndex = focus.nextIndex;

  const exercises: AiImportedExercise[] = [];

  while (lines[nextIndex] === "EXERCISE") {
    const exercise = parseExercise(lines, nextIndex, workoutNumber, phaseNumber);
    exercises.push(exercise.data);
    nextIndex = exercise.nextIndex;

    if (exercises.length > PHASE_LIMITS.maxExercisesPerWorkout) {
      throw new Error(
        `${context}: workouts may include at most ${PHASE_LIMITS.maxExercisesPerWorkout} exercises in v1.`
      );
    }
  }

  if (exercises.length < PHASE_LIMITS.minExercisesPerWorkout) {
    throw new Error(`${context}: each workout requires at least one exercise.`);
  }

  return {
    data: {
      name: name.value,
      focus: focus.value,
      exercises
    } satisfies AiImportedWorkout,
    nextIndex
  };
}

function parsePhase(lines: string[], index: number, expectedPhaseNumber: number) {
  const header = lines[index];
  const match = /^PHASE (\d+)$/.exec(header ?? "");

  if (!match) {
    throw new Error(`Expected \`PHASE ${expectedPhaseNumber}\` header.`);
  }

  const phaseNumber = Number(match[1]);

  if (phaseNumber !== expectedPhaseNumber) {
    throw new Error(
      `Expected \`PHASE ${expectedPhaseNumber}\`, found \`PHASE ${phaseNumber}\`.`
    );
  }

  const context = `Phase ${phaseNumber}`;
  const fieldLabels = ["name", "duration_weeks", "objective"];
  const seenLabels = new Set<string>();
  let nextIndex = index + 1;
  const name = parseRequiredField({
    lines,
    index: nextIndex,
    label: "name",
    context,
    knownLabels: fieldLabels,
    seenLabels
  });
  nextIndex = name.nextIndex;
  const durationWeeks = parseRequiredField({
    lines,
    index: nextIndex,
    label: "duration_weeks",
    context,
    knownLabels: fieldLabels,
    seenLabels
  });
  nextIndex = durationWeeks.nextIndex;
  const objective = parseRequiredField({
    lines,
    index: nextIndex,
    label: "objective",
    context,
    knownLabels: fieldLabels,
    seenLabels
  });
  nextIndex = objective.nextIndex;

  const workouts: AiImportedWorkout[] = [];

  while (lines[nextIndex] === "WORKOUT") {
    const workout = parseWorkout(lines, nextIndex, workouts.length + 1, phaseNumber);
    workouts.push(workout.data);
    nextIndex = workout.nextIndex;

    if (workouts.length > PHASE_LIMITS.maxWorkoutsPerPhase) {
      throw new Error(
        `${context}: phases may include at most ${PHASE_LIMITS.maxWorkoutsPerPhase} workouts in v1.`
      );
    }
  }

  if (workouts.length < PHASE_LIMITS.minWorkoutsPerPhase) {
    throw new Error(`${context}: each phase requires at least one workout.`);
  }

  return {
    data: {
      phaseNumber,
      name: name.value,
      durationWeeks: parsePositiveInteger(durationWeeks.value, "duration_weeks", context),
      objective: objective.value,
      workouts
    } satisfies AiImportedPhase,
    nextIndex
  };
}

export function parseAiPlanImport(input: string): AiImportParseResult {
  const normalized = normalizeImportedMarkdown(input);

  if (!normalized) {
    return createFailure("Paste the AI draft first.");
  }

  const lines = getNonEmptyLines(normalized);

  try {
    const planFieldLabels = [
      "title",
      "goal_track",
      "progression_mode",
      "days_per_week",
      "session_duration_min",
      "summary"
    ];
    const seenPlanLabels = new Set<string>();
    let index = expectHeader({
      lines,
      index: 0,
      expected: "PLAN",
      context: "Plan"
    });

    const title = parseRequiredField({
      lines,
      index,
      label: "title",
      context: "Plan",
      knownLabels: planFieldLabels,
      seenLabels: seenPlanLabels
    });
    index = title.nextIndex;
    const goalTrack = parseRequiredField({
      lines,
      index,
      label: "goal_track",
      context: "Plan",
      knownLabels: planFieldLabels,
      seenLabels: seenPlanLabels
    });
    index = goalTrack.nextIndex;
    const progressionMode = parseRequiredField({
      lines,
      index,
      label: "progression_mode",
      context: "Plan",
      knownLabels: planFieldLabels,
      seenLabels: seenPlanLabels
    });
    index = progressionMode.nextIndex;
    const daysPerWeek = parseRequiredField({
      lines,
      index,
      label: "days_per_week",
      context: "Plan",
      knownLabels: planFieldLabels,
      seenLabels: seenPlanLabels
    });
    index = daysPerWeek.nextIndex;
    const sessionDuration = parseRequiredField({
      lines,
      index,
      label: "session_duration_min",
      context: "Plan",
      knownLabels: planFieldLabels,
      seenLabels: seenPlanLabels
    });
    index = sessionDuration.nextIndex;
    const summary = parseRequiredField({
      lines,
      index,
      label: "summary",
      context: "Plan",
      knownLabels: planFieldLabels,
      seenLabels: seenPlanLabels
    });
    index = summary.nextIndex;

    if (!isTrainingGoalType(goalTrack.value)) {
      throw new Error("Plan: `goal_track` must be one of the allowed values.");
    }

    if (progressionMode.value && !isProgressionMode(progressionMode.value)) {
      throw new Error("Plan: `progression_mode` must be blank or one of the allowed values.");
    }

    const phases: AiImportedPhase[] = [];

    while (index < lines.length) {
      const phase = parsePhase(lines, index, phases.length + 1);
      phases.push(phase.data);
      index = phase.nextIndex;

      if (phases.length > PHASE_LIMITS.maxPhases) {
        throw new Error(`Plans may include at most ${PHASE_LIMITS.maxPhases} phases in v1.`);
      }
    }

    if (phases.length < PHASE_LIMITS.minPhases) {
      throw new Error("Imported plans require at least one phase.");
    }

    return {
      ok: true,
      data: {
        title: title.value,
        goalTrack: goalTrack.value,
        progressionMode: progressionMode.value
          ? (progressionMode.value as AiImportedPlan["progressionMode"])
          : null,
        daysPerWeek: parsePositiveInteger(daysPerWeek.value, "days_per_week", "Plan"),
        sessionDurationMin: parsePositiveInteger(
          sessionDuration.value,
          "session_duration_min",
          "Plan"
        ),
        summary: summary.value,
        phases
      }
    };
  } catch (error) {
    return createFailure(
      error instanceof Error ? error.message : "Unable to parse the imported AI draft."
    );
  }
}

function buildPhaseGoal(phase: AiImportedPhase) {
  return `${phase.name} (${phase.durationWeeks} weeks): ${phase.objective}`;
}

function buildWorkoutSummary(workout: AiImportedWorkout) {
  return `Focus on ${workout.focus}.`;
}

function mapExercise(exercise: AiImportedExercise): StructuredExerciseInput {
  return {
    name: exercise.name,
    sets: exercise.sets,
    reps: exercise.reps,
    rest: exercise.restSeconds !== null ? `${exercise.restSeconds} sec` : "",
    coachingNote: exercise.notes,
    videoUrl: ""
  };
}

function mapWorkout(workout: AiImportedWorkout, scheduledDays: Weekday[]): StructuredWorkoutInput {
  return {
    name: workout.name,
    focus: workout.focus,
    summary: buildWorkoutSummary(workout),
    scheduledDays,
    exercises: workout.exercises.map(mapExercise)
  };
}

function mapPhase(phase: AiImportedPhase, weeklySchedule: Weekday[]): StructuredPhaseInput {
  return {
    goal: buildPhaseGoal(phase),
    advancementPreset: DEFAULT_ADVANCEMENT_PRESET,
    advancementSettings: DEFAULT_ADVANCEMENT_SETTINGS,
    deloadPreset: DEFAULT_DELOAD_PRESET,
    deloadSettings: DEFAULT_DELOAD_SETTINGS,
    workouts: phase.workouts.map((workout, index) =>
      mapWorkout(workout, weeklySchedule.length ? [weeklySchedule[index % weeklySchedule.length]] : [])
    )
  };
}

export function convertAiImportToStructuredPlan({
  importedPlan,
  promptInput
}: {
  importedPlan: AiImportedPlan;
  promptInput: AiPlanPromptInput;
}): StructuredPlanInput {
  const normalizedPromptInput = normalizeAiPlanPromptInput(promptInput);
  const weeklySchedule = normalizedPromptInput.weeklySchedule.length
    ? normalizedPromptInput.weeklySchedule
    : getDefaultSchedule(importedPlan.daysPerWeek);

  return {
    version: "structured-v1",
    name: importedPlan.title,
    description: importedPlan.summary,
    goalType: importedPlan.goalTrack,
    progressionMode: importedPlan.progressionMode,
    creationSource: "ai_import",
    weeklySchedule,
    phases: importedPlan.phases.map((phase) => mapPhase(phase, weeklySchedule))
  };
}

export function parseCommaSeparatedInput(value: string) {
  return sanitizeCommaList(value);
}

export function formatCommaSeparatedInput(values: string[] | undefined) {
  return joinList(values);
}
