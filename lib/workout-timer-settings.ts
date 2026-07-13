import { restTimerDefaultSeconds, restTimerMaxSeconds, normalizeRestSeconds, parseRestDurationSeconds } from "@/lib/rest-timer";

export const timerCompleteSoundDefault = true;
export const restDurationOptionsSeconds = [30, 45, 60, 75, 90, 120, 150, 180, 240, 300];

export type WorkoutTimerSettings = {
  autoStartRest?: boolean;
  timerSoundEnabled?: boolean;
  defaultRestSeconds?: number | null;
};

export function getEffectiveTimerSound(value: boolean | undefined) {
  return value ?? timerCompleteSoundDefault;
}

export function getEffectiveDefaultRestSeconds(value: number | null | undefined) {
  return normalizeRestSeconds(value ?? restTimerDefaultSeconds);
}

export function resolveRestDurationSeconds(input: {
  workoutOverrideSeconds?: number | null;
  exerciseRest?: string | null;
  globalDefaultSeconds?: number | null;
  fallbackSeconds?: number;
}) {
  return normalizeRestSeconds(
    input.workoutOverrideSeconds ??
      parseRestDurationSeconds(input.exerciseRest) ??
      input.globalDefaultSeconds ??
      input.fallbackSeconds ??
      restTimerDefaultSeconds,
  );
}

export function formatRestDurationLabel(seconds: number | null | undefined) {
  const safe = getEffectiveDefaultRestSeconds(seconds);
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export function isValidRestPreferenceSeconds(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0 && value <= restTimerMaxSeconds;
}
