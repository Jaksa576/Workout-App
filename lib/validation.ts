import type {
  ActivityLevel,
  AdvancementPreset,
  DeloadPreset,
  OnboardingInput,
  PlanFormInput,
  PlanCreationSource,
  PlanPreferredSplit,
  PlanSetupInput,
  ProfileSettingsInput,
  ProgressionMode,
  ProgressionSettings,
  StructuredPlanSaveInput,
  StructuredPlanInput,
  TrainingEnvironment,
  TrainingExperience,
  TrainingGoalType,
  Weekday,
  WorkoutSessionInput
} from "@/lib/types";

export const perceivedDifficultyValues = [
  "too_easy",
  "appropriate",
  "too_hard"
] as const;

export const weekdays: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const advancementPresets: AdvancementPreset[] = [
  "clean_sessions_in_window",
  "clean_sessions_streak",
  "all_scheduled_workouts"
];

export const deloadPresets: DeloadPreset[] = [
  "pain_flags_in_window",
  "too_hard_streak"
];

export const trainingGoalTypes: TrainingGoalType[] = [
  "recovery",
  "general_fitness",
  "strength",
  "hypertrophy",
  "running",
  "sport_performance",
  "consistency"
];

export const progressionModes: ProgressionMode[] = [
  "symptom_based",
  "adherence_based",
  "performance_based",
  "hybrid"
];

export const trainingExperienceValues: TrainingExperience[] = [
  "new",
  "returning",
  "intermediate",
  "advanced"
];

export const activityLevelValues: ActivityLevel[] = [
  "mostly_sedentary",
  "lightly_active",
  "moderately_active",
  "very_active"
];

export const trainingEnvironmentValues: TrainingEnvironment[] = [
  "home",
  "gym",
  "outdoors",
  "mixed"
];

export const planCreationSources: PlanCreationSource[] = [
  "manual",
  "guided_template",
  "llm_draft",
  "ai_import"
];

export const planSetupChoices = ["manual", "guided", "ai"] as const;

export const planPreferredSplits: PlanPreferredSplit[] = [
  "full_body",
  "upper_lower",
  "push_pull_legs",
  "run_strength",
  "mobility_strength",
  "flexible"
];

export function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export function isValidCompletedOn(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.toISOString().slice(0, 10) === value && value <= getTodayDateString();
}

export function normalizeExerciseVideoUrl(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  let url: URL;

  try {
    url = new URL(trimmedValue);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  const isYouTubeUrl =
    host === "youtu.be" ||
    host === "youtube.com" ||
    host.endsWith(".youtube.com");

  if (!["http:", "https:"].includes(url.protocol) || !isYouTubeUrl) {
    return null;
  }

  if (url.protocol === "http:") {
    url.protocol = "https:";
  }

  return url.toString();
}

export function isValidExerciseVideoUrl(value: string) {
  return normalizeExerciseVideoUrl(value) !== null;
}

export function isWeekday(value: unknown): value is Weekday {
  return typeof value === "string" && weekdays.includes(value as Weekday);
}

export function isTrainingGoalType(value: unknown): value is TrainingGoalType {
  return typeof value === "string" && trainingGoalTypes.includes(value as TrainingGoalType);
}

export function isProgressionMode(value: unknown): value is ProgressionMode {
  return typeof value === "string" && progressionModes.includes(value as ProgressionMode);
}

export function isTrainingExperience(value: unknown): value is TrainingExperience {
  return (
    typeof value === "string" &&
    trainingExperienceValues.includes(value as TrainingExperience)
  );
}

export function isActivityLevel(value: unknown): value is ActivityLevel {
  return typeof value === "string" && activityLevelValues.includes(value as ActivityLevel);
}

export function isTrainingEnvironment(value: unknown): value is TrainingEnvironment {
  return (
    typeof value === "string" &&
    trainingEnvironmentValues.includes(value as TrainingEnvironment)
  );
}

export function isPlanCreationSource(value: unknown): value is PlanCreationSource {
  return typeof value === "string" && planCreationSources.includes(value as PlanCreationSource);
}

export function isPlanPreferredSplit(value: unknown): value is PlanPreferredSplit {
  return typeof value === "string" && planPreferredSplits.includes(value as PlanPreferredSplit);
}

export function normalizeWeekdays(values: unknown) {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(new Set(values.filter(isWeekday)));
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value: unknown) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === "string";
}

function isOptionalNullableIntegerInRange(value: unknown, min: number, max: number) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "number" && Number.isInteger(value) && value >= min && value <= max)
  );
}

function isOptionalNullablePositiveNumber(value: unknown) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "number" && Number.isFinite(value) && value > 0)
  );
}

function isOptionalNullableProfileEnum<T extends string>(
  value: unknown,
  isValid: (nextValue: unknown) => nextValue is T
) {
  return value === undefined || value === null || isValid(value);
}

export function isProgressionSettings(value: unknown): value is ProgressionSettings {
  if (!isPlainRecord(value)) {
    return false;
  }

  return Object.values(value).every(
    (setting) =>
      setting === undefined ||
      (typeof setting === "number" && Number.isInteger(setting) && setting > 0)
  );
}

export function isStructuredPlanInput(value: unknown): value is StructuredPlanInput {
  if (!isPlainRecord(value)) {
    return false;
  }

  const input = value as Partial<StructuredPlanInput>;

  return (
    input.version === "structured-v1" &&
    typeof input.name === "string" &&
    typeof input.description === "string" &&
    (input.goalType === undefined ||
      input.goalType === null ||
      isTrainingGoalType(input.goalType)) &&
    (input.progressionMode === undefined ||
      input.progressionMode === null ||
      isProgressionMode(input.progressionMode)) &&
    (input.creationSource === undefined || isPlanCreationSource(input.creationSource)) &&
    Array.isArray(input.weeklySchedule) &&
    input.weeklySchedule.every(isWeekday) &&
    Array.isArray(input.phases) &&
    input.phases.length > 0 &&
    input.phases.every(
      (phase) =>
        isPlainRecord(phase) &&
        typeof phase.goal === "string" &&
        typeof phase.advancementPreset === "string" &&
        advancementPresets.includes(phase.advancementPreset) &&
        isProgressionSettings(phase.advancementSettings) &&
        typeof phase.deloadPreset === "string" &&
        deloadPresets.includes(phase.deloadPreset) &&
        isProgressionSettings(phase.deloadSettings) &&
        Array.isArray(phase.workouts) &&
        phase.workouts.length > 0 &&
        phase.workouts.every(
          (workout) =>
            isPlainRecord(workout) &&
            typeof workout.name === "string" &&
            typeof workout.focus === "string" &&
            typeof workout.summary === "string" &&
            Array.isArray(workout.scheduledDays) &&
            workout.scheduledDays.every(isWeekday) &&
            Array.isArray(workout.exercises) &&
            workout.exercises.length > 0 &&
            workout.exercises.every(
              (exercise) =>
                isPlainRecord(exercise) &&
                typeof exercise.name === "string" &&
                typeof exercise.sets === "number" &&
                Number.isInteger(exercise.sets) &&
                typeof exercise.reps === "string" &&
                typeof exercise.rest === "string" &&
                typeof exercise.coachingNote === "string" &&
                (exercise.videoUrl === undefined || typeof exercise.videoUrl === "string")
            )
        )
    )
  );
}

export function isStructuredPlanSaveInput(value: unknown): value is StructuredPlanSaveInput {
  if (!isPlainRecord(value)) {
    return false;
  }

  const input = value as Partial<StructuredPlanSaveInput>;

  return (
    isStructuredPlanInput(input.plan) &&
    (input.setupContext === undefined ||
      input.setupContext === null ||
      isPlanSetupInput(input.setupContext))
  );
}

export function isLegacyPlanFormInput(value: unknown): value is PlanFormInput {
  if (!isPlainRecord(value)) {
    return false;
  }

  const input = value as Partial<PlanFormInput>;

  return (
    typeof input.name === "string" &&
    typeof input.description === "string" &&
    typeof input.scheduleSummary === "string" &&
    typeof input.phaseGoal === "string" &&
    typeof input.advanceCriteria === "string" &&
    typeof input.deloadCriteria === "string" &&
    typeof input.workoutName === "string" &&
    typeof input.workoutFocus === "string" &&
    typeof input.workoutSummary === "string" &&
    Array.isArray(input.exercises)
  );
}

export function isPlanSetupInput(value: unknown): value is PlanSetupInput {
  if (!isPlainRecord(value)) {
    return false;
  }

  const input = value as Partial<PlanSetupInput>;

  return (
    isTrainingGoalType(input.goalType) &&
    isOptionalString(input.objectiveSummary) &&
    typeof input.daysPerWeek === "number" &&
    Number.isInteger(input.daysPerWeek) &&
    input.daysPerWeek >= 1 &&
    input.daysPerWeek <= 7 &&
    typeof input.sessionMinutes === "number" &&
    Number.isInteger(input.sessionMinutes) &&
    input.sessionMinutes >= 10 &&
    input.sessionMinutes <= 180 &&
    Array.isArray(input.weeklySchedule) &&
    input.weeklySchedule.every(isWeekday) &&
    isPlanPreferredSplit(input.preferredSplit) &&
    isStringArray(input.focusAreas) &&
    isStringArray(input.currentConstraints) &&
    (input.progressionModeOverride === undefined ||
      input.progressionModeOverride === null ||
      isProgressionMode(input.progressionModeOverride))
  );
}

export function isOnboardingInput(value: unknown): value is OnboardingInput {
  if (!isPlainRecord(value)) {
    return false;
  }

  const input = value as Partial<OnboardingInput>;

  return (
    typeof input.goal === "string" &&
    typeof input.goalNotes === "string" &&
    isOptionalNullableIntegerInRange(input.age, 13, 120) &&
    isOptionalNullablePositiveNumber(input.weight) &&
    isOptionalNullableProfileEnum(input.trainingExperience, isTrainingExperience) &&
    isOptionalNullableProfileEnum(input.activityLevel, isActivityLevel) &&
    isOptionalNullableProfileEnum(input.trainingEnvironment, isTrainingEnvironment) &&
    isOptionalString(input.limitationsDetail) &&
    isStringArray(input.injuries) &&
    isStringArray(input.equipment) &&
    (input.exercisePreferences === undefined || isStringArray(input.exercisePreferences)) &&
    (input.exerciseDislikes === undefined || isStringArray(input.exerciseDislikes)) &&
    (input.sportsInterests === undefined || isStringArray(input.sportsInterests)) &&
    typeof input.daysPerWeek === "number" &&
    Number.isInteger(input.daysPerWeek) &&
    input.daysPerWeek >= 1 &&
    input.daysPerWeek <= 7 &&
    typeof input.sessionMinutes === "number" &&
    Number.isInteger(input.sessionMinutes) &&
    input.sessionMinutes >= 10 &&
    input.sessionMinutes <= 180 &&
    Array.isArray(input.weeklySchedule) &&
    input.weeklySchedule.every(isWeekday) &&
    typeof input.planSetupChoice === "string" &&
    planSetupChoices.includes(input.planSetupChoice)
  );
}

export function isProfileSettingsInput(value: unknown): value is ProfileSettingsInput {
  if (!isPlainRecord(value)) {
    return false;
  }

  const input = value as Partial<ProfileSettingsInput>;
  const allowedKeys = new Set([
    "age",
    "weight",
    "trainingExperience",
    "activityLevel",
    "trainingEnvironment",
    "limitationsDetail",
    "injuries",
    "equipment",
    "exercisePreferences",
    "exerciseDislikes",
    "sportsInterests",
    "daysPerWeek",
    "sessionMinutes"
  ]);

  return (
    Object.keys(input).every((key) => allowedKeys.has(key)) &&
    isOptionalNullableIntegerInRange(input.age, 13, 120) &&
    isOptionalNullablePositiveNumber(input.weight) &&
    isOptionalNullableProfileEnum(input.trainingExperience, isTrainingExperience) &&
    isOptionalNullableProfileEnum(input.activityLevel, isActivityLevel) &&
    isOptionalNullableProfileEnum(input.trainingEnvironment, isTrainingEnvironment) &&
    isOptionalString(input.limitationsDetail) &&
    (input.injuries === undefined || isStringArray(input.injuries)) &&
    (input.equipment === undefined || isStringArray(input.equipment)) &&
    (input.exercisePreferences === undefined || isStringArray(input.exercisePreferences)) &&
    (input.exerciseDislikes === undefined || isStringArray(input.exerciseDislikes)) &&
    (input.sportsInterests === undefined || isStringArray(input.sportsInterests)) &&
    (input.daysPerWeek === undefined ||
      (typeof input.daysPerWeek === "number" &&
        Number.isInteger(input.daysPerWeek) &&
        input.daysPerWeek >= 1 &&
        input.daysPerWeek <= 7)) &&
    (input.sessionMinutes === undefined ||
      (typeof input.sessionMinutes === "number" &&
        Number.isInteger(input.sessionMinutes) &&
        input.sessionMinutes >= 10 &&
        input.sessionMinutes <= 180))
  );
}

export function isWorkoutSessionInput(value: unknown): value is WorkoutSessionInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const input = value as Partial<WorkoutSessionInput>;

  return (
    typeof input.workoutTemplateId === "string" &&
    typeof input.completedOn === "string" &&
    isValidCompletedOn(input.completedOn) &&
    typeof input.completed === "boolean" &&
    typeof input.painOccurred === "boolean" &&
    typeof input.perceivedDifficulty === "string" &&
    perceivedDifficultyValues.includes(input.perceivedDifficulty) &&
    typeof input.notes === "string" &&
    Array.isArray(input.completedExerciseIds) &&
    input.completedExerciseIds.every((id) => typeof id === "string")
  );
}
