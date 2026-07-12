export const restTimerDefaultSeconds = 90;
export const restTimerMaxSeconds = 30 * 60;

export type RestTimerStatus = "idle" | "running" | "paused" | "expired";

export type RestTimerState = {
  status: RestTimerStatus;
  durationSeconds: number;
  remainingSeconds: number;
  startedAt: string | null;
  endsAt: string | null;
  pausedAt: string | null;
  exerciseEntryId: string | null;
  exerciseName: string | null;
  autoStarted: boolean;
  lastCompletedSetId: string | null;
};

export const idleRestTimerState: RestTimerState = {
  status: "idle",
  durationSeconds: restTimerDefaultSeconds,
  remainingSeconds: restTimerDefaultSeconds,
  startedAt: null,
  endsAt: null,
  pausedAt: null,
  exerciseEntryId: null,
  exerciseName: null,
  autoStarted: false,
  lastCompletedSetId: null,
};

export function normalizeRestSeconds(value: number | null | undefined) {
  if (!Number.isFinite(value) || value == null || value <= 0) {
    return restTimerDefaultSeconds;
  }
  return Math.min(restTimerMaxSeconds, Math.max(1, Math.round(value)));
}

export function parseRestDurationSeconds(rest: string | null | undefined) {
  const text = rest?.trim().toLowerCase();
  if (!text || text === "as needed") return null;
  const range = text.match(
    /(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(sec|secs|second|seconds|min|mins|minute|minutes)?/,
  );
  if (range) {
    const unit = range[3] ?? (text.includes("min") ? "min" : "sec");
    const value = Number(range[2]);
    return Math.round(value * (unit.startsWith("min") ? 60 : 1));
  }
  const match = text.match(
    /(\d+(?:\.\d+)?)\s*(sec|secs|second|seconds|min|mins|minute|minutes)?/,
  );
  if (!match) return null;
  const value = Number(match[1]);
  const unit = match[2] ?? (text.includes("min") ? "min" : "sec");
  return Math.round(value * (unit.startsWith("min") ? 60 : 1));
}

export function getRestDurationSeconds(input: {
  sessionOverrideSeconds?: number | null;
  exerciseRest: string | null | undefined;
  userDefaultSeconds?: number | null;
  fallbackSeconds?: number;
}) {
  return normalizeRestSeconds(
    input.sessionOverrideSeconds ??
      parseRestDurationSeconds(input.exerciseRest) ??
      input.userDefaultSeconds ??
      input.fallbackSeconds ??
      restTimerDefaultSeconds,
  );
}

export function startRestTimer(input: {
  durationSeconds: number;
  now?: Date;
  exerciseEntryId?: string | null;
  exerciseName?: string | null;
  autoStarted?: boolean;
  setId?: string | null;
}): RestTimerState {
  const now = input.now ?? new Date();
  const durationSeconds = normalizeRestSeconds(input.durationSeconds);
  return {
    status: "running",
    durationSeconds,
    remainingSeconds: durationSeconds,
    startedAt: now.toISOString(),
    endsAt: new Date(now.getTime() + durationSeconds * 1000).toISOString(),
    pausedAt: null,
    exerciseEntryId: input.exerciseEntryId ?? null,
    exerciseName: input.exerciseName ?? null,
    autoStarted: Boolean(input.autoStarted),
    lastCompletedSetId: input.setId ?? null,
  };
}

export function deriveRestTimerState(
  timer: RestTimerState | null | undefined,
  now: Date = new Date(),
): RestTimerState {
  if (!timer || timer.status === "idle") return idleRestTimerState;
  if (timer.status === "paused" || timer.status === "expired") return timer;
  if (!timer.endsAt) return idleRestTimerState;
  const remainingSeconds = Math.ceil(
    (Date.parse(timer.endsAt) - now.getTime()) / 1000,
  );
  if (remainingSeconds <= 0)
    return { ...timer, status: "expired", remainingSeconds: 0 };
  return { ...timer, status: "running", remainingSeconds };
}

export function pauseRestTimer(timer: RestTimerState, now: Date = new Date()) {
  const current = deriveRestTimerState(timer, now);
  if (current.status !== "running") return current;
  return {
    ...current,
    status: "paused" as const,
    pausedAt: now.toISOString(),
    endsAt: null,
  };
}

export function resumeRestTimer(timer: RestTimerState, now: Date = new Date()) {
  if (timer.status !== "paused") return deriveRestTimerState(timer, now);
  const remainingSeconds = normalizeRestSeconds(timer.remainingSeconds);
  return {
    ...timer,
    status: "running" as const,
    remainingSeconds,
    startedAt: now.toISOString(),
    endsAt: new Date(now.getTime() + remainingSeconds * 1000).toISOString(),
    pausedAt: null,
  };
}

export function addRestTime(
  timer: RestTimerState,
  addSeconds: number,
  now: Date = new Date(),
) {
  const current = deriveRestTimerState(timer, now);
  const remainingSeconds = Math.min(
    restTimerMaxSeconds,
    Math.max(0, current.remainingSeconds) + Math.max(1, Math.round(addSeconds)),
  );
  if (current.status === "running") {
    return {
      ...current,
      remainingSeconds,
      durationSeconds: Math.max(current.durationSeconds, remainingSeconds),
      endsAt: new Date(now.getTime() + remainingSeconds * 1000).toISOString(),
    };
  }
  return {
    ...current,
    status: current.status === "idle" ? ("paused" as const) : current.status,
    remainingSeconds,
    durationSeconds: Math.max(current.durationSeconds, remainingSeconds),
  };
}

export function formatRestTimer(seconds: number) {
  const safe = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}
