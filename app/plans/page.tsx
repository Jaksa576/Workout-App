import Link from "next/link";
import type { Route } from "next";
import { SectionCard } from "@/components/section-card";
import { getPlans } from "@/lib/data";
import { ProgressBadge } from "@/components/progress-badge";
import { PlanListActions } from "@/components/plan-list-actions";
import { formatPhaseLabel } from "@/lib/plan-labels";

export default async function PlansPage() {
  const plans = await getPlans();

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="ui-eyebrow">
            My Workout Plans
          </p>
          <h1 className="mt-2 font-display text-3xl leading-tight text-copy sm:text-4xl">
            Choose your active plan.
          </h1>
        </div>
        <Link
          href="/plans/new"
          className="rounded-full bg-coral px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#f95a2b]"
        >
          Create Plan
        </Link>
      </section>

      {plans.length === 0 ? (
        <SectionCard
          title="No plans yet"
          eyebrow="Start here"
          description="Create one plan to start training."
        >
          <Link
            href="/plans/new"
            className="inline-flex justify-center rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#f95a2b]"
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
              eyebrow={plan.completedAt ? "Completed plan" : plan.isActive ? "Active plan" : "Saved plan"}
              description={plan.description}
            >
            <div className="flex flex-wrap items-center gap-3">
              <ProgressBadge
                label={
                  plan.completedAt
                    ? "Completed"
                    : formatPhaseLabel(plan.currentPhase.phaseNumber)
                }
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
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={`/plans/${plan.id}` as Route}
                className="rounded-full border border-ink/10 bg-white px-5 py-3 text-center text-sm font-semibold text-ink transition hover:border-coral hover:text-coral"
              >
                View Plan
              </Link>
              <PlanListActions
                planId={plan.id}
                isActive={plan.isActive}
                completedAt={plan.completedAt}
              />
            </div>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}
