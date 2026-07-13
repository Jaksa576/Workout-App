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
  WorkoutTemplate
} from "@/lib/types";

type AttentionItem = {
  tone: "ready" | "caution" | "complete";
  title: string;
  detail: string;
  actionLabel: string;
  actionHref: string;
};

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

  const attention = getAttentionItem({
    plan: activePlan,
    prompt: dashboard.progressionPrompt,
    painTrend: dashboard.painTrend,
    workout: nextWorkout
  });

  return (
    <div className="mx-auto max-w-5xl space-y-4 sm:space-y-5">
      <TodayTrainingCard workout={nextWorkout} />
      {attention ? <AttentionCard item={attention} /> : null}
      <WeekPreview days={dashboard.weekPreview} activity={dashboard.activitySummary} />
      <ProgressSummary
        plan={activePlan}
        activity={dashboard.activitySummary}
        progress={dashboard.phaseProgress}
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

  return (
    <section className="rounded-[28px] bg-hero p-5 text-white shadow-premium sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/58">Today&apos;s training</p>
      <div className="mt-3 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="min-w-0">
          <h1 className="text-2xl font-black leading-tight text-balance sm:text-3xl">{workout.name}</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/72">{supportingLine}</p>
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

function getAttentionItem({
  plan,
  prompt,
  painTrend,
  workout
}: {
  plan: WorkoutPlan;
  prompt: DashboardProgressionPrompt | null;
  painTrend: DashboardPainTrend | null;
  workout: WorkoutTemplate;
}): AttentionItem | null {
  if (painTrend?.tone === "caution") {
    return {
      tone: "caution",
      title: "Review readiness before pushing today.",
      detail: painTrend.detail,
      actionLabel: "Review readiness",
      actionHref: `/workout?workoutId=${workout.id}`
    };
  }

  if (!prompt) {
    return null;
  }

  if (prompt.actionHref && prompt.actionLabel) {
    return {
      tone: prompt.tone === "complete" ? "complete" : prompt.tone === "ready" ? "ready" : "caution",
      title: prompt.title,
      detail: prompt.detail,
      actionLabel: prompt.actionLabel,
      actionHref: prompt.actionHref
    };
  }

  if (prompt.tone === "caution") {
    return {
      tone: "caution",
      title: prompt.title,
      detail: prompt.detail,
      actionLabel: "View plan",
      actionHref: `/plans/${plan.id}`
    };
  }

  return null;
}

function AttentionCard({ item }: { item: AttentionItem }) {
  return (
    <SurfaceCard
      className={clsx(
        "border-l-4",
        item.tone === "caution" && "border-l-warning",
        item.tone === "ready" && "border-l-success",
        item.tone === "complete" && "border-l-primary"
      )}
    >
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div>
          <p className="ui-eyebrow">Needs attention</p>
          <h2 className="mt-2 text-xl font-black leading-tight text-copy">{item.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{item.detail}</p>
        </div>
        <Link href={item.actionHref as Route} className="ui-button-primary inline-flex justify-center">
          {item.actionLabel}
        </Link>
      </div>
    </SurfaceCard>
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

function ProgressSummary({
  plan,
  activity,
  progress
}: {
  plan: WorkoutPlan;
  activity: DashboardActivitySummary;
  progress: PhaseProgressSummary | null;
}) {
  const phaseLabel = formatPhaseLabel(plan.currentPhase.phaseNumber);
  const progressLabel = progress ? `${progress.completionPercent}% phase progress` : "Progress unavailable";
  const cleanSessionLabel = progress
    ? `${progress.cleanSessions}/${progress.requiredCleanSessions} clean sessions`
    : "Keep logging workouts to rebuild this signal.";

  return (
    <SurfaceCard>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div>
          <p className="ui-eyebrow">Progress summary</p>
          <h2 className="mt-2 text-xl font-black leading-tight text-copy">
            {activity.streakLabel} this week
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {phaseLabel} · {progressLabel} · {cleanSessionLabel}
          </p>
        </div>
        <Link href={`/plans/${plan.id}` as Route} className="ui-button-secondary inline-flex justify-center">
          Review plan
        </Link>
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
