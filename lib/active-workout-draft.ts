import type { RestTimerState } from "@/lib/rest-timer";
import type {
  WorkoutPlan,
  WorkoutSetInput,
  WorkoutTemplate,
} from "@/lib/types";

export const activeWorkoutDraftVersion = 1;
export const activeWorkoutDraftStoragePrefix =
  "workout-app:active-workout-draft:v1";
export const activeWorkoutDraftStaleDays = 7;
const staleMs = activeWorkoutDraftStaleDays * 24 * 60 * 60 * 1000;

export type ActiveWorkoutLifecycleState =
  | "idle"
  | "starting"
  | "active"
  | "finishing"
  | "save_failed"
  | "discarding";

export type ActiveWorkoutDraft = {
  version: typeof activeWorkoutDraftVersion;
  lifecycle: Exclude<
    ActiveWorkoutLifecycleState,
    "idle" | "starting" | "discarding"
  >;
  userId: string;
  draftId: string;
  workoutTemplateId: string;
  planId: string | null;
  phaseId: string | null;
  workoutNameSnapshot: string;
  startedAt: string;
  lastUpdatedAt: string;
  elapsedOffsetSeconds: number;
  checkedExerciseIds: string[];
  setResults: WorkoutSetInput[];
  exerciseNotes: Record<string, string>;
  restTimer?: RestTimerState | null;
  checkIn: {
    completedOn: string | null;
    completed: boolean;
    painOccurred: boolean;
    perceivedDifficulty: "too_easy" | "appropriate" | "too_hard";
    notes: string;
  };
};

export type DraftReadResult =
  | { status: "empty" }
  | {
      status: "valid";
      draft: ActiveWorkoutDraft;
      stale: boolean;
      ageDays: number;
    }
  | { status: "invalid"; reason: string; rawValue: string | null };

export function getActiveWorkoutDraftStorageKey(userId: string) {
  return `${activeWorkoutDraftStoragePrefix}:${userId}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

export function buildActiveWorkoutDraft(input: {
  userId: string;
  workout: WorkoutTemplate;
  plan: WorkoutPlan;
  now?: Date;
  draftId?: string;
}): ActiveWorkoutDraft {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();

  return {
    version: activeWorkoutDraftVersion,
    lifecycle: "active",
    userId: input.userId,
    draftId: input.draftId ?? crypto.randomUUID(),
    workoutTemplateId: input.workout.id,
    planId: input.plan.id,
    phaseId: input.workout.phaseId || input.plan.currentPhase.id || null,
    workoutNameSnapshot: input.workout.name,
    startedAt: timestamp,
    lastUpdatedAt: timestamp,
    elapsedOffsetSeconds: 0,
    checkedExerciseIds: [],
    setResults: [],
    exerciseNotes: {},
    restTimer: null,
    checkIn: {
      completedOn: null,
      completed: false,
      painOccurred: false,
      perceivedDifficulty: "appropriate",
      notes: "",
    },
  };
}

export function validateActiveWorkoutDraft(
  value: unknown,
  userId: string,
  options: { now?: Date } = {},
): DraftReadResult {
  if (!isRecord(value)) {
    return {
      status: "invalid",
      reason: "Draft data is not an object.",
      rawValue: null,
    };
  }

  if (value.version !== activeWorkoutDraftVersion) {
    return {
      status: "invalid",
      reason: "Draft version is no longer supported.",
      rawValue: null,
    };
  }

  const checkIn = value.checkIn;
  if (
    value.userId !== userId ||
    typeof value.draftId !== "string" ||
    typeof value.workoutTemplateId !== "string" ||
    (typeof value.planId !== "string" && value.planId !== null) ||
    (typeof value.phaseId !== "string" && value.phaseId !== null) ||
    typeof value.workoutNameSnapshot !== "string" ||
    !isIsoDate(value.startedAt) ||
    !isIsoDate(value.lastUpdatedAt) ||
    typeof value.elapsedOffsetSeconds !== "number" ||
    value.elapsedOffsetSeconds < 0 ||
    !Array.isArray(value.checkedExerciseIds) ||
    !value.checkedExerciseIds.every((id) => typeof id === "string") ||
    (value.setResults !== undefined && !Array.isArray(value.setResults)) ||
    (value.exerciseNotes !== undefined && !isRecord(value.exerciseNotes)) ||
    (value.restTimer !== undefined &&
      value.restTimer !== null &&
      !isRecord(value.restTimer)) ||
    !isRecord(checkIn) ||
    (checkIn.completedOn !== null && typeof checkIn.completedOn !== "string") ||
    typeof checkIn.completed !== "boolean" ||
    typeof checkIn.painOccurred !== "boolean" ||
    !["too_easy", "appropriate", "too_hard"].includes(
      String(checkIn.perceivedDifficulty),
    ) ||
    typeof checkIn.notes !== "string"
  ) {
    return {
      status: "invalid",
      reason: "Draft shape is invalid.",
      rawValue: null,
    };
  }

  const now = options.now ?? new Date();
  const ageMs = Math.max(0, now.getTime() - Date.parse(value.lastUpdatedAt));

  return {
    status: "valid",
    draft: {
      ...(value as ActiveWorkoutDraft),
      setResults: Array.isArray(value.setResults)
        ? (value.setResults as ActiveWorkoutDraft["setResults"])
        : [],
      exerciseNotes: isRecord(value.exerciseNotes)
        ? (value.exerciseNotes as Record<string, string>)
        : {},
      restTimer: isRecord(value.restTimer)
        ? (value.restTimer as RestTimerState)
        : null,
    },
    stale: ageMs > staleMs,
    ageDays: Math.floor(ageMs / (24 * 60 * 60 * 1000)),
  };
}

export function readActiveWorkoutDraft(
  storage: Storage,
  userId: string,
  options: { now?: Date } = {},
): DraftReadResult {
  const key = getActiveWorkoutDraftStorageKey(userId);
  let rawValue: string | null = null;

  try {
    rawValue = storage.getItem(key);
  } catch {
    return {
      status: "invalid",
      reason: "Workout recovery storage is unavailable.",
      rawValue: null,
    };
  }

  if (!rawValue) {
    return { status: "empty" };
  }

  try {
    return validateActiveWorkoutDraft(JSON.parse(rawValue), userId, options);
  } catch {
    return {
      status: "invalid",
      reason: "Workout recovery data is malformed.",
      rawValue,
    };
  }
}

export function writeActiveWorkoutDraft(
  storage: Storage,
  draft: ActiveWorkoutDraft,
) {
  const nextDraft = { ...draft, lastUpdatedAt: new Date().toISOString() };
  storage.setItem(
    getActiveWorkoutDraftStorageKey(draft.userId),
    JSON.stringify(nextDraft),
  );
  return nextDraft;
}

export function getElapsedSeconds(
  draft: ActiveWorkoutDraft,
  now: Date = new Date(),
) {
  return Math.max(
    0,
    draft.elapsedOffsetSeconds +
      Math.floor((now.getTime() - Date.parse(draft.startedAt)) / 1000),
  );
}
