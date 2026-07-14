"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { shouldPersistActiveWorkoutDraft } from "@/lib/active-workout-lifecycle";
import { activeWorkoutAutoStartRestDefault } from "@/lib/active-workout-rest";
import {
  canFinishActiveWorkout,
  getDiscardRedirectPath,
  getRecoveredDraftStep,
  shouldShowActiveStartCard,
} from "@/lib/active-workout-shell";
import { WorkoutChecklist } from "@/components/workout-checklist";
import {
  calculateSetProgress,
  formatDurationInput,
  migrateLegacyCompletionRows,
} from "@/lib/set-logging";
import {
  addRestTime,
  deriveRestTimerState,
  formatRestTimer,
  idleRestTimerState,
  shouldEmitRestTimerCompletionFeedback,
  pauseRestTimer,
  resumeRestTimer,
  startRestTimer,
  type RestTimerState,
} from "@/lib/rest-timer";
import {
  formatRestDurationLabel,
  getEffectiveTimerSound,
  resolveRestDurationSeconds,
  restDurationOptionsSeconds,
} from "@/lib/workout-timer-settings";
import {
  buildActiveWorkoutDraft,
  getActiveWorkoutDraftStorageKey,
  getElapsedSeconds,
  readActiveWorkoutDraft,
  writeActiveWorkoutDraft,
  type ActiveWorkoutDraft,
} from "@/lib/active-workout-draft";
import { generateRecommendation } from "@/lib/recommendation";
import { formatExercisePrescription } from "@/lib/exercise-prescription";
import { detectBrowserTimeZone } from "@/lib/time-zone";
import { orderWorkoutsForUpcomingSchedule } from "@/lib/workout-schedule";
import { getTodayDateString } from "@/lib/validation";
import type {
  SavedWorkoutSession,
  PhaseProgressSummary,
  WorkoutPlan,
  WorkoutProgressSummary,
  WorkoutSession,
  WorkoutSetInput,
  WorkoutTemplate,
} from "@/lib/types";

const effortOptions = ["Too easy", "Appropriate", "Too hard"] as const;

type FlowStep = "idle" | "workout" | "check-in" | "saved";

type WorkoutFlowProps = {
  mode?: "selection" | "active";
  workouts: WorkoutTemplate[];
  activePlan: WorkoutPlan;
  recommendedWorkout: WorkoutTemplate | null;
  selectedWorkout: WorkoutTemplate;
  initialStep: "workout" | "check-in";
  recentSessions: WorkoutSession[];
  progressSummary: WorkoutProgressSummary;
  phaseProgress: PhaseProgressSummary | null;
  userId: string | null;
  defaultRestSeconds: number;
  timeZone?: string;
};

type SessionSaveResult = {
  session?: SavedWorkoutSession;
  error?: string;
};

function toDifficultyValue(effort: (typeof effortOptions)[number]) {
  if (effort === "Too easy") {
    return "too_easy";
  }

  if (effort === "Too hard") {
    return "too_hard";
  }

  return "appropriate";
}

function formatDisplayDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function getClientTodayDateString() {
  if (typeof window === "undefined") {
    return getTodayDateString();
  }

  return getTodayDateString(detectBrowserTimeZone() ?? undefined);
}

function getSessionNotes(session: WorkoutSession | SavedWorkoutSession) {
  return session.notes.trim();
}

function sortSessionsByLatest<T extends WorkoutSession>(sessions: T[]) {
  return [...sessions].sort((a, b) => {
    const dateComparison = b.completedOn.localeCompare(a.completedOn);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    return b.createdAt.localeCompare(a.createdAt);
  });
}

function mergeSessions(
  currentSessions: WorkoutSession[],
  nextSessions: WorkoutSession[],
) {
  const sessionsById = new Map<string, WorkoutSession>();

  for (const session of [...currentSessions, ...nextSessions]) {
    sessionsById.set(session.id, session);
  }

  return sortSessionsByLatest(Array.from(sessionsById.values()));
}

type TimerAudioContext = AudioContext & {
  close: () => Promise<void>;
  resume: () => Promise<void>;
};

function getAudioContextCtor() {
  if (typeof window === "undefined") return null;
  return (
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext ||
    null
  );
}

function useTimerCompletionAudio() {
  const contextRef = useRef<TimerAudioContext | null>(null);

  const unlockAudio = () => {
    try {
      const AudioContextCtor = getAudioContextCtor();
      if (!AudioContextCtor) return;
      const context = contextRef.current ?? new AudioContextCtor();
      contextRef.current = context as TimerAudioContext;
      if (context.state === "suspended") {
        void context.resume().catch(() => undefined);
      }
    } catch {
      // Web Audio may be unavailable or blocked; rest timing still works.
    }
  };

  const playCompletionCue = () => {
    try {
      const context = contextRef.current;
      if (!context) return;
      if (context.state === "suspended") {
        void context.resume().catch(() => undefined);
        return;
      }
      if (context.state !== "running") return;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.15, context.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        context.currentTime + 0.28,
      );
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.3);
    } catch {
      // Completion feedback degrades silently when audio playback is unavailable.
    }
  };

  const closeAudio = () => {
    const context = contextRef.current;
    contextRef.current = null;
    if (context && context.state !== "closed") {
      void context.close().catch(() => undefined);
    }
  };

  useEffect(() => closeAudio, []);

  return { unlockAudio, playCompletionCue, closeAudio };
}

function vibrateRestComplete() {
  try {
    window.navigator.vibrate?.(120);
  } catch {
    // Unsupported vibration APIs must not affect timer completion.
  }
}

function WorkoutSettingsDialog({
  autoStartRest,
  timerSoundEnabled,
  workoutRestOverrideEnabled,
  workoutDefaultRestSeconds,
  globalDefaultRestSeconds,
  onAutoStartChange,
  onSoundChange,
  onOverrideEnabledChange,
  onDefaultRestChange,
  onReset,
  onClose,
}: {
  autoStartRest: boolean;
  timerSoundEnabled: boolean;
  workoutRestOverrideEnabled: boolean;
  workoutDefaultRestSeconds: number;
  globalDefaultRestSeconds: number;
  onAutoStartChange: (value: boolean) => void;
  onSoundChange: (value: boolean) => void;
  onOverrideEnabledChange: (value: boolean) => void;
  onDefaultRestChange: (value: number) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function onDialogKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    ).filter((element) => element.offsetParent !== null);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-ink/30 p-3 sm:items-center sm:justify-center"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-[28px] border border-border bg-surface p-5 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="workout-settings-title"
        onKeyDown={onDialogKeyDown}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="ui-eyebrow">Workout settings</p>
            <h2
              id="workout-settings-title"
              className="mt-2 text-xl font-black text-copy"
            >
              Timer preferences
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="ui-button-ghost min-h-11 px-3 py-2"
            onClick={onClose}
            aria-label="Close workout settings"
          >
            ×
          </button>
        </div>
        <div className="mt-5 space-y-4">
          <label className="flex min-h-11 items-center justify-between gap-4 text-sm font-semibold text-copy">
            <span>Auto-start rest timer</span>
            <input
              type="checkbox"
              className="h-5 w-5 accent-[rgb(var(--color-primary))]"
              checked={autoStartRest}
              onChange={(event) => onAutoStartChange(event.target.checked)}
            />
          </label>
          <label className="flex min-h-11 items-center justify-between gap-4 text-sm font-semibold text-copy">
            <span>Timer-complete sound</span>
            <input
              type="checkbox"
              className="h-5 w-5 accent-[rgb(var(--color-primary))]"
              checked={timerSoundEnabled}
              onChange={(event) => onSoundChange(event.target.checked)}
            />
          </label>
          <div className="space-y-3">
            <label className="flex min-h-11 items-center justify-between gap-4 text-sm font-semibold text-copy">
              <span>Override rest for this workout</span>
              <input
                type="checkbox"
                className="h-5 w-5 accent-[rgb(var(--color-primary))]"
                checked={workoutRestOverrideEnabled}
                onChange={(event) =>
                  onOverrideEnabledChange(event.target.checked)
                }
              />
            </label>
            {workoutRestOverrideEnabled ? (
              <label className="block text-sm font-semibold text-copy">
                <span>Rest duration</span>
                <select
                  className="ui-input mt-2"
                  value={workoutDefaultRestSeconds}
                  onChange={(event) =>
                    onDefaultRestChange(Number(event.target.value))
                  }
                >
                  {restDurationOptionsSeconds.map((seconds) => (
                    <option key={seconds} value={seconds}>
                      {formatRestDurationLabel(seconds)}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-xs font-medium leading-5 text-muted">
                  Uses this rest duration for every exercise in this workout.
                </span>
              </label>
            ) : (
              <p className="text-xs font-medium leading-5 text-muted">
                Uses exercise rest, then your global default (
                {formatRestDurationLabel(globalDefaultRestSeconds)}).
              </p>
            )}
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            className="ui-button-ghost min-h-11"
            onClick={onReset}
          >
            Reset to defaults
          </button>
          <button
            type="button"
            className="ui-button-primary min-h-11"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function RestTimerDock({
  timer,
  onPause,
  onResume,
  onAdd,
  onCancel,
}: {
  timer: RestTimerState;
  onPause: () => void;
  onResume: () => void;
  onAdd: () => void;
  onCancel: () => void;
}) {
  if (timer.status === "idle") return null;

  const stateLabel =
    timer.status === "expired"
      ? "Rest complete"
      : timer.status === "paused"
        ? "Rest paused"
        : "Resting";
  const timeLabel =
    timer.status === "expired"
      ? "0:00"
      : formatRestTimer(timer.remainingSeconds);

  return (
    <section
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-3xl rounded-[28px] border border-primary/25 bg-surface/95 p-4 shadow-2xl backdrop-blur sm:bottom-[max(1rem,env(safe-area-inset-bottom))]"
      aria-label="Rest timer controls"
      aria-live={timer.status === "expired" ? "polite" : "off"}
      aria-atomic="true"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">
            {stateLabel}
          </p>
          <p className="mt-1 text-5xl font-black tabular-nums leading-none text-copy sm:text-6xl">
            {timeLabel}
          </p>
          {timer.exerciseName ? (
            <p className="mt-2 truncate text-sm font-semibold text-muted">
              {timer.exerciseName}
            </p>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          {timer.status === "paused" ? (
            <button
              type="button"
              className="ui-button-secondary min-h-12 px-4 py-3"
              onClick={onResume}
              aria-label="Resume rest timer"
            >
              Resume
            </button>
          ) : timer.status === "expired" ? (
            <button
              type="button"
              className="ui-button-secondary col-span-2 min-h-12 px-4 py-3"
              onClick={onCancel}
              aria-label="Dismiss completed rest timer"
            >
              Dismiss
            </button>
          ) : (
            <button
              type="button"
              className="ui-button-ghost min-h-12 px-4 py-3"
              onClick={onPause}
              aria-label="Pause rest timer"
            >
              Pause
            </button>
          )}
          {timer.status !== "expired" ? (
            <>
              <button
                type="button"
                className="ui-button-secondary min-h-12 px-4 py-3"
                onClick={onAdd}
                aria-label="Add 15 seconds to rest timer"
              >
                +15 sec
              </button>
              <button
                type="button"
                className="ui-button-primary col-span-2 min-h-12 px-4 py-3 sm:col-span-1"
                onClick={onCancel}
                aria-label="Skip rest timer"
              >
                Skip
              </button>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function formatWorkoutMetricNumber(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function formatRecapDuration(seconds: number) {
  return formatDurationInput(seconds) || "0:00";
}

function getCompletedSetRows(
  exerciseId: string,
  setResults: WorkoutSetInput[],
) {
  return setResults.filter(
    (row) => row.exerciseEntryId === exerciseId && row.status === "completed",
  );
}

function getSetScalar(
  row: WorkoutSetInput,
  scalar: "load" | "reps" | "duration" | "distance",
) {
  const direct =
    scalar === "load"
      ? row.actualLoad
      : scalar === "reps"
        ? row.actualReps
        : scalar === "duration"
          ? row.actualDurationSeconds
          : row.actualDistance;
  if (direct != null) return direct;

  const left =
    scalar === "load"
      ? row.actualLeftLoad
      : scalar === "reps"
        ? row.actualLeftReps
        : scalar === "duration"
          ? row.actualLeftDurationSeconds
          : row.actualLeftDistance;
  const right =
    scalar === "load"
      ? row.actualRightLoad
      : scalar === "reps"
        ? row.actualRightReps
        : scalar === "duration"
          ? row.actualRightDurationSeconds
          : row.actualRightDistance;

  if (left != null && right != null) return left + right;
  return left ?? right ?? null;
}

function getRecapVolumeMultiplier(unilateralMode = "bilateral") {
  return unilateralMode === "same_each_side" ? 2 : 1;
}

export function getSetLoadVolume(
  row: WorkoutSetInput,
  unilateralMode = "bilateral",
) {
  if (unilateralMode === "independent_sides") {
    const leftVolume =
      row.actualLeftLoad != null && row.actualLeftReps != null
        ? row.actualLeftLoad * row.actualLeftReps
        : 0;
    const rightVolume =
      row.actualRightLoad != null && row.actualRightReps != null
        ? row.actualRightLoad * row.actualRightReps
        : 0;
    return leftVolume + rightVolume;
  }

  const load = getSetScalar(row, "load");
  const rowReps = getSetScalar(row, "reps");
  return load != null && rowReps != null
    ? load * rowReps * getRecapVolumeMultiplier(unilateralMode)
    : 0;
}

export function buildWorkoutRecap(
  workout: WorkoutTemplate,
  setResults: WorkoutSetInput[],
  checkedExerciseIds: string[],
  elapsedSeconds: number,
) {
  const progress = calculateSetProgress({
    exercises: workout.exercises,
    setResults,
    checkedExerciseIds,
  });
  const completedExercises = workout.exercises.filter((exercise) => {
    const rows = setResults.filter(
      (row) => row.exerciseEntryId === exercise.id,
    );
    return (
      rows.some((row) => row.status === "completed") ||
      checkedExerciseIds.includes(exercise.id)
    );
  });
  let volume = 0;
  let reps = 0;
  let duration = 0;
  let distance = 0;

  const exerciseSummaries = workout.exercises.map((exercise) => {
    const rows = getCompletedSetRows(exercise.id, setResults);
    for (const row of rows) {
      const rowReps = getSetScalar(row, "reps");
      const rowDuration = getSetScalar(row, "duration");
      const rowDistance = getSetScalar(row, "distance");
      volume += getSetLoadVolume(row, exercise.unilateralMode);
      if (rowReps != null)
        reps += rowReps * getRecapVolumeMultiplier(exercise.unilateralMode);
      if (rowDuration != null)
        duration +=
          rowDuration * getRecapVolumeMultiplier(exercise.unilateralMode);
      if (rowDistance != null)
        distance +=
          rowDistance * getRecapVolumeMultiplier(exercise.unilateralMode);
    }

    const completed = rows.length;
    const total =
      exercise.sets +
      setResults.filter(
        (row) => row.exerciseEntryId === exercise.id && row.setKind === "added",
      ).length;
    const side = exercise.unilateralMode === "same_each_side" ? "/side" : "";
    const parts = [`${completed}/${total} sets`];
    if (exercise.trackingType === "weight_reps") {
      const exerciseVolume = rows.reduce(
        (sum, row) => sum + getSetLoadVolume(row, exercise.unilateralMode),
        0,
      );
      const best = rows.reduce<string | null>((current, row) => {
        const load = getSetScalar(row, "load");
        const rowReps = getSetScalar(row, "reps");
        return load != null &&
          rowReps != null &&
          (!current || load > Number(current.split(" ")[0]))
          ? `${formatWorkoutMetricNumber(load)} × ${formatWorkoutMetricNumber(rowReps)}${side}`
          : current;
      }, null);
      if (exerciseVolume > 0)
        parts.push(
          `${formatWorkoutMetricNumber(exerciseVolume)} ${exercise.loadUnit ?? "lb"} volume`,
        );
      if (best) parts.push(`Best ${best}`);
    } else if (exercise.trackingType === "duration") {
      const exerciseDuration = rows.reduce(
        (sum, row) =>
          sum +
          (getSetScalar(row, "duration") ?? 0) *
            getRecapVolumeMultiplier(exercise.unilateralMode),
        0,
      );
      if (exerciseDuration > 0)
        parts.push(`${formatRecapDuration(exerciseDuration)} total`);
    } else if (
      exercise.trackingType === "distance" ||
      exercise.trackingType === "distance_duration"
    ) {
      const exerciseDistance = rows.reduce(
        (sum, row) =>
          sum +
          (getSetScalar(row, "distance") ?? 0) *
            getRecapVolumeMultiplier(exercise.unilateralMode),
        0,
      );
      if (exerciseDistance > 0)
        parts.push(
          `${formatWorkoutMetricNumber(exerciseDistance)} ${exercise.distanceUnit ?? "mi"}`,
        );
    } else if (exercise.trackingType === "reps_only") {
      const perSideReps = rows.reduce(
        (sum, row) => sum + (getSetScalar(row, "reps") ?? 0),
        0,
      );
      const exerciseReps =
        perSideReps * getRecapVolumeMultiplier(exercise.unilateralMode);
      if (exerciseReps > 0) {
        parts.push(
          exercise.unilateralMode === "same_each_side"
            ? `${formatWorkoutMetricNumber(perSideReps)} reps${side}`
            : `${formatWorkoutMetricNumber(exerciseReps)} reps`,
        );
      }
    }
    return { id: exercise.id, name: exercise.name, detail: parts.join(" · ") };
  });

  const workload =
    volume > 0
      ? {
          label: "Load volume",
          value: `${formatWorkoutMetricNumber(volume)} ${workout.exercises.find((exercise) => exercise.trackingType === "weight_reps")?.loadUnit ?? "lb"}`,
        }
      : distance > 0
        ? {
            label: "Distance",
            value: `${formatWorkoutMetricNumber(distance)} ${workout.exercises.find((exercise) => exercise.trackingType === "distance" || exercise.trackingType === "distance_duration")?.distanceUnit ?? "mi"}`,
          }
        : duration > 0
          ? { label: "Work duration", value: formatRecapDuration(duration) }
          : reps > 0
            ? { label: "Total reps", value: formatWorkoutMetricNumber(reps) }
            : null;

  const metrics = [
    { label: "Elapsed", value: formatElapsed(elapsedSeconds) },
    { label: "Sets", value: `${progress.completed}/${progress.total}` },
    {
      label: "Exercises logged",
      value: `${completedExercises.length}/${workout.exercises.length}`,
    },
    workload ?? {
      label: progress.completed === progress.total ? "Status" : "Status",
      value: progress.completed === progress.total ? "Completed" : "Partial",
    },
  ];

  return {
    metrics,
    exerciseSummaries,
  };
}

export function WorkoutFlow({
  mode = "selection",
  workouts,
  activePlan,
  recommendedWorkout,
  selectedWorkout,
  initialStep,
  recentSessions,
  progressSummary,
  phaseProgress,
  userId,
  defaultRestSeconds,
  timeZone,
}: WorkoutFlowProps) {
  const router = useRouter();
  const isActiveMode = mode === "active";
  const [isPending, startTransition] = useTransition();
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(
    selectedWorkout.id,
  );
  const [step, setStep] = useState<FlowStep>(
    isActiveMode && initialStep === "check-in" ? "check-in" : "idle",
  );
  const [activeDraft, setActiveDraft] = useState<ActiveWorkoutDraft | null>(
    null,
  );
  const [invalidRecoveryKey, setInvalidRecoveryKey] = useState<string | null>(
    null,
  );
  const [awaitingStaleRecoveryDecision, setAwaitingStaleRecoveryDecision] =
    useState(false);
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [checkedExerciseIds, setCheckedExerciseIds] = useState<string[]>([]);
  const [setResults, setSetResults] = useState<WorkoutSetInput[]>([]);
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>(
    {},
  );
  const [restTimer, setRestTimer] = useState<RestTimerState | null>(null);
  const [liveRestTimer, setLiveRestTimer] =
    useState<RestTimerState>(idleRestTimerState);
  const [autoStartRest, setAutoStartRest] = useState(
    activeWorkoutAutoStartRestDefault,
  );
  const [timerSoundEnabled, setTimerSoundEnabled] = useState(true);
  const [workoutRestOverrideEnabled, setWorkoutRestOverrideEnabled] =
    useState(false);
  const [workoutDefaultRestSeconds, setWorkoutDefaultRestSeconds] =
    useState(90);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const workoutCardRefs = useRef<Record<string, HTMLElement | null>>({});
  const completedFeedbackEvents = useRef(new Set<string>());
  const { unlockAudio, playCompletionCue, closeAudio } =
    useTimerCompletionAudio();
  const [currentRestExerciseId, setCurrentRestExerciseId] = useState<
    string | null
  >(null);
  const [completed, setCompleted] = useState(true);
  const [pain, setPain] = useState(false);
  const [effort, setEffort] =
    useState<(typeof effortOptions)[number]>("Appropriate");
  const [notes, setNotes] = useState("");
  const [todayDate, setTodayDate] = useState(getClientTodayDateString);
  const [completedOn, setCompletedOn] = useState(getClientTodayDateString);
  const [savedSession, setSavedSession] = useState<SavedWorkoutSession | null>(
    null,
  );
  const [sessionHistory, setSessionHistory] = useState(() =>
    sortSessionsByLatest(recentSessions),
  );
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [finishElapsedSnapshot, setFinishElapsedSnapshot] = useState<
    number | null
  >(null);

  useEffect(() => {
    setSessionHistory((currentSessions) =>
      mergeSessions(currentSessions, recentSessions),
    );
  }, [recentSessions]);

  useEffect(() => {
    const nextTodayDate = getClientTodayDateString();

    setTodayDate(nextTodayDate);
    setCompletedOn((currentDate) =>
      currentDate > nextTodayDate ? nextTodayDate : currentDate,
    );
  }, []);

  const workout = useMemo(
    () =>
      workouts.find((item) => item.id === selectedWorkoutId) ?? selectedWorkout,
    [selectedWorkout, selectedWorkoutId, workouts],
  );
  const recommendation = generateRecommendation({ completed, pain, effort });
  useEffect(() => {
    if (!userId) {
      return;
    }

    const result = readActiveWorkoutDraft(window.localStorage, userId);

    if (result.status === "valid") {
      const recoveredWorkout = workouts.find(
        (item) => item.id === result.draft.workoutTemplateId,
      );
      if (!recoveredWorkout) {
        setDraftMessage(
          `Recovered draft for ${result.draft.workoutNameSnapshot} cannot find its workout. Discard it to start again.`,
        );
        setActiveDraft(result.draft);
        setAwaitingStaleRecoveryDecision(false);
        setStep("idle");
        return;
      }

      setInvalidRecoveryKey(null);
      setAwaitingStaleRecoveryDecision(result.stale);
      setActiveDraft(result.draft);
      setSelectedWorkoutId(result.draft.workoutTemplateId);
      const migratedDraftRows = migrateLegacyCompletionRows({
        exercises: recoveredWorkout.exercises,
        setResults: result.draft.setResults,
        checkedExerciseIds: result.draft.checkedExerciseIds,
      });
      setCheckedExerciseIds(migratedDraftRows.checkedExerciseIds);
      setSetResults(migratedDraftRows.setResults);
      setExerciseNotes(result.draft.exerciseNotes);
      setRestTimer(deriveRestTimerState(result.draft.restTimer));
      setAutoStartRest(
        result.draft.autoStartRest ?? activeWorkoutAutoStartRestDefault,
      );
      setTimerSoundEnabled(result.draft.timerSoundEnabled ?? true);
      setWorkoutRestOverrideEnabled(
        result.draft.workoutRestOverrideEnabled ?? false,
      );
      setWorkoutDefaultRestSeconds(
        result.draft.workoutDefaultRestSeconds ?? 90,
      );
      setCurrentRestExerciseId(result.draft.restTimer?.exerciseEntryId ?? null);
      setCompleted(result.draft.checkIn.completed);
      setPain(result.draft.checkIn.painOccurred);
      setEffort(
        result.draft.checkIn.perceivedDifficulty === "too_easy"
          ? "Too easy"
          : result.draft.checkIn.perceivedDifficulty === "too_hard"
            ? "Too hard"
            : "Appropriate",
      );
      setNotes(result.draft.checkIn.notes);
      if (result.draft.checkIn.completedOn) {
        setCompletedOn(result.draft.checkIn.completedOn);
      }
      setDraftMessage(
        result.stale
          ? `Stale workout draft for ${result.draft.workoutNameSnapshot}; last updated ${result.ageDays} days ago.`
          : `Recovered workout draft for ${result.draft.workoutNameSnapshot}.`,
      );
      setStep(
        getRecoveredDraftStep({
          mode,
          stale: result.stale,
          lifecycle: result.draft.lifecycle,
        }),
      );
      return;
    }

    if (result.status === "invalid") {
      setAwaitingStaleRecoveryDecision(false);
      setInvalidRecoveryKey(getActiveWorkoutDraftStorageKey(userId));
      setDraftMessage(
        `${result.reason} Clear recovery data to restart safely.`,
      );
      setStep("idle");
    }
  }, [mode, userId, workouts]);

  useEffect(() => {
    if (isActiveMode) {
      return;
    }

    const card = workoutCardRefs.current[selectedWorkoutId];
    if (!card) {
      return;
    }

    card.scrollIntoView({ block: "nearest" });
  }, [isActiveMode, selectedWorkoutId]);

  useEffect(() => {
    if (
      !shouldPersistActiveWorkoutDraft({
        hasActiveDraft: Boolean(activeDraft),
        step,
        awaitingStaleRecoveryDecision,
      }) ||
      !activeDraft ||
      !userId
    ) {
      return;
    }

    try {
      const nextDraft: ActiveWorkoutDraft = {
        ...activeDraft,
        lifecycle:
          step === "check-in"
            ? status
              ? "save_failed"
              : "finishing"
            : "active",
        checkedExerciseIds,
        setResults,
        exerciseNotes,
        restTimer,
        autoStartRest,
        timerSoundEnabled,
        workoutRestOverrideEnabled,
        workoutDefaultRestSeconds,
        checkIn: {
          completedOn,
          completed,
          painOccurred: pain,
          perceivedDifficulty: toDifficultyValue(effort),
          notes,
        },
      };
      const storedDraft = writeActiveWorkoutDraft(
        window.localStorage,
        nextDraft,
      );
      setActiveDraft(storedDraft);
      setStorageAvailable(true);
    } catch {
      setStorageAvailable(false);
      setStatus(
        "Workout recovery storage is unavailable. You can still finish now, but refresh recovery may not work.",
      );
    }
  }, [
    activeDraft?.draftId,
    awaitingStaleRecoveryDecision,
    checkedExerciseIds,
    setResults,
    exerciseNotes,
    restTimer,
    autoStartRest,
    timerSoundEnabled,
    workoutRestOverrideEnabled,
    workoutDefaultRestSeconds,
    completed,
    completedOn,
    effort,
    notes,
    pain,
    status,
    step,
    userId,
  ]);

  useEffect(() => {
    const hasMeaningfulDraft = Boolean(
      activeDraft &&
      step !== "saved" &&
      (checkedExerciseIds.length > 0 || setResults.length > 0),
    );
    if (!hasMeaningfulDraft) {
      return;
    }

    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [activeDraft, checkedExerciseIds.length, setResults.length, step]);

  useEffect(() => {
    setLiveRestTimer(deriveRestTimerState(restTimer));
    if (!restTimer || restTimer.status !== "running") {
      return;
    }
    const interval = window.setInterval(() => {
      setLiveRestTimer(deriveRestTimerState(restTimer));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [restTimer]);

  useEffect(() => {
    if (liveRestTimer.status === "expired" && restTimer?.status === "running") {
      setRestTimer(liveRestTimer);
      const completionEventId = shouldEmitRestTimerCompletionFeedback({
        previousTimer: restTimer,
        currentTimer: liveRestTimer,
        emittedEventIds: completedFeedbackEvents.current,
      });
      if (!completionEventId) return;
      completedFeedbackEvents.current.add(completionEventId);
      vibrateRestComplete();
      if (getEffectiveTimerSound(timerSoundEnabled)) {
        playCompletionCue();
      }
    }
  }, [liveRestTimer, playCompletionCue, restTimer, timerSoundEnabled]);

  function handleSetCompletedForRest(input: {
    exercise: WorkoutTemplate["exercises"][number];
    setId: string;
  }) {
    unlockAudio();
    if (!autoStartRest) return;
    if (
      restTimer?.status === "running" &&
      restTimer.lastCompletedSetId === input.setId
    )
      return;
    setCurrentRestExerciseId(input.exercise.id);
    const durationSeconds = resolveRestDurationSeconds({
      workoutOverrideEnabled: workoutRestOverrideEnabled,
      workoutOverrideSeconds: workoutDefaultRestSeconds,
      exerciseRest: input.exercise.rest,
      globalDefaultSeconds: defaultRestSeconds,
    });
    setRestTimer(
      startRestTimer({
        durationSeconds,
        exerciseEntryId: input.exercise.id,
        exerciseName: input.exercise.name,
        autoStarted: true,
        setId: input.setId,
      }),
    );
    setDraftMessage(`Rest timer restarted for ${input.exercise.name}.`);
  }

  function handleSelectWorkout(id: string) {
    if (activeDraft && activeDraft.workoutTemplateId !== id) {
      setDraftMessage(
        `Resume or discard ${activeDraft.workoutNameSnapshot} before starting another workout.`,
      );
    } else {
      setDraftMessage(null);
    }

    setSelectedWorkoutId(id);
    if (!activeDraft) {
      setCheckedExerciseIds([]);
      setSetResults([]);
      setExerciseNotes({});
    }
    setStep(isActiveMode ? "workout" : "idle");
    setFinishElapsedSnapshot(null);
    setSavedSession(null);
    setStatus(null);
    router.replace(
      `${isActiveMode ? "/workout/active" : "/workout"}?workoutId=${id}` as Route,
    );
  }

  function handleStartWorkout(workoutToStart = workout) {
    if (!userId) {
      return;
    }

    if (activeDraft) {
      if (activeDraft.workoutTemplateId === workoutToStart.id) {
        handleResumeDraft();
      } else {
        handleSelectWorkout(workoutToStart.id);
      }
      return;
    }

    try {
      const draft = buildActiveWorkoutDraft({
        userId,
        workout: workoutToStart,
        plan: activePlan,
      });
      const storedDraft = writeActiveWorkoutDraft(window.localStorage, draft);
      setActiveDraft(storedDraft);
      setCheckedExerciseIds([]);
      setSetResults([]);
      setExerciseNotes({});
      setTimerSoundEnabled(true);
      setWorkoutRestOverrideEnabled(false);
      setWorkoutDefaultRestSeconds(90);
      setInvalidRecoveryKey(null);
      setAwaitingStaleRecoveryDecision(false);
      setDraftMessage(
        `Started ${workoutToStart.name}. Your draft is saved on this device.`,
      );
      setStep(isActiveMode ? "workout" : "idle");
      router.push(`/workout/active?workoutId=${workoutToStart.id}` as Route);
    } catch {
      setStorageAvailable(false);
      setStatus(
        "Workout recovery storage is unavailable. Free space or enable storage, then try again.",
      );
    }
  }

  function closeWorkoutSettings() {
    setSettingsOpen(false);
    window.requestAnimationFrame(() => settingsTriggerRef.current?.focus());
  }

  function updateTimerSoundEnabled(value: boolean) {
    setTimerSoundEnabled(value);
    if (value) {
      unlockAudio();
    }
  }

  function clearRestTimerFeedback() {
    setRestTimer(null);
    setLiveRestTimer(idleRestTimerState);
    closeAudio();
  }

  function handleDiscardDraft() {
    if (
      !activeDraft ||
      !window.confirm(
        "Discard this active workout? Unsaved workout performance will be lost, but plans and completed history stay unchanged.",
      )
    ) {
      return;
    }

    window.localStorage.removeItem(
      getActiveWorkoutDraftStorageKey(activeDraft.userId),
    );
    setActiveDraft(null);
    setAwaitingStaleRecoveryDecision(false);
    setCheckedExerciseIds([]);
    setSetResults([]);
    setExerciseNotes({});
    clearRestTimerFeedback();
    setTimerSoundEnabled(true);
    setWorkoutRestOverrideEnabled(false);
    setWorkoutDefaultRestSeconds(90);
    setDraftMessage("Active workout draft discarded.");
    setStatus(null);
    setInvalidRecoveryKey(null);
    setStep("idle");
    if (isActiveMode) {
      router.replace(
        getDiscardRedirectPath(activeDraft.workoutTemplateId) as Route,
      );
    }
  }

  function handleClearRecoveryData() {
    if (!invalidRecoveryKey) {
      return;
    }

    window.localStorage.removeItem(invalidRecoveryKey);
    setInvalidRecoveryKey(null);
    setAwaitingStaleRecoveryDecision(false);
    setDraftMessage("Recovery data cleared. You can start fresh now.");
    setStatus(null);
    setStep("idle");
  }

  function handleResumeDraft() {
    if (!activeDraft) {
      return;
    }

    setAwaitingStaleRecoveryDecision(false);
    setStep(
      isActiveMode
        ? activeDraft.lifecycle === "finishing" ||
          activeDraft.lifecycle === "save_failed"
          ? "check-in"
          : "workout"
        : "idle",
    );
    setDraftMessage(`Resumed ${activeDraft.workoutNameSnapshot}.`);
    router.push(
      `/workout/active?workoutId=${activeDraft.workoutTemplateId}` as Route,
    );
  }

  function handleFinishWorkout() {
    if (!finishEnabled || !activeDraft) {
      return;
    }
    const snapshot = finishElapsedSnapshot ?? getElapsedSeconds(activeDraft);
    setFinishElapsedSnapshot(snapshot);
    setCompleted(true);
    setActiveDraft({
      ...activeDraft,
      lifecycle: "finishing",
      elapsedOffsetSeconds: snapshot,
      startedAt: new Date().toISOString(),
      restTimer: null,
    });
    clearRestTimerFeedback();
    setCurrentRestExerciseId(null);
    setStep("check-in");
    setStatus(null);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }

  function handleBackToWorkout() {
    if (activeDraft && finishElapsedSnapshot != null) {
      setActiveDraft({
        ...activeDraft,
        lifecycle: "active",
        elapsedOffsetSeconds: finishElapsedSnapshot,
        startedAt: new Date().toISOString(),
        restTimer: null,
      });
    }
    setFinishElapsedSnapshot(null);
    clearRestTimerFeedback();
    setStep("workout");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workoutTemplateId: workout.id,
          completedOn,
          completed,
          painOccurred: pain,
          perceivedDifficulty: toDifficultyValue(effort),
          notes,
          completedExerciseIds: checkedExerciseIds,
          setResults,
          exerciseNotes,
          clientSessionId: activeDraft?.draftId,
          startedAt: activeDraft?.startedAt,
          elapsedSeconds: activeDraft
            ? (finishElapsedSnapshot ?? getElapsedSeconds(activeDraft))
            : undefined,
        }),
      });
      const result = (await response.json()) as SessionSaveResult;

      if (!response.ok || !result.session) {
        throw new Error(result.error ?? "Unable to save workout.");
      }

      const savedWorkoutSession = result.session;

      if (activeDraft) {
        window.localStorage.removeItem(
          getActiveWorkoutDraftStorageKey(activeDraft.userId),
        );
      }
      clearRestTimerFeedback();
      setFinishElapsedSnapshot(null);
      setSavedSession(savedWorkoutSession);
      setSessionHistory((currentSessions) =>
        mergeSessions(currentSessions, [savedWorkoutSession]),
      );
      setActiveDraft(null);
      setStep("saved");
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      setNotes("");
      startTransition(() => router.refresh());
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Unable to save workout.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleStartAnotherWorkout() {
    if (activeDraft) {
      window.localStorage.removeItem(
        getActiveWorkoutDraftStorageKey(activeDraft.userId),
      );
    }
    setActiveDraft(null);
    setAwaitingStaleRecoveryDecision(false);
    setCheckedExerciseIds([]);
    setSetResults([]);
    setExerciseNotes({});
    clearRestTimerFeedback();
    setTimerSoundEnabled(true);
    setWorkoutRestOverrideEnabled(false);
    setWorkoutDefaultRestSeconds(90);
    setCompleted(true);
    setPain(false);
    setEffort("Appropriate");
    setNotes("");
    const nextTodayDate = getClientTodayDateString();
    setTodayDate(nextTodayDate);
    setCompletedOn(nextTodayDate);
    setFinishElapsedSnapshot(null);
    setSavedSession(null);
    setStatus(null);
    setStep("idle");
    router.push(`/workout?workoutId=${workout.id}` as Route);
  }

  const progress = calculateSetProgress({
    exercises: workout.exercises,
    setResults,
    checkedExerciseIds,
  });
  const liveElapsedSeconds = useLiveElapsedSeconds(activeDraft);
  const elapsedSeconds =
    step === "check-in" && finishElapsedSnapshot != null
      ? finishElapsedSnapshot
      : liveElapsedSeconds;
  const finishRecap = useMemo(
    () =>
      buildWorkoutRecap(
        workout,
        setResults,
        checkedExerciseIds,
        elapsedSeconds,
      ),
    [checkedExerciseIds, elapsedSeconds, setResults, workout],
  );
  const finishEnabled = canFinishActiveWorkout({
    mode,
    hasActiveDraft: Boolean(activeDraft),
    step,
    awaitingStaleRecoveryDecision,
    hasMalformedRecoveryData: Boolean(invalidRecoveryKey),
    saving,
  });

  const workoutSettingsDialog =
    settingsOpen && activeDraft ? (
      <WorkoutSettingsDialog
        autoStartRest={autoStartRest}
        timerSoundEnabled={timerSoundEnabled}
        workoutRestOverrideEnabled={workoutRestOverrideEnabled}
        workoutDefaultRestSeconds={workoutDefaultRestSeconds}
        globalDefaultRestSeconds={defaultRestSeconds}
        onAutoStartChange={setAutoStartRest}
        onSoundChange={updateTimerSoundEnabled}
        onOverrideEnabledChange={setWorkoutRestOverrideEnabled}
        onDefaultRestChange={setWorkoutDefaultRestSeconds}
        onReset={() => {
          setAutoStartRest(activeWorkoutAutoStartRestDefault);
          updateTimerSoundEnabled(true);
          setWorkoutRestOverrideEnabled(false);
          setWorkoutDefaultRestSeconds(90);
        }}
        onClose={closeWorkoutSettings}
      />
    ) : null;

  if (isActiveMode) {
    return (
      <div
        className={`mx-auto max-w-3xl ${liveRestTimer.status === "idle" || step === "check-in" ? "pb-[max(2rem,env(safe-area-inset-bottom))]" : "pb-[max(12rem,calc(env(safe-area-inset-bottom)+10rem))]"}`}
      >
        {workoutSettingsDialog}
        {step !== "check-in" ? (
          <div className="sticky top-0 z-30 -mx-3 border-b border-border/80 bg-shell/95 px-3 py-3 backdrop-blur sm:top-2 sm:mx-0 sm:rounded-[28px] sm:border sm:shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-copy">
                  {workout.name}
                </p>
                <p className="mt-1 text-xs font-semibold text-muted">
                  {formatElapsed(elapsedSeconds)} · {progress.completed}/
                  {progress.total} sets
                  {liveRestTimer.status === "idle"
                    ? ""
                    : ` · Rest ${formatRestTimer(liveRestTimer.remainingSeconds)}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={handleFinishWorkout}
                  className="ui-button-primary px-4 py-2"
                  disabled={!finishEnabled}
                >
                  Finish
                </button>
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="ui-button-ghost px-3 py-2"
                  disabled={!activeDraft}
                  aria-label="Discard active workout"
                >
                  Discard
                </button>
                <button
                  type="button"
                  ref={settingsTriggerRef}
                  onClick={() => setSettingsOpen(true)}
                  className="ui-button-secondary min-h-11 px-3 py-2"
                  disabled={!activeDraft}
                  aria-label="Workout settings"
                >
                  ⋯
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-4 space-y-4">
          {shouldShowActiveStartCard({
            mode,
            hasActiveDraft: Boolean(activeDraft),
            hasMalformedRecoveryData: Boolean(invalidRecoveryKey),
            step,
          }) ? (
            <div className="surface-card p-5">
              <p className="text-sm leading-6 text-muted">
                No active workout draft is available for this route.
              </p>
              <button
                type="button"
                onClick={() =>
                  router.push(`/workout?workoutId=${workout.id}` as Route)
                }
                className="ui-button-primary mt-4"
              >
                Back to workout details
              </button>
            </div>
          ) : null}
          {invalidRecoveryKey ? (
            <div className="surface-card p-5">
              <p className="text-sm leading-6 text-muted">
                Recovery data is unavailable for this workout.
              </p>
              <button
                type="button"
                onClick={handleClearRecoveryData}
                className="ui-button-secondary mt-4"
              >
                Clear recovery data
              </button>
            </div>
          ) : null}
          {activeDraft && step === "idle" ? (
            <div className="surface-card p-5">
              <p className="text-sm leading-6 text-muted">
                Resume the recovered active workout draft or discard it before
                starting over.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleResumeDraft}
                  className="ui-button-primary"
                >
                  Resume workout
                </button>
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="ui-button-ghost"
                >
                  Discard
                </button>
              </div>
            </div>
          ) : null}

          {step === "workout" && activeDraft ? (
            <>
              <RestTimerDock
                timer={liveRestTimer}
                onPause={() =>
                  setRestTimer((current) =>
                    current ? pauseRestTimer(current) : current,
                  )
                }
                onResume={() =>
                  setRestTimer((current) =>
                    current ? resumeRestTimer(current) : current,
                  )
                }
                onAdd={() =>
                  setRestTimer((current) =>
                    current ? addRestTime(current, 15) : current,
                  )
                }
                onCancel={clearRestTimerFeedback}
              />
              <WorkoutChecklist
                workout={workout}
                checkedExerciseIds={checkedExerciseIds}
                onCheckedExerciseIdsChange={setCheckedExerciseIds}
                setResults={setResults}
                onSetResultsChange={setSetResults}
                compactExecution
                onSetCompleted={handleSetCompletedForRest}
              />
            </>
          ) : null}

          {step === "check-in" ? (
            <div className="surface-card p-5 sm:p-6">
              <p className="ui-eyebrow">Finish workout</p>
              <h1 className="mt-2 text-2xl font-black text-copy">
                {workout.name}
              </h1>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {finishRecap.metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-[20px] border border-border bg-surface-soft p-3"
                  >
                    <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-muted">
                      {metric.label}
                    </p>
                    <p className="mt-1 text-lg font-black text-copy">
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-[24px] border border-border bg-surface-soft p-4">
                <p className="text-sm font-black text-copy">Completed work</p>
                <div className="mt-3 space-y-3">
                  {finishRecap.exerciseSummaries.map((exercise) => (
                    <div key={exercise.id}>
                      <p className="text-sm font-bold text-copy">
                        {exercise.name}
                      </p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-muted">
                        {exercise.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
                <label className="block rounded-[24px] border border-border bg-surface-soft p-4">
                  <span className="text-sm font-semibold text-copy">
                    Workout date
                  </span>
                  <input
                    type="date"
                    value={completedOn}
                    max={todayDate}
                    onChange={(event) => setCompletedOn(event.target.value)}
                    className="ui-input mt-3"
                  />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <fieldset className="rounded-[24px] border border-border bg-surface-soft p-4">
                    <legend className="text-sm font-semibold text-copy">
                      Did anything hurt?
                    </legend>
                    <div className="mt-4 flex gap-3">
                      {[
                        { label: "No pain", value: false },
                        { label: "Yes", value: true },
                      ].map((option) => (
                        <button
                          key={option.label}
                          type="button"
                          onClick={() => setPain(option.value)}
                          className={`rounded-full px-4 py-2 text-sm font-semibold ${pain === option.value ? "bg-hero text-white" : "bg-surface text-muted"}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </div>
                <fieldset className="rounded-[24px] border border-border bg-surface-soft p-4">
                  <legend className="text-sm font-semibold text-copy">
                    Session difficulty
                  </legend>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {effortOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setEffort(option)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${effort === option ? "bg-primary text-white" : "bg-surface text-muted"}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <label className="block rounded-[24px] border border-border bg-surface-soft p-4">
                  <span className="text-sm font-semibold text-copy">Notes</span>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={4}
                    className="ui-input mt-3"
                  />
                </label>
                {status ? (
                  <p className="text-sm leading-6 text-muted">{status}</p>
                ) : null}
                <div className="flex flex-col gap-3">
                  <button
                    className="ui-button-primary"
                    disabled={saving || isPending}
                  >
                    {saving
                      ? "Saving..."
                      : status
                        ? "Retry save"
                        : "Save workout"}
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToWorkout}
                    className="ui-button-secondary"
                  >
                    Back to workout
                  </button>
                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    className="ui-button-ghost text-danger"
                    disabled={saving || isPending || !activeDraft}
                  >
                    Discard workout
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {step === "saved" && savedSession ? (
            <div className="surface-card p-5">
              <p className="ui-eyebrow">Saved</p>
              <h1 className="mt-2 text-2xl font-black text-copy">
                {savedSession.workoutName}
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted">
                {savedSession.completedExerciseCount} exercises checked.{" "}
                {savedSession.recommendation}
              </p>
              <button
                type="button"
                onClick={handleStartAnotherWorkout}
                className="ui-button-primary mt-5"
              >
                Back to workout details
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  const orderedWorkouts = useMemo(
    () =>
      orderWorkoutsForUpcomingSchedule({
        workouts,
        recommendedWorkoutId: recommendedWorkout?.id,
        timeZone,
      }),
    [recommendedWorkout?.id, timeZone, workouts],
  );
  return (
    <div className="space-y-5 sm:space-y-6">
      {workoutSettingsDialog}
      <section className="surface-card px-5 py-4 sm:px-6 sm:py-5">
        <h1 className="text-3xl font-black leading-tight text-copy sm:text-4xl">
          Choose today&apos;s workout
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          {activePlan.currentPhase.goal}
        </p>
      </section>

      <section className="surface-card px-5 py-4 sm:px-6 sm:py-5">
        {draftMessage ? (
          <div className="mb-3 rounded-[24px] border border-primary/20 bg-primary/10 px-4 py-3 text-sm leading-6 text-copy">
            {draftMessage}
          </div>
        ) : null}
        <div className="grid gap-3">
          {orderedWorkouts.map(
            ({ workout: item, scheduleLabel, isTodayWorkout }) => {
              const ownsDraft = activeDraft?.workoutTemplateId === item.id;
              const isSelected = item.id === workout.id;
              const visibleExercises = item.exercises.slice(0, 5);
              const remainingExerciseCount = Math.max(
                item.exercises.length - visibleExercises.length,
                0,
              );

              return (
                <article
                  key={item.id}
                  id={`workout-card-${item.id}`}
                  ref={(node) => {
                    workoutCardRefs.current[item.id] = node;
                  }}
                  className={`rounded-[22px] border px-4 py-3 transition sm:px-5 ${
                    isTodayWorkout
                      ? "border-primary bg-primary/10 shadow-soft"
                      : ownsDraft
                        ? "border-success/40 bg-success/10"
                        : isSelected
                          ? "border-primary/40 bg-surface-soft"
                          : "border-border bg-surface-soft"
                  }`}
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:gap-4">
                    <button
                      type="button"
                      onClick={() => handleSelectWorkout(item.id)}
                      className="min-w-0 text-left"
                      aria-label={`View details for ${item.name}`}
                    >
                      {scheduleLabel ? (
                        <p
                          className={`text-[0.68rem] font-black uppercase tracking-[0.14em] ${isTodayWorkout ? "text-primary" : "text-muted"}`}
                        >
                          {scheduleLabel}
                        </p>
                      ) : null}
                      <p className="mt-0.5 break-words text-base font-black leading-snug text-copy">
                        {item.name}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted">
                        {item.focus || item.summary}
                      </p>
                      {ownsDraft ? (
                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-success">
                          Active workout
                        </p>
                      ) : null}
                      <ul className="mt-2 space-y-1 text-sm leading-5 text-copy">
                        {visibleExercises.map((exercise) => (
                          <li key={exercise.id} className="flex gap-2">
                            <span className="text-muted" aria-hidden="true">
                              •
                            </span>
                            <span className="min-w-0 break-words">
                              <span className="font-semibold">
                                {exercise.name}
                              </span>
                              <span className="text-muted">
                                {` · ${formatExercisePrescription(exercise)}`}
                              </span>
                            </span>
                          </li>
                        ))}
                        {remainingExerciseCount > 0 ? (
                          <li className="flex gap-2 text-muted">
                            <span aria-hidden="true">•</span>
                            <span>+{remainingExerciseCount} more</span>
                          </li>
                        ) : null}
                      </ul>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        ownsDraft
                          ? handleResumeDraft()
                          : handleStartWorkout(item)
                      }
                      className="ui-button-primary min-h-12 shrink-0 rounded-2xl px-5 py-3 text-sm sm:px-6"
                      aria-label={`${ownsDraft ? "Resume" : "Start"} ${item.name}`}
                    >
                      {ownsDraft ? "Resume" : "Start"}
                    </button>
                  </div>
                </article>
              );
            },
          )}
        </div>
      </section>
    </div>
  );
}

function useLiveElapsedSeconds(draft: ActiveWorkoutDraft | null) {
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    draft ? getElapsedSeconds(draft) : 0,
  );

  useEffect(() => {
    if (!draft) {
      setElapsedSeconds(0);
      return;
    }

    const update = () => setElapsedSeconds(getElapsedSeconds(draft));
    update();
    const intervalId = window.setInterval(update, 1000);
    return () => window.clearInterval(intervalId);
  }, [draft]);

  return elapsedSeconds;
}

function formatElapsed(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const paddedMinutes =
    hours > 0 ? String(minutes).padStart(2, "0") : String(minutes);
  const paddedSeconds = String(seconds).padStart(2, "0");

  return hours > 0
    ? `${hours}:${paddedMinutes}:${paddedSeconds}`
    : `${paddedMinutes}:${paddedSeconds}`;
}
