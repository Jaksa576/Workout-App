import Link from "next/link";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { SectionCard } from "@/components/section-card";
import { getDashboardData, getProfile } from "@/lib/data";
import { formatPhaseLabel } from "@/lib/plan-labels";

export default async function HomePage() {
  const [dashboard, profile] = await Promise.all([getDashboardData(), getProfile()]);
  const activePlan = dashboard.activePlan;
  const nextWorkout = dashboard.todayWorkout;
  const progressPrompt = dashboard.progressionPrompt;
  const exerciseCount = nextWorkout?.exercises.length ?? 0;
  const exerciseLabel = exerciseCount === 1 ? "1 exercise" : `${exerciseCount} exercises`;
  const readinessWarning =
    nextWorkout?.readiness === "Review"
      ? "Review your last check-in before pushing harder."
      : nextWorkout?.readiness === "Monitor"
        ? "Take it easier today if that last workout still feels heavy."
        : null;

  if (!profile?.onboardingCompletedAt) {
    redirect("/onboarding" as Route);
  }

  if (!activePlan || !nextWorkout) {
    redirect("/plans/new" as Route);
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[24px] bg-hero px-5 py-6 text-white shadow-card sm:rounded-[32px] sm:px-7 sm:py-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/65">
            Your workout for today
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-3xl leading-tight text-balance sm:text-4xl">
            {nextWorkout.name}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/78">
            {nextWorkout.focus} - {exerciseLabel}
          </p>
          {readinessWarning ? (
            <p className="mt-4 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm leading-6 text-white/88">
              {readinessWarning}
            </p>
          ) : null}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={`/workout?workoutId=${nextWorkout.id}` as Route}
              className="ui-button-primary text-center focus-visible:ring-white focus-visible:ring-offset-hero"
            >
              Start workout
            </Link>
            <Link
              href={`/workout?workoutId=${nextWorkout.id}&step=check-in` as Route}
              className="rounded-full border border-white/20 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-hero"
            >
              Log past workout
            </Link>
          </div>
        </section>

        <SectionCard title="This week" eyebrow="Up next" compact>
          <div className="grid gap-2">
            {dashboard.weekPreview.map((day) => (
              <div
                key={day.key}
                className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-[16px] border border-border bg-surface-soft px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-copy">{day.weekdayLabel}</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-copy">
                    {day.workoutName}
                  </p>
                  <p className="truncate text-xs text-muted">{day.detail}</p>
                </div>
                <div className="shrink-0 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold leading-none text-muted whitespace-nowrap">
                  {day.isToday ? "Today" : day.dateLabel}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="space-y-3">
        <div>
          <p className="ui-eyebrow">Keep the streak going</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title="How you're doing" compact>
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-copy">
                  {dashboard.activitySummary.streakLabel}
                </p>
                {dashboard.painTrend ? (
                  <p
                    className={
                      dashboard.painTrend.tone === "caution"
                        ? "text-xs font-semibold text-warning"
                        : "text-xs font-semibold text-success"
                    }
                  >
                    {dashboard.painTrend.label}
                  </p>
                ) : null}
              </div>
              <div className="mt-3 grid grid-cols-7 gap-2">
                {dashboard.activitySummary.days.map((day) => (
                  <div key={day.key} className="text-center">
                    <div
                      title={`${day.weekdayLabel}: ${
                        day.completed ? "workout logged" : "no workout logged"
                      }${day.painFlagged ? ", pain flagged" : ""}`}
                      className={
                        day.painFlagged
                          ? "mx-auto h-8 w-8 rounded-full border border-warning bg-warning/20"
                          : day.completed
                            ? "mx-auto h-8 w-8 rounded-full border border-success bg-success/30"
                            : day.isToday
                              ? "mx-auto h-8 w-8 rounded-full border border-accent bg-accent/10"
                              : "mx-auto h-8 w-8 rounded-full border border-border bg-surface-soft"
                      }
                    />
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                      {day.weekdayLabel}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {dashboard.phaseProgress ? (
              <div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <p className="font-semibold text-copy">
                    {formatPhaseLabel(activePlan.currentPhase.phaseNumber)}
                  </p>
                  <p className="font-semibold text-copy">
                    {dashboard.phaseProgress.completionPercent}%
                  </p>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-shell-elevated">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${dashboard.phaseProgress.completionPercent}%` }}
                  />
                </div>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {dashboard.phaseProgress.cleanSessions} of{" "}
                  {dashboard.phaseProgress.requiredCleanSessions} clean sessions.
                </p>
              </div>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard
          title={progressPrompt?.title ?? "Keep moving"}
          eyebrow="Next step"
          compact
        >
          <div className="space-y-4">
            <p className="text-sm leading-6 text-muted">
              {progressPrompt?.detail ?? activePlan.currentPhase.goal}
            </p>
            {progressPrompt?.actionHref && progressPrompt.actionLabel ? (
              <Link
                href={progressPrompt.actionHref as Route}
                className="ui-button-primary inline-flex w-full justify-center sm:w-auto"
              >
                {progressPrompt.actionLabel}
              </Link>
            ) : (
              <Link
                href={`/workout?workoutId=${nextWorkout.id}` as Route}
                className="ui-button-secondary inline-flex w-full justify-center sm:w-auto"
              >
                Start next workout
              </Link>
            )}
            <div className="rounded-[20px] border border-border bg-surface-soft px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Current plan
              </p>
              <p className="mt-2 text-sm font-semibold text-copy">{activePlan.name}</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                {activePlan.currentPhase.goal}
              </p>
            </div>
          </div>
        </SectionCard>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {dashboard.metrics.map((metric) => (
          <section
            key={metric.label}
            className="surface-card p-5"
          >
            <p className="ui-eyebrow">{metric.label}</p>
            <p className="mt-3 text-2xl font-semibold text-copy">{metric.value}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{metric.detail}</p>
          </section>
        ))}
      </section>
    </div>
  );
}
