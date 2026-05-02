"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { PhaseProgressPanel } from "@/components/phase-progress-panel";
import { TimerCard } from "@/components/timer-card";
import { WorkoutChecklist } from "@/components/workout-checklist";
import { formatPhaseLabel } from "@/lib/plan-labels";
import { generateRecommendation } from "@/lib/recommendation";
import { getTodayDateString } from "@/lib/validation";
import type {
  SavedWorkoutSession,
  PhaseProgressSummary,
  WorkoutPlan,
  WorkoutProgressSummary,
  WorkoutSession,
  WorkoutTemplate
} from "@/lib/types";

const effortOptions = ["Too easy", "Appropriate", "Too hard"] as const;

type FlowStep = "workout" | "check-in" | "saved";

type WorkoutFlowProps = {
  workouts: WorkoutTemplate[];
  activePlan: WorkoutPlan;
  recommendedWorkout: WorkoutTemplate | null;
  selectedWorkout: WorkoutTemplate;
  initialStep: "workout" | "check-in";
  recentSessions: WorkoutSession[];
  progressSummary: WorkoutProgressSummary;
  phaseProgress: PhaseProgressSummary | null;
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
    timeZone: "UTC"
  });
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
  nextSessions: WorkoutSession[]
) {
  const sessionsById = new Map<string, WorkoutSession>();

  for (const session of [...currentSessions, ...nextSessions]) {
    sessionsById.set(session.id, session);
  }

  return sortSessionsByLatest(Array.from(sessionsById.values()));
}

function ProgressBars({ summary }: { summary: WorkoutProgressSummary }) {
  const maxCompleted = Math.max(
    summary.weeklyTarget,
    ...summary.weeklyBars.map((bar) => bar.completed),
    1
  );

  return (
    <div className="space-y-3">
      {summary.weeklyBars.map((bar) => (
        <div key={bar.label} className="grid grid-cols-[4.5rem_1fr_2rem] items-center gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
            {bar.label}
          </p>
          <div className="h-3 overflow-hidden rounded-full bg-shell-elevated">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.max(8, (bar.completed / maxCompleted) * 100)}%` }}
            />
          </div>
          <p className="text-right text-sm font-semibold text-copy">{bar.completed}</p>
        </div>
      ))}
    </div>
  );
}

function ProgressSummary({ summary }: { summary: WorkoutProgressSummary }) {
  return (
    <section id="progress" className="surface-card p-5 sm:p-6">
      <p className="ui-eyebrow">Progress</p>
      <h2 className="mt-2 text-2xl font-black leading-tight text-copy">Workout rhythm</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
        Recent workouts against the plan rhythm.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[24px] border border-border bg-surface-soft p-4">
          <p className="mb-4 text-sm font-semibold text-copy">Completed workouts</p>
          <ProgressBars summary={summary} />
        </div>

        <div className="grid gap-3">
          <div className="rounded-[22px] border border-border bg-surface-soft p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">This week</p>
            <p className="mt-2 text-xl font-black text-copy">
              {summary.completedThisWeek} of {summary.weeklyTarget}
            </p>
          </div>
          <div className="rounded-[22px] border border-border bg-surface-soft p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Clean sessions</p>
            <p className="mt-2 text-xl font-black text-copy">{summary.cleanSessions}</p>
          </div>
          <div className="rounded-[22px] border border-border bg-surface-soft p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Pain flags</p>
            <p className="mt-2 text-xl font-black text-copy">{summary.painFlags}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[24px] border border-primary/20 bg-primary/10 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Latest suggestion</p>
        <p className="mt-2 text-sm leading-6 text-copy">{summary.latestRecommendation}</p>
      </div>
    </section>
  );
}

export function WorkoutFlow({
  workouts,
  activePlan,
  recommendedWorkout,
  selectedWorkout,
  initialStep,
  recentSessions,
  progressSummary,
  phaseProgress
}: WorkoutFlowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(selectedWorkout.id);
  const [step, setStep] = useState<FlowStep>(initialStep);
  const [checkedExerciseIds, setCheckedExerciseIds] = useState<string[]>([]);
  const [completed, setCompleted] = useState(true);
  const [pain, setPain] = useState(false);
  const [effort, setEffort] = useState<(typeof effortOptions)[number]>("Appropriate");
  const [notes, setNotes] = useState("");
  const [completedOn, setCompletedOn] = useState(getTodayDateString());
  const [savedSession, setSavedSession] = useState<SavedWorkoutSession | null>(null);
  const [sessionHistory, setSessionHistory] = useState(() =>
    sortSessionsByLatest(recentSessions)
  );
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSessionHistory((currentSessions) => mergeSessions(currentSessions, recentSessions));
  }, [recentSessions]);

  const workout = useMemo(
    () => workouts.find((item) => item.id === selectedWorkoutId) ?? selectedWorkout,
    [selectedWorkout, selectedWorkoutId, workouts]
  );
  const storageKey = `workout-checklist:${workout.id}`;
  const recommendation = generateRecommendation({ completed, pain, effort });
  const latestSession = useMemo(
    () => sessionHistory.find((session) => session.workoutTemplateId === workout.id) ?? null,
    [sessionHistory, workout.id]
  );
  const liveProgressSummary = useMemo(
    () => ({
      ...progressSummary,
      latestRecommendation:
        sessionHistory[0]?.recommendation ?? progressSummary.latestRecommendation
    }),
    [progressSummary, sessionHistory]
  );

  function handleSelectWorkout(id: string) {
    setSelectedWorkoutId(id);
    setCheckedExerciseIds([]);
    setStep("workout");
    setSavedSession(null);
    setStatus(null);
    router.replace(`/workout?workoutId=${id}` as Route);
  }

  function handleFinishWorkout() {
    setCompleted(checkedExerciseIds.length === workout.exercises.length);
    setStep("check-in");
    setStatus(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          workoutTemplateId: workout.id,
          completedOn,
          completed,
          painOccurred: pain,
          perceivedDifficulty: toDifficultyValue(effort),
          notes,
          completedExerciseIds: checkedExerciseIds
        })
      });
      const result = (await response.json()) as SessionSaveResult;

      if (!response.ok || !result.session) {
        throw new Error(result.error ?? "Unable to save workout.");
      }

      const savedWorkoutSession = result.session;

      window.sessionStorage.removeItem(storageKey);
      setSavedSession(savedWorkoutSession);
      setSessionHistory((currentSessions) =>
        mergeSessions(currentSessions, [savedWorkoutSession])
      );
      setStep("saved");
      setNotes("");
      startTransition(() => router.refresh());
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save workout.");
    } finally {
      setSaving(false);
    }
  }

  function handleStartAnotherWorkout() {
    window.sessionStorage.removeItem(storageKey);
    setCheckedExerciseIds([]);
    setCompleted(true);
    setPain(false);
    setEffort("Appropriate");
    setNotes("");
    setCompletedOn(getTodayDateString());
    setSavedSession(null);
    setStatus(null);
    setStep("workout");
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="overflow-hidden rounded-[30px] bg-hero p-5 text-white shadow-premium sm:rounded-[36px] sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/58">
              Workout
            </p>
            <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight text-balance sm:text-4xl">
              Execute today&apos;s session.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/72 sm:text-base">
              Move through the list, check in honestly, and save the session.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <HeroStat label="Phase" value={formatPhaseLabel(activePlan.currentPhase.phaseNumber)} />
            <HeroStat label="Exercises" value={String(workout.exercises.length)} />
            <HeroStat label="Logged" value={String(progressSummary.completedThisWeek)} />
          </div>
        </div>
      </section>

      <section className="surface-card p-5 sm:p-6">
        <p className="ui-eyebrow">Recommended today</p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-black leading-tight text-copy">
              {recommendedWorkout?.name ?? workout.name}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {formatPhaseLabel(activePlan.currentPhase.phaseNumber)}: {activePlan.currentPhase.goal}
            </p>
          </div>
          {recommendedWorkout ? (
            <button
              type="button"
              onClick={() => handleSelectWorkout(recommendedWorkout.id)}
              className="ui-button-primary"
            >
              Start recommended workout
            </button>
          ) : null}
        </div>

        {workouts.length > 1 ? (
          <label className="mt-5 block">
            <span className="text-sm font-semibold text-copy">
              Other workouts in this phase
            </span>
            <select
              value={workout.id}
              onChange={(event) => handleSelectWorkout(event.target.value)}
              className="ui-input mt-3"
            >
              {workouts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="surface-card p-5 sm:p-6">
          <p className="ui-eyebrow">
            {step === "saved" ? "Workout saved" : step === "check-in" ? "Check-in" : "Exercises"}
          </p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-copy">{workout.name}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">{workout.summary}</p>

          {latestSession ? (
            <div className="mt-4 rounded-[24px] border border-success/20 bg-success/10 px-4 py-3 text-sm leading-6 text-copy">
              <p>
                Last logged on {formatDisplayDate(latestSession.completedOn)}:{" "}
                {latestSession.recommendation}
              </p>
              {latestSession.progressionReason ? (
                <p className="mt-2 text-muted">{latestSession.progressionReason}</p>
              ) : null}
              {getSessionNotes(latestSession) ? (
                <p className="mt-2 text-muted">
                  Notes: {getSessionNotes(latestSession)}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-5">
            {step === "workout" ? (
              <div className="space-y-5">
                <WorkoutChecklist
                  workout={workout}
                  storageKey={storageKey}
                  checkedExerciseIds={checkedExerciseIds}
                  onCheckedExerciseIdsChange={setCheckedExerciseIds}
                />
                <button
                  type="button"
                  onClick={handleFinishWorkout}
                  className="ui-button-primary w-full sm:w-auto"
                >
                  Finish workout
                </button>
              </div>
            ) : null}

            {step === "check-in" ? (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="rounded-[24px] border border-border bg-surface-soft p-4 text-sm text-muted">
                  <p className="font-semibold text-copy">{workout.name}</p>
                  <p className="mt-2 leading-6">
                    {checkedExerciseIds.length} of {workout.exercises.length} exercises checked.
                  </p>
                </div>

                <label className="block rounded-[24px] border border-border bg-surface-soft p-4">
                  <span className="text-sm font-semibold text-copy">Workout date</span>
                  <input
                    type="date"
                    value={completedOn}
                    max={getTodayDateString()}
                    onChange={(event) => setCompletedOn(event.target.value)}
                    className="ui-input mt-3"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <fieldset className="rounded-[24px] border border-border bg-surface-soft p-4">
                    <legend className="text-sm font-semibold text-copy">
                      Did you finish the workout?
                    </legend>
                    <div className="mt-4 flex gap-3">
                      {[
                        { label: "Yes", value: true },
                        { label: "No", value: false }
                      ].map((option) => (
                        <button
                          key={option.label}
                          type="button"
                          onClick={() => setCompleted(option.value)}
                          className={`rounded-full px-4 py-2 text-sm font-semibold ${
                            completed === option.value
                              ? "bg-hero text-white"
                              : "bg-surface text-muted"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="rounded-[24px] border border-border bg-surface-soft p-4">
                    <legend className="text-sm font-semibold text-copy">
                      Did anything hurt?
                    </legend>
                    <div className="mt-4 flex gap-3">
                      {[
                        { label: "No pain", value: false },
                        { label: "Yes", value: true }
                      ].map((option) => (
                        <button
                          key={option.label}
                          type="button"
                          onClick={() => setPain(option.value)}
                          className={`rounded-full px-4 py-2 text-sm font-semibold ${
                            pain === option.value ? "bg-hero text-white" : "bg-surface text-muted"
                          }`}
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
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${
                          effort === option ? "bg-primary text-white" : "bg-surface text-muted"
                        }`}
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
                    rows={5}
                    placeholder="Anything worth remembering for the next session?"
                    className="ui-input mt-3"
                  />
                </label>

                <div className="rounded-[24px] border border-primary/20 bg-primary/10 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
                    Suggested next step
                  </p>
                  <p className="mt-3 text-lg font-black text-copy">
                    {recommendation.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {recommendation.description}
                  </p>
                </div>

                {status ? <p className="text-sm leading-6 text-muted">{status}</p> : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    className="ui-button-primary"
                    disabled={saving || isPending}
                  >
                    {saving ? "Saving..." : "Save workout"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("workout")}
                    className="ui-button-secondary"
                  >
                    Back to exercises
                  </button>
                </div>
              </form>
            ) : null}

            {step === "saved" && savedSession ? (
              <div className="space-y-5">
                <div className="rounded-[28px] border border-success/20 bg-success/10 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-success">
                    Saved
                  </p>
                  <p className="mt-3 text-xl font-black text-copy">
                    {savedSession.workoutName} on {formatDisplayDate(savedSession.completedOn)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {savedSession.completedExerciseCount} exercises checked.{" "}
                    {savedSession.recommendation}
                  </p>
                  {savedSession.progressionReason ? (
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {savedSession.progressionReason}
                    </p>
                  ) : null}
                  {savedSession.progressionDecision === "advance" ? (
                    <div className="mt-4 rounded-[24px] border border-primary/20 bg-primary/10 p-4">
                      <p className="text-sm font-semibold text-copy">
                        You may be ready for the next phase.
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted">
                        Review the plan before moving forward.
                      </p>
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={handleStartAnotherWorkout}
                    className="ui-button-primary"
                  >
                    Start another workout
                  </button>
                  <a
                    href="#progress"
                    className="ui-button-secondary text-center"
                  >
                    View progress
                  </a>
                  {savedSession.progressionDecision === "advance" ? (
                    <a
                      href={`/plans/${activePlan.id}`}
                      className="ui-button-ghost text-center"
                    >
                      Review plan progress
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <TimerCard />
      </section>

      {sessionHistory.length > 0 ? (
        <section className="surface-card p-5 sm:p-6">
          <p className="ui-eyebrow">Recent logs</p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-copy">Recent workouts</h2>
          <div className="mt-5 grid gap-3">
            {sessionHistory.slice(0, 4).map((session) => (
              <div key={session.id} className="rounded-[24px] border border-border bg-surface-soft p-4 text-sm">
                <p className="font-semibold text-copy">{formatDisplayDate(session.completedOn)}</p>
                <p className="mt-2 leading-6 text-muted">{session.recommendation}</p>
                {session.progressionReason ? (
                  <p className="mt-2 leading-6 text-muted">{session.progressionReason}</p>
                ) : null}
                {getSessionNotes(session) ? (
                  <p className="mt-2 leading-6 text-muted">
                    Notes: {getSessionNotes(session)}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <ProgressSummary summary={liveProgressSummary} />

      {phaseProgress ? (
        <PhaseProgressPanel plan={activePlan} progress={phaseProgress} mode="workout" />
      ) : null}
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.06] p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/45">
        {label}
      </p>
      <p className="mt-2 text-lg font-black leading-tight text-white">{value}</p>
    </div>
  );
}
