import type {
  AdvancementPreset,
  DeloadPreset,
  OnboardingInput,
  PlanFormInput,
  ProgressionSettings,
  StructuredPlanInput,
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

export const planSetupChoices = ["manual", "guided", "ai"] as const;

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

export function normalizeWeekdays(values: unknown) {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(new Set(values.filter(isWeekday)));
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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

export function isOnboardingInput(value: unknown): value is OnboardingInput {
  if (!isPlainRecord(value)) {
    return false;
  }

  const input = value as Partial<OnboardingInput>;

  return (
    typeof input.goal === "string" &&
    typeof input.goalNotes === "string" &&
    Array.isArray(input.injuries) &&
    input.injuries.every((injury) => typeof injury === "string") &&
    Array.isArray(input.equipment) &&
    input.equipment.every((item) => typeof item === "string") &&
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
