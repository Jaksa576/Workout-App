import type {
  ActivityLevel,
  ProfileSettingsInput,
  TrainingEnvironment,
  TrainingExperience
} from "@/lib/types";

export type ProfileUpdateValues = Partial<{
  age: number | null;
  weight: number | null;
  training_experience: TrainingExperience | null;
  activity_level: ActivityLevel | null;
  training_environment: TrainingEnvironment | null;
  limitations_detail: string | null;
  injuries: string[];
  equipment: string[];
  exercise_preferences: string[];
  exercise_dislikes: string[];
  sports_interests: string[];
  days_per_week: number;
  session_minutes: number;
}>;

function cleanStringList(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean);
}

function cleanNullableString(value: string | undefined) {
  const trimmedValue = value?.trim();
  return trimmedValue || null;
}

export function buildProfileUpdateValues(input: ProfileSettingsInput): ProfileUpdateValues {
  const values: ProfileUpdateValues = {};

  if ("age" in input && input.age !== undefined) {
    values.age = input.age ?? null;
  }

  if ("weight" in input && input.weight !== undefined) {
    values.weight = input.weight ?? null;
  }

  if ("trainingExperience" in input && input.trainingExperience !== undefined) {
    values.training_experience = input.trainingExperience ?? null;
  }

  if ("activityLevel" in input && input.activityLevel !== undefined) {
    values.activity_level = input.activityLevel ?? null;
  }

  if ("trainingEnvironment" in input && input.trainingEnvironment !== undefined) {
    values.training_environment = input.trainingEnvironment ?? null;
  }

  if ("limitationsDetail" in input && input.limitationsDetail !== undefined) {
    values.limitations_detail = cleanNullableString(input.limitationsDetail);
  }

  if ("injuries" in input && input.injuries) {
    values.injuries = cleanStringList(input.injuries);
  }

  if ("equipment" in input && input.equipment) {
    values.equipment = cleanStringList(input.equipment);
  }

  if ("exercisePreferences" in input && input.exercisePreferences) {
    values.exercise_preferences = cleanStringList(input.exercisePreferences);
  }

  if ("exerciseDislikes" in input && input.exerciseDislikes) {
    values.exercise_dislikes = cleanStringList(input.exerciseDislikes);
  }

  if ("sportsInterests" in input && input.sportsInterests) {
    values.sports_interests = cleanStringList(input.sportsInterests);
  }

  if ("daysPerWeek" in input && input.daysPerWeek !== undefined) {
    values.days_per_week = input.daysPerWeek;
  }

  if ("sessionMinutes" in input && input.sessionMinutes !== undefined) {
    values.session_minutes = input.sessionMinutes;
  }

  return values;
}
