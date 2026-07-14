import Link from "next/link";
import { redirect } from "next/navigation";
import type { Route } from "next";
import clsx from "clsx";
import { SurfaceCard } from "@/components/surface-card";
import { getDashboardData, getProfile } from "@/lib/data";
import { formatPhaseLabel } from "@/lib/plan-labels";
import type {
  DashboardActivitySummary,
  DashboardPainTrend,
  DashboardProgressionPrompt,
  DashboardWeekPreviewItem,
  PhaseProgressSummary,
  WorkoutPlan,
  WorkoutSession,
  WorkoutTemplate
} from "@/lib/types";

function formatDisplayDate(date: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
    new Date(`${date}T00:00:00`),
  );
}

export default async function DashboardPage() {
  const [dashboard, profile] = await Promise.all([getDashboardData(), getProfile()]);
  const activePlan = dashboard.activePlan;
  const nextWorkout = dashboard.todayWorkout;

  if (!profile?.onboardingCompletedAt) {
    redirect("/onboarding" as Route);
  }

  if (!activePlan || !nextWorkout) {
    return <DashboardEmptyState hasPlan={Boolean(activePlan)} />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 sm:space-y-5">
      <TodayTrainingCard workout={nextWorkout} />
      <WeekPreview days={dashboard.weekPreview} activity={dashboard.activitySummary} />
      <CurrentPhaseCard
        plan={activePlan}
        progress={dashboard.phaseProgress}
        prompt={dashboard.progressionPrompt}
      />
      <ActivityCard
        activity={dashboard.activitySummary}
        painTrend={dashboard.painTrend}
        recentSessions={dashboard.recentSessions}
      />
    </div>
  );
}

function DashboardEmptyState({ hasPlan }: { hasPlan: boolean }) {
  return (
    <div className="mx-auto max-w-3xl">
      <section className="rounded-[28px] bg-hero p-6 text-white shadow-premium sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/58">Dashboard</p>
        <h1 className="mt-4 text-3xl font-black leading-tight text-balance sm:text-4xl">
          {hasPlan ? "Choose your next workout." : "Build your first adaptive plan."}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-white/72 sm:text-base">
          {hasPlan
            ? "Your active plan does not have a workout scheduled for today. Review your plan or choose a workout deliberately."
            : "Create a structured program before your dashboard fills in with today, your week, and progression signals."}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href={(hasPlan ? "/plans" : "/plans/new") as Route}
            className="ui-button-primary inline-flex justify-center focus-visible:ring-white focus-visible:ring-offset-hero"
          >
            {hasPlan ? "View plan" : "Create a plan"}
          </Link>
          {hasPlan ? (
            <Link
              href="/workout"
              className="rounded-full border border-white/20 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-hero"
            >
              Choose workout
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function TodayTrainingCard({ workout }: { workout: WorkoutTemplate }) {
  const supportingLine = workout.summary || workout.focus || `${workout.exercises.length} exercises planned`;
  const readinessWarning =
    workout.readiness === "Review"
      ? "Review your last check-in before pushing harder."
      : workout.readiness === "Monitor"
        ? "Take it easier today if that last workout still feels heavy."
        : null;

  return (
    <section className="rounded-[28px] bg-hero p-5 text-white shadow-premium sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/58">Today&apos;s training</p>
      <div className="mt-3 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="min-w-0">
          <h1 className="text-2xl font-black leading-tight text-balance sm:text-3xl">{workout.name}</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/72">{supportingLine}</p>
          {readinessWarning ? (
            <p className="mt-3 max-w-2xl rounded-2xl border border-warning/35 bg-warning/15 px-4 py-3 text-sm font-semibold leading-6 text-white">
              {readinessWarning}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
          <Link
            href={`/workout?workoutId=${workout.id}` as Route}
            className="ui-button-primary inline-flex justify-center focus-visible:ring-white focus-visible:ring-offset-hero"
          >
            Start workout
          </Link>
          <Link
            href={`/workout?workoutId=${workout.id}&step=check-in` as Route}
            className="rounded-full border border-white/20 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-hero"
          >
            Log past workout
          </Link>
        </div>
      </div>
    </section>
  );
}

function WeekPreview({
  days,
  activity
}: {
  days: DashboardWeekPreviewItem[];
  activity: DashboardActivitySummary;
}) {
  const completedKeys = new Set(
    activity.days.filter((day) => day.completed).map((day) => day.key)
  );

  return (
    <SurfaceCard>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="ui-eyebrow">This week</p>
          <h2 className="mt-1 text-xl font-black leading-tight text-copy">Training rhythm</h2>
        </div>
        <span className="rounded-full bg-surface-soft px-3 py-1.5 text-xs font-bold text-muted">5 days</span>
      </div>
      <div className="mt-4 grid gap-2">
        {days.map((day) => {
          const completed = completedKeys.has(day.key);
          const status = completed
            ? "Completed"
            : day.isToday
              ? "Today"
              : day.tone === "rest"
                ? "Open/rest"
                : "Upcoming";

          return (
            <div
              key={day.key}
              className={clsx(
                "grid grid-cols-[3rem_minmax(0,1fr)_6.5rem] items-center gap-3 rounded-2xl border px-3 py-2.5",
                day.isToday ? "border-primary/40 bg-primary/10" : "border-border bg-surface-soft"
              )}
            >
              <div>
                <p className="text-sm font-black text-copy">{day.weekdayLabel}</p>
                <p className="text-[11px] font-semibold text-muted">{day.isToday ? "Today" : day.dateLabel}</p>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-copy">{day.workoutName}</p>
              </div>
              <div className="flex items-center justify-end gap-2 text-right">
                <WeekStatusDot completed={completed} day={day} />
                <span className="text-xs font-bold text-muted">{status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </SurfaceCard>
  );
}

function CurrentPhaseCard({
  plan,
  progress,
  prompt
}: {
  plan: WorkoutPlan;
  progress: PhaseProgressSummary | null;
  prompt: DashboardProgressionPrompt | null;
}) {
  const percent = Math.min(100, Math.max(0, progress?.completionPercent ?? 0));
  const cleanSessions = progress?.cleanSessions ?? 0;
  const requiredSessions = progress?.requiredCleanSessions ?? 0;
  const status = prompt?.eyebrow ?? progress?.recommendation ?? "Progression";
  const canProgress = Boolean(progress?.canAdvance && prompt?.actionHref && prompt.actionLabel);

  return (
    <SurfaceCard>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="ui-eyebrow">Current phase</p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-copy">
            {formatPhaseLabel(plan.currentPhase.phaseNumber)}
          </h2>
        </div>
        <span className="rounded-full bg-primary/12 px-3 py-1.5 text-xs font-bold text-primary">
          {percent}%
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-muted">{plan.currentPhase.goal}</p>
      <div className="mt-6">
        <div className="h-3 overflow-hidden rounded-full bg-shell-elevated">
          <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
        </div>
        <div className="mt-3 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="font-semibold text-copy">
            {cleanSessions} / {requiredSessions} clean sessions
          </span>
          <span className="font-semibold text-muted">{status}</span>
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {canProgress ? (
          <Link href={prompt!.actionHref as Route} className="ui-button-primary inline-flex justify-center">
            {prompt!.actionLabel}
          </Link>
        ) : null}
        <Link
          href={`/plans/${plan.id}` as Route}
          className={clsx(
            "inline-flex justify-center",
            canProgress ? "ui-button-secondary" : "ui-button-primary"
          )}
        >
          {canProgress ? "Review plan" : "Review plan progress"}
        </Link>
      </div>
    </SurfaceCard>
  );
}

function ActivityCard({
  activity,
  painTrend,
  recentSessions
}: {
  activity: DashboardActivitySummary;
  painTrend: DashboardPainTrend | null;
  recentSessions: WorkoutSession[];
}) {
  return (
    <SurfaceCard>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="ui-eyebrow">Recent activity</p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-copy">
            {activity.streakLabel}
          </h2>
        </div>
        {painTrend ? (
          <span
            className={clsx(
              "rounded-full px-3 py-1.5 text-xs font-bold",
              painTrend.tone === "caution"
                ? "bg-warning/15 text-warning"
                : "bg-success/15 text-success"
            )}
          >
            {painTrend.label}
          </span>
        ) : null}
      </div>
      <div className="mt-6 grid min-w-0 grid-cols-7 gap-2">
        {activity.days.map((day) => (
          <div key={day.key} className="min-w-0 text-center">
            <div
              title={`${day.weekdayLabel}: ${
                day.completed ? "workout logged" : "no workout logged"
              }${day.painFlagged ? ", pain flagged" : ""}`}
              className={clsx(
                "mx-auto flex h-10 w-full max-w-10 items-center justify-center rounded-2xl border",
                day.painFlagged
                  ? "border-warning bg-warning/18"
                  : day.completed
                    ? "border-success bg-success/20"
                    : day.isToday
                      ? "border-primary bg-primary/12"
                      : "border-border bg-surface-soft"
              )}
            >
              <span className="sr-only">
                {day.completed ? "Workout logged" : "No workout logged"}
                {day.painFlagged ? ", pain flagged" : ""}
              </span>
              <span
                className={clsx(
                  "h-2.5 w-2.5 rounded-full",
                  day.painFlagged
                    ? "bg-warning"
                    : day.completed
                      ? "bg-success"
                      : day.isToday
                        ? "bg-primary"
                        : "bg-border"
                )}
                aria-hidden="true"
              />
            </div>
            <p className="mt-2 truncate text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
              {day.weekdayLabel}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-5 text-sm leading-6 text-muted">
        {painTrend?.detail ?? "No recent pain flags."}
      </p>
      <div className="mt-6 grid gap-3">
        {recentSessions.length > 0 ? (
          recentSessions.slice(0, 3).map((session) => (
            <div key={session.id} className="rounded-[20px] border border-border bg-surface-soft p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-black text-copy">{session.workoutNameSnapshot}</p>
                  <p className="mt-1 font-semibold text-muted">{formatDisplayDate(session.completedOn)}</p>
                </div>
                <span className="shrink-0 rounded-full bg-surface px-2.5 py-1 text-xs font-bold text-muted">
                  {session.status ?? (session.completed ? "Completed" : "Partial")}
                </span>
              </div>
              <p className="mt-2 font-semibold leading-6 text-muted">
                {session.metrics?.summary ?? session.recommendation}
              </p>
            </div>
          ))
        ) : (
          <p className="rounded-[20px] border border-dashed border-border bg-surface-soft p-3 text-sm font-semibold text-muted">
            Complete your first workout to see training history here.
          </p>
        )}
      </div>
    </SurfaceCard>
  );
}

function WeekStatusDot({
  completed,
  day
}: {
  completed: boolean;
  day: DashboardWeekPreviewItem;
}) {
  return (
    <span
      className={clsx(
        "h-3 w-3 shrink-0 rounded-full border",
        completed && "border-success bg-success",
        !completed && day.isToday && "border-primary bg-primary",
        !completed && !day.isToday && day.tone === "workout" && "border-secondary bg-secondary",
        !completed && !day.isToday && day.tone === "fallback" && "border-warning bg-warning",
        !completed && !day.isToday && day.tone === "rest" && "border-border bg-surface"
      )}
      aria-hidden="true"
    />
  );
}
