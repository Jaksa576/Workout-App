import Link from "next/link";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { SectionCard } from "@/components/section-card";
import { getDashboardData, getProfile } from "@/lib/data";
import { ProgressBadge } from "@/components/progress-badge";

export default async function HomePage() {
  const [dashboard, profile] = await Promise.all([getDashboardData(), getProfile()]);
  const activePlan = dashboard.activePlan;
  const nextWorkout = dashboard.todayWorkout;
  const exerciseCount = nextWorkout?.exercises.length ?? 0;
  const exerciseLabel = exerciseCount === 1 ? "1 exercise" : `${exerciseCount} exercises`;

  if (!profile?.onboardingCompletedAt || !activePlan || !nextWorkout) {
    redirect("/onboarding" as Route);
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="rounded-[24px] bg-ink px-5 py-6 text-white shadow-card sm:rounded-[32px] sm:px-7 sm:py-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/65">
          Your plan for today
        </p>
        <h1 className="mt-3 max-w-2xl font-display text-3xl leading-tight text-balance sm:text-4xl">
          Next up: {nextWorkout.name}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/78">
          Phase {activePlan.currentPhase.phaseNumber}: {activePlan.currentPhase.goal}
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href={`/workout?workoutId=${nextWorkout.id}` as Route}
            className="rounded-full bg-coral px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#f95a2b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            Start Session
          </Link>
          <Link
            href="/plans"
            className="rounded-full border border-white/20 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            View My Plans
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title={nextWorkout.name}
          eyebrow="Next session"
          description={nextWorkout.summary}
        >
          <div className="space-y-5">
            <div className="rounded-[28px] border border-ink/5 bg-white/75 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate">
                    {nextWorkout.focus}
                  </p>
                  <p className="mt-2 text-xl font-semibold text-ink">
                    Ready when you are
                  </p>
                </div>
                <ProgressBadge
                  label={nextWorkout.readiness}
                  tone={nextWorkout.readiness === "Review" ? "gold" : "green"}
                />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-mist px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                    Exercises
                  </p>
                  <p className="mt-1 text-lg font-semibold text-ink">{exerciseLabel}</p>
                </div>
                <div className="rounded-2xl bg-mist px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                    Status
                  </p>
                  <p className="mt-1 text-lg font-semibold text-ink">
                    {nextWorkout.readiness}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={`/workout?workoutId=${nextWorkout.id}` as Route}
                className="inline-flex justify-center rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#f95a2b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-mist"
              >
                Start Session
              </Link>
              <Link
                href={`/workout?workoutId=${nextWorkout.id}&step=check-in` as Route}
                className="inline-flex justify-center rounded-full border border-ink/10 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-coral hover:text-coral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-mist"
              >
                Log Past Workout
              </Link>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title={activePlan.name}
          eyebrow="Current plan"
          description={activePlan.description}
        >
          <div className="space-y-3">
            <div className="rounded-[28px] bg-white/75 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate">
                Active phase
              </p>
              <p className="mt-2 text-lg font-semibold text-ink">
                Phase {activePlan.currentPhase.phaseNumber}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate">
                {activePlan.currentPhase.goal}
              </p>
              {dashboard.phaseProgress ? (
                <div className="mt-4">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <p className="font-semibold text-ink">Phase progress</p>
                    <p className="font-semibold text-ink">
                      {dashboard.phaseProgress.completionPercent}%
                    </p>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-mist">
                    <div
                      className="h-full rounded-full bg-coral"
                      style={{ width: `${dashboard.phaseProgress.completionPercent}%` }}
                    />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate">
                    {dashboard.phaseProgress.cleanSessions} of{" "}
                    {dashboard.phaseProgress.requiredCleanSessions} clean sessions,{" "}
                    {dashboard.phaseProgress.painFlags}{" "}
                    {dashboard.phaseProgress.painFlags === 1 ? "pain flag" : "pain flags"}.
                  </p>
                </div>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[28px] bg-white/75 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate">
                  Progress when
                </p>
                <p className="mt-2 text-sm leading-6 text-ink">
                  {activePlan.currentPhase.advanceCriteria}
                </p>
              </div>
              <div className="rounded-[28px] bg-white/75 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate">
                  Pause when
                </p>
                <p className="mt-2 text-sm leading-6 text-ink">
                  {activePlan.currentPhase.deloadCriteria}
                </p>
              </div>
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {dashboard.metrics.map((metric) => (
          <section
            key={metric.label}
            className="rounded-[28px] border border-white/70 bg-[#fffdf9]/85 p-5 shadow-card backdrop-blur"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate">
              {metric.label}
            </p>
            <p className="mt-3 text-2xl font-semibold text-ink">{metric.value}</p>
            <p className="mt-2 text-sm leading-6 text-slate">{metric.detail}</p>
          </section>
        ))}
      </section>
    </div>
  );
}
