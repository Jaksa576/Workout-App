import Link from "next/link";
import { SectionCard } from "@/components/section-card";
import { getDashboardData } from "@/lib/data";
import { ProgressBadge } from "@/components/progress-badge";

export default async function HomePage() {
  const dashboard = await getDashboardData();
  const activePlan = dashboard.activePlan;
  const nextWorkout = dashboard.todayWorkout;

  if (!activePlan || !nextWorkout) {
    return (
      <div className="space-y-6">
        <section className="rounded-[32px] bg-ink px-6 py-8 text-white shadow-card">
          <p className="text-sm uppercase tracking-[0.24em] text-white/70">
            Workout App
          </p>
          <h1 className="mt-3 max-w-xl font-display text-4xl leading-tight text-balance sm:text-5xl">
            Let&apos;s build your first workout plan.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/78 sm:text-base">
            Add one repeatable workout, set simple progression rules, and start
            tracking your sessions.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/plans/new"
              className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#f95a2b]"
            >
              Create My First Plan
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {dashboard.metrics.map((metric) => (
            <SectionCard
              key={metric.label}
              title={metric.value}
              eyebrow={metric.label}
              compact
            >
              <p className="text-sm leading-6 text-slate">{metric.detail}</p>
            </SectionCard>
          ))}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] bg-ink px-6 py-8 text-white shadow-card">
        <p className="text-sm uppercase tracking-[0.24em] text-white/70">
          Workout App
        </p>
        <h1 className="mt-3 max-w-xl font-display text-4xl leading-tight text-balance sm:text-5xl">
          Build a plan you can actually follow on your phone.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-white/78 sm:text-base">
          Keep today&apos;s workout, phase goals, and progression decisions in one
          place.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/today"
            className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#f95a2b]"
          >
            Start Today&apos;s Workout
          </Link>
          <Link
            href="/plans"
            className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            View My Plans
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <SectionCard
          title={activePlan.name}
          eyebrow="Current plan"
          description={activePlan.description}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate">
                Active phase
              </p>
              <p className="mt-3 text-lg font-semibold text-ink">
                Phase {activePlan.currentPhase.phaseNumber}
              </p>
              <p className="mt-1 text-sm text-slate">
                {activePlan.currentPhase.goal}
              </p>
            </div>
            <div className="rounded-3xl bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate">
                Advance when
              </p>
              <p className="mt-3 text-sm leading-6 text-ink">
                {activePlan.currentPhase.advanceCriteria}
              </p>
            </div>
            <div className="rounded-3xl bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate">
                Deload signal
              </p>
              <p className="mt-3 text-sm leading-6 text-ink">
                {activePlan.currentPhase.deloadCriteria}
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Today at a glance"
          eyebrow="Session"
          description="Start the workout, use the rest timer, and log how your body responded."
        >
          <div className="space-y-4">
            <div className="rounded-3xl bg-white/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-ink">
                    {nextWorkout.name}
                  </p>
                  <p className="mt-1 text-sm text-slate">
                    {nextWorkout.focus}
                  </p>
                </div>
                <ProgressBadge label={nextWorkout.readiness} tone="green" />
              </div>
              <p className="mt-4 text-sm leading-6 text-ink">
                {nextWorkout.summary}
              </p>
            </div>
            <a
              href={`/check-in?workoutId=${nextWorkout.id}`}
              className="inline-flex rounded-full border border-ink/10 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-coral hover:text-coral"
            >
              Log Workout
            </a>
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {dashboard.metrics.map((metric) => (
          <SectionCard
            key={metric.label}
            title={metric.value}
            eyebrow={metric.label}
            compact
          >
            <p className="text-sm leading-6 text-slate">{metric.detail}</p>
          </SectionCard>
        ))}
      </section>
    </div>
  );
}
