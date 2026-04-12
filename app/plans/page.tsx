import Link from "next/link";
import type { Route } from "next";
import { SectionCard } from "@/components/section-card";
import { getPlans } from "@/lib/data";
import { ProgressBadge } from "@/components/progress-badge";

export default async function PlansPage() {
  const plans = await getPlans();

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate">
            My Workout Plans
          </p>
          <h1 className="mt-2 font-display text-4xl text-ink">
            Choose a plan and keep your progress moving.
          </h1>
        </div>
        <Link
          href="/plans/new"
          className="rounded-full bg-coral px-5 py-3 text-center text-sm font-semibold text-white"
        >
          Create Plan
        </Link>
      </section>

      {plans.length === 0 ? (
        <SectionCard
          title="No plans yet"
          eyebrow="Start here"
          description="Create one plan with one phase and one workout to start training."
        >
          <Link
            href="/plans/new"
            className="inline-flex rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white"
          >
            Create your first plan
          </Link>
        </SectionCard>
      ) : (
      <div className="grid gap-4">
        {plans.map((plan) => (
          <SectionCard
            key={plan.id}
            title={plan.name}
            eyebrow={plan.isActive ? "Active plan" : "Saved plan"}
            description={plan.description}
          >
            <div className="flex flex-wrap items-center gap-3">
              <ProgressBadge
                label={`Phase ${plan.currentPhase.phaseNumber}`}
                tone="gold"
              />
              <ProgressBadge label={plan.currentPhase.goal} tone="green" />
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl bg-white/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate">
                  Advance when
                </p>
                <p className="mt-3 text-sm leading-6 text-ink">
                  {plan.currentPhase.advanceCriteria}
                </p>
              </div>
              <div className="rounded-3xl bg-white/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate">
                  Deload signal
                </p>
                <p className="mt-3 text-sm leading-6 text-ink">
                  {plan.currentPhase.deloadCriteria}
                </p>
              </div>
              <div className="rounded-3xl bg-white/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate">
                  Weekly rhythm
                </p>
                <p className="mt-3 text-sm leading-6 text-ink">
                  {plan.scheduleSummary}
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/plans/${plan.id}` as Route}
                className="rounded-full border border-ink/10 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-coral hover:text-coral"
              >
                View Plan
              </Link>
            </div>
          </SectionCard>
        ))}
      </div>
      )}
    </div>
  );
}
