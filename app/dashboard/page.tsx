import Link from "next/link";
import { redirect } from "next/navigation";
import type { Route } from "next";
import clsx from "clsx";
import { MetricCard } from "@/components/metric-card";
import { SurfaceCard } from "@/components/surface-card";
import { getDashboardData, getProfile } from "@/lib/data";
import { formatPhaseLabel } from "@/lib/plan-labels";
import type {
  DashboardActivitySummary,
  DashboardPainTrend,
  DashboardProgressionPrompt,
  DashboardWeekPreviewItem,
  PhaseProgressSummary,
  TrainingGoalType,
  WorkoutPlan,
  WorkoutTemplate
} from "@/lib/types";

const goalLabels: Record<TrainingGoalType, string> = {
  recovery: "Recovery",
  general_fitness: "General fitness",
  strength: "Strength",
  hypertrophy: "Hypertrophy",
  running: "Running",
  sport_performance: "Sport performance",
  consistency: "Consistency"
};

export default async function DashboardPage() {
  const [dashboard, profile] = await Promise.all([getDashboardData(), getProfile()]);
  const activePlan = dashboard.activePlan;
  const nextWorkout = dashboard.todayWorkout;
  const progressPrompt = dashboard.progressionPrompt;

  if (!profile?.onboardingCompletedAt) {
    redirect("/onboarding" as Route);
  }

  if (!activePlan || !nextWorkout) {
    return <DashboardEmptyState hasPlan={Boolean(activePlan)} />;
  }

  const exerciseCount = nextWorkout.exercises.length;
  const exerciseLabel = exerciseCount === 1 ? "1 exercise" : `${exerciseCount} exercises`;
  const phaseLabel = formatPhaseLabel(activePlan.currentPhase.phaseNumber);
  const goalLabel = activePlan.goalType ? goalLabels[activePlan.goalType] : "Adaptive training";
  const readinessWarning =
    nextWorkout.readiness === "Review"
      ? "Review your last check-in before pushing harder."
      : nextWorkout.readiness === "Monitor"
        ? "Take it easier today if that last workout still feels heavy."
        : null;

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.7fr)]">
        <TodayWorkoutHero
          workout={nextWorkout}
          exerciseLabel={exerciseLabel}
          phaseLabel={phaseLabel}
          goalLabel={goalLabel}
          readinessWarning={readinessWarning}
        />
        <PhaseProgressCard
          plan={activePlan}
          progress={dashboard.phaseProgress}
          prompt={progressPrompt}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <WeekPreview days={dashboard.weekPreview} />
        <NextStepCard
          plan={activePlan}
          workout={nextWorkout}
          prompt={progressPrompt}
          painTrend={dashboard.painTrend}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <ActivityCard activity={dashboard.activitySummary} painTrend={dashboard.painTrend} />
        <PlanSnapshot plan={activePlan} workout={nextWorkout} />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {dashboard.metrics.map((metric, index) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            detail={metric.detail}
            tone={index === 1 ? "secondary" : index === 2 ? "success" : "default"}
          />
        ))}
      </section>
    </div>
  );
}

function DashboardEmptyState({ hasPlan }: { hasPlan: boolean }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="rounded-[30px] bg-hero p-6 text-white shadow-premium sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/58">
          Dashboard
        </p>
        <h1 className="mt-4 max-w-2xl text-3xl font-black leading-tight text-balance sm:text-5xl">
          {hasPlan ? "Choose your next workout." : "Build your first adaptive plan."}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
          {hasPlan
            ? "Your active plan does not have an available workout for today. Review the plan structure to keep moving."
            : "Create a structured program with phases, workouts, and progression rules before your dashboard fills in."}
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link
            href={(hasPlan ? "/plans" : "/plans/new") as Route}
            className="ui-button-primary inline-flex justify-center focus-visible:ring-white focus-visible:ring-offset-hero"
          >
            {hasPlan ? "Review plans" : "Create a plan"}
          </Link>
          <Link
            href="/settings"
            className="rounded-full border border-white/20 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-hero"
          >
            Check profile
          </Link>
        </div>
      </section>

      <SurfaceCard className="flex h-full flex-col justify-between">
        <div>
          <p className="ui-eyebrow">What happens next</p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-copy">
            Your plan powers the dashboard.
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Once a plan is active, this page shows today&apos;s workout, current phase,
            weekly schedule, and progression guidance from your logged sessions.
          </p>
        </div>
        <div className="mt-6 grid gap-3">
          {["Create or activate a plan", "Log workouts", "Review progression"].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-2xl bg-surface-soft p-3">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              <span className="text-sm font-semibold text-copy">{item}</span>
            </div>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}

function TodayWorkoutHero({
  workout,
  exerciseLabel,
  phaseLabel,
  goalLabel,
  readinessWarning
}: {
  workout: WorkoutTemplate;
  exerciseLabel: string;
  phaseLabel: string;
  goalLabel: string;
  readinessWarning: string | null;
}) {
  return (
    <section className="overflow-hidden rounded-[30px] bg-hero text-white shadow-premium sm:rounded-[36px]">
      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_260px] lg:p-8">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="green">Today&apos;s training</Pill>
            <Pill tone="blue">{goalLabel}</Pill>
          </div>
          <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight text-balance sm:text-5xl">
            {workout.name}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/74">
            {workout.focus} - {exerciseLabel}
          </p>
          {workout.summary ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/58">{workout.summary}</p>
          ) : null}
          {readinessWarning ? (
            <div className="mt-5 rounded-2xl border border-goal-orange/35 bg-goal-orange/14 px-4 py-3 text-sm font-semibold leading-6 text-white">
              {readinessWarning}
            </div>
          ) : null}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <HeroStat label="Phase" value={phaseLabel} />
          <HeroStat label="Readiness" value={workout.readiness} />
          <HeroStat label="Workload" value={exerciseLabel} />
        </div>
      </div>
    </section>
  );
}

function PhaseProgressCard({
  plan,
  progress,
  prompt
}: {
  plan: WorkoutPlan;
  progress: PhaseProgressSummary | null;
  prompt: DashboardProgressionPrompt | null;
}) {
  const percent = progress?.completionPercent ?? 0;
  const cleanSessions = progress?.cleanSessions ?? 0;
  const requiredSessions = progress?.requiredCleanSessions ?? 0;

  return (
    <SurfaceCard className="h-full">
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
        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
          <span className="font-semibold text-copy">
            {cleanSessions} / {requiredSessions} clean sessions
          </span>
          <span className="font-semibold text-muted">{prompt?.eyebrow ?? "Progression"}</span>
        </div>
      </div>
      <Link
        href={`/plans/${plan.id}` as Route}
        className="ui-button-secondary mt-6 inline-flex w-full justify-center"
      >
        Review plan progress
      </Link>
    </SurfaceCard>
  );
}

function WeekPreview({ days }: { days: DashboardWeekPreviewItem[] }) {
  return (
    <SurfaceCard>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="ui-eyebrow">This week</p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-copy">Training rhythm</h2>
        </div>
        <span className="hidden rounded-full bg-surface-soft px-3 py-1.5 text-xs font-bold text-muted sm:inline-flex">
          5-day view
        </span>
      </div>
      <div className="mt-5 grid gap-3">
        {days.map((day) => (
          <div
            key={day.key}
            className={clsx(
              "grid grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-3 rounded-[20px] border px-3 py-3",
              day.isToday
                ? "border-primary/35 bg-primary/10"
                : day.tone === "workout"
                  ? "border-secondary/25 bg-secondary/8"
                  : "border-border bg-surface-soft"
            )}
          >
            <div className="text-center">
              <p className="text-sm font-black text-copy">{day.weekdayLabel}</p>
              <p className="mt-1 text-[11px] font-semibold text-muted">
                {day.isToday ? "Today" : day.dateLabel}
              </p>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-copy">{day.workoutName}</p>
              <p className="mt-1 truncate text-xs font-semibold text-muted">{day.detail}</p>
            </div>
            <WeekToneDot tone={day.tone} active={day.isToday} />
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}

function NextStepCard({
  plan,
  workout,
  prompt,
  painTrend
}: {
  plan: WorkoutPlan;
  workout: WorkoutTemplate;
  prompt: DashboardProgressionPrompt | null;
  painTrend: DashboardPainTrend | null;
}) {
  const tone = prompt?.tone ?? "steady";

  return (
    <SurfaceCard className="h-full">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={tone === "caution" ? "orange" : tone === "ready" ? "green" : "blue"}>
          {prompt?.eyebrow ?? "Next step"}
        </Pill>
        {painTrend ? (
          <Pill tone={painTrend.tone === "caution" ? "orange" : "green"}>
            {painTrend.label}
          </Pill>
        ) : null}
      </div>
      <h2 className="mt-4 text-2xl font-black leading-tight text-copy sm:text-3xl">
        {prompt?.title ?? "Keep building this phase."}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        {prompt?.detail ?? plan.currentPhase.goal}
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {prompt?.actionHref && prompt.actionLabel ? (
          <Link
            href={prompt.actionHref as Route}
            className="ui-button-primary inline-flex justify-center"
          >
            {prompt.actionLabel}
          </Link>
        ) : (
          <Link
            href={`/workout?workoutId=${workout.id}` as Route}
            className="ui-button-primary inline-flex justify-center"
          >
            Start next workout
          </Link>
        )}
        <Link
          href={`/plans/${plan.id}` as Route}
          className="ui-button-secondary inline-flex justify-center"
        >
          View plan
        </Link>
      </div>
    </SurfaceCard>
  );
}

function ActivityCard({
  activity,
  painTrend
}: {
  activity: DashboardActivitySummary;
  painTrend: DashboardPainTrend | null;
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
      <div className="mt-6 grid grid-cols-7 gap-2">
        {activity.days.map((day) => (
          <div key={day.key} className="text-center">
            <div
              title={`${day.weekdayLabel}: ${
                day.completed ? "workout logged" : "no workout logged"
              }${day.painFlagged ? ", pain flagged" : ""}`}
              className={clsx(
                "mx-auto flex h-10 w-10 items-center justify-center rounded-2xl border",
                day.painFlagged
                  ? "border-warning bg-warning/18"
                  : day.completed
                    ? "border-success bg-success/20"
                    : day.isToday
                      ? "border-primary bg-primary/12"
                      : "border-border bg-surface-soft"
              )}
            >
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
              />
            </div>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
              {day.weekdayLabel}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-5 text-sm leading-6 text-muted">
        {painTrend?.detail ?? "Log workouts to build a clearer weekly signal."}
      </p>
    </SurfaceCard>
  );
}

function PlanSnapshot({ plan, workout }: { plan: WorkoutPlan; workout: WorkoutTemplate }) {
  const exercises = workout.exercises.slice(0, 4);

  return (
    <SurfaceCard>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div>
          <p className="ui-eyebrow">Current plan</p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-copy">{plan.name}</h2>
          <p className="mt-3 text-sm leading-6 text-muted">{plan.description}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <PlanFact label="Schedule" value={plan.scheduleSummary} />
            <PlanFact label="Phase count" value={`${plan.phases.length} phases`} />
          </div>
        </div>
        <div className="rounded-[24px] border border-border bg-surface-soft p-4">
          <p className="text-sm font-black text-copy">In today&apos;s workout</p>
          <div className="mt-4 grid gap-2">
            {exercises.map((exercise) => (
              <div key={exercise.id} className="rounded-2xl bg-surface px-3 py-2">
                <p className="truncate text-sm font-bold text-copy">{exercise.name}</p>
                <p className="mt-1 text-xs font-semibold text-muted">
                  {exercise.sets} sets - {exercise.reps}
                </p>
              </div>
            ))}
          </div>
          {workout.exercises.length > exercises.length ? (
            <p className="mt-3 text-xs font-bold text-muted">
              + {workout.exercises.length - exercises.length} more in the workout
            </p>
          ) : null}
        </div>
      </div>
    </SurfaceCard>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.06] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/45">{label}</p>
      <p className="mt-2 text-base font-black leading-tight text-white">{value}</p>
    </div>
  );
}

function PlanFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-soft px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1 text-sm font-black text-copy">{value}</p>
    </div>
  );
}

function WeekToneDot({
  tone,
  active
}: {
  tone: DashboardWeekPreviewItem["tone"];
  active: boolean;
}) {
  return (
    <span
      className={clsx(
        "h-3 w-3 rounded-full",
        active
          ? "bg-primary"
          : tone === "workout"
            ? "bg-secondary"
            : tone === "fallback"
              ? "bg-warning"
              : "bg-border"
      )}
      aria-hidden="true"
    />
  );
}

function Pill({
  children,
  tone
}: {
  children: React.ReactNode;
  tone: "green" | "blue" | "orange";
}) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em]",
        tone === "green" && "bg-primary/14 text-primary",
        tone === "blue" && "bg-secondary/14 text-secondary",
        tone === "orange" && "bg-goal-orange/16 text-goal-orange"
      )}
    >
      {children}
    </span>
  );
}
