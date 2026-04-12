"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { TimerCard } from "@/components/timer-card";
import { WorkoutChecklist } from "@/components/workout-checklist";
import { generateRecommendation } from "@/lib/recommendation";
import { getTodayDateString } from "@/lib/validation";
import type {
  SavedWorkoutSession,
  WorkoutProgressSummary,
  WorkoutSession,
  WorkoutTemplate
} from "@/lib/types";

const effortOptions = ["Too easy", "Appropriate", "Too hard"] as const;

type FlowStep = "workout" | "check-in" | "saved";

type WorkoutFlowProps = {
  workouts: WorkoutTemplate[];
  selectedWorkout: WorkoutTemplate;
  initialStep: "workout" | "check-in";
  recentSessions: WorkoutSession[];
  progressSummary: WorkoutProgressSummary;
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
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate">
            {bar.label}
          </p>
          <div className="h-3 overflow-hidden rounded-full bg-mist">
            <div
              className="h-full rounded-full bg-coral"
              style={{ width: `${Math.max(8, (bar.completed / maxCompleted) * 100)}%` }}
            />
          </div>
          <p className="text-right text-sm font-semibold text-ink">{bar.completed}</p>
        </div>
      ))}
    </div>
  );
}

function ProgressSummary({ summary }: { summary: WorkoutProgressSummary }) {
  return (
    <section id="progress" className="rounded-[32px] border border-white/70 bg-[#fffdf9]/85 p-6 shadow-card">
      <p className="text-xs uppercase tracking-[0.24em] text-slate">Progress</p>
      <h2 className="mt-2 font-display text-3xl text-ink">Your workout rhythm</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate">
        A simple look at how your recent workouts line up with the plan.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl bg-white/70 p-4">
          <p className="mb-4 text-sm font-semibold text-ink">Completed workouts</p>
          <ProgressBars summary={summary} />
        </div>

        <div className="grid gap-3">
          <div className="rounded-3xl bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate">This week</p>
            <p className="mt-2 text-xl font-semibold text-ink">
              {summary.completedThisWeek} of {summary.weeklyTarget}
            </p>
          </div>
          <div className="rounded-3xl bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate">Clean sessions</p>
            <p className="mt-2 text-xl font-semibold text-ink">{summary.cleanSessions}</p>
          </div>
          <div className="rounded-3xl bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate">Pain flags</p>
            <p className="mt-2 text-xl font-semibold text-ink">{summary.painFlags}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-3xl bg-coral/10 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-coral">Latest suggestion</p>
        <p className="mt-2 text-sm leading-6 text-ink">{summary.latestRecommendation}</p>
      </div>
    </section>
  );
}

export function WorkoutFlow({
  workouts,
  selectedWorkout,
  initialStep,
  recentSessions,
  progressSummary
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
    <div className="space-y-6">
      <section className="rounded-[32px] bg-ink px-6 py-8 text-white shadow-card">
        <p className="text-sm uppercase tracking-[0.24em] text-white/70">Workout</p>
        <h1 className="mt-3 max-w-xl font-display text-4xl leading-tight text-balance sm:text-5xl">
          Start, log, and keep your progress visible.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-white/78 sm:text-base">
          Run a workout now or log one you missed from another day.
        </p>
      </section>

      {workouts.length > 1 ? (
        <section className="rounded-[32px] border border-white/70 bg-[#fffdf9]/85 p-6 shadow-card">
          <label className="block">
            <span className="text-sm font-semibold text-ink">Choose workout</span>
            <select
              value={workout.id}
              onChange={(event) => handleSelectWorkout(event.target.value)}
              className="mt-3 w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
            >
              {workouts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[32px] border border-white/70 bg-[#fffdf9]/85 p-6 shadow-card">
          <p className="text-xs uppercase tracking-[0.24em] text-slate">
            {step === "saved" ? "Workout saved" : step === "check-in" ? "Check-in" : "Exercises"}
          </p>
          <h2 className="mt-2 font-display text-3xl text-ink">{workout.name}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate">{workout.summary}</p>

          {latestSession ? (
            <div className="mt-3 rounded-3xl bg-moss/10 px-4 py-3 text-sm leading-6 text-ink">
              <p>
                Last logged on {formatDisplayDate(latestSession.completedOn)}:{" "}
                {latestSession.recommendation}
              </p>
              {getSessionNotes(latestSession) ? (
                <p className="mt-2 text-slate">
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
                  className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white"
                >
                  Finish Workout
                </button>
              </div>
            ) : null}

            {step === "check-in" ? (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="rounded-[28px] bg-white/70 p-4 text-sm text-slate">
                  <p className="font-semibold text-ink">{workout.name}</p>
                  <p className="mt-2 leading-6">
                    {checkedExerciseIds.length} of {workout.exercises.length} exercises checked.
                  </p>
                </div>

                <label className="block rounded-3xl bg-white/70 p-4">
                  <span className="text-sm font-semibold text-ink">Workout date</span>
                  <input
                    type="date"
                    value={completedOn}
                    max={getTodayDateString()}
                    onChange={(event) => setCompletedOn(event.target.value)}
                    className="mt-3 w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <fieldset className="rounded-3xl bg-white/70 p-4">
                    <legend className="text-sm font-semibold text-ink">
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
                              ? "bg-ink text-white"
                              : "bg-mist text-slate"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="rounded-3xl bg-white/70 p-4">
                    <legend className="text-sm font-semibold text-ink">
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
                            pain === option.value ? "bg-ink text-white" : "bg-mist text-slate"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </div>

                <fieldset className="rounded-3xl bg-white/70 p-4">
                  <legend className="text-sm font-semibold text-ink">
                    Session difficulty
                  </legend>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {effortOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setEffort(option)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${
                          effort === option ? "bg-coral text-white" : "bg-mist text-slate"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label className="block rounded-3xl bg-white/70 p-4">
                  <span className="text-sm font-semibold text-ink">Notes</span>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={5}
                    placeholder="Anything worth remembering for the next session?"
                    className="mt-3 w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
                  />
                </label>

                <div className="rounded-[28px] border border-coral/20 bg-coral/10 p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-coral">
                    Suggested next step
                  </p>
                  <p className="mt-3 text-lg font-semibold text-ink">
                    {recommendation.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate">
                    {recommendation.description}
                  </p>
                </div>

                {status ? <p className="text-sm leading-6 text-slate">{status}</p> : null}

                <div className="flex flex-wrap gap-3">
                  <button
                    className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    disabled={saving || isPending}
                  >
                    {saving ? "Saving..." : "Save Workout"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("workout")}
                    className="rounded-full border border-ink/10 bg-white px-5 py-3 text-sm font-semibold text-ink"
                  >
                    Back to Exercises
                  </button>
                </div>
              </form>
            ) : null}

            {step === "saved" && savedSession ? (
              <div className="space-y-5">
                <div className="rounded-[28px] bg-moss/10 p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-moss">
                    Saved
                  </p>
                  <p className="mt-3 text-xl font-semibold text-ink">
                    {savedSession.workoutName} on {formatDisplayDate(savedSession.completedOn)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate">
                    {savedSession.completedExerciseCount} exercises checked.{" "}
                    {savedSession.recommendation}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleStartAnotherWorkout}
                    className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white"
                  >
                    Start Another Workout
                  </button>
                  <a
                    href="#progress"
                    className="rounded-full border border-ink/10 bg-white px-5 py-3 text-sm font-semibold text-ink"
                  >
                    View Progress
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <TimerCard />
      </section>

      {sessionHistory.length > 0 ? (
        <section className="rounded-[32px] border border-white/70 bg-[#fffdf9]/85 p-6 shadow-card">
          <p className="text-xs uppercase tracking-[0.24em] text-slate">Recent logs</p>
          <h2 className="mt-2 font-display text-3xl text-ink">What you saved recently</h2>
          <div className="mt-5 grid gap-3">
            {sessionHistory.slice(0, 4).map((session) => (
              <div key={session.id} className="rounded-3xl bg-white/70 p-4 text-sm">
                <p className="font-semibold text-ink">{formatDisplayDate(session.completedOn)}</p>
                <p className="mt-2 leading-6 text-slate">{session.recommendation}</p>
                {getSessionNotes(session) ? (
                  <p className="mt-2 leading-6 text-slate">
                    Notes: {getSessionNotes(session)}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <ProgressSummary summary={liveProgressSummary} />
    </div>
  );
}
