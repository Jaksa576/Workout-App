import Link from "next/link";
import type { Route } from "next";
import clsx from "clsx";
import { ProgressBadge } from "@/components/progress-badge";
import { SurfaceCard } from "@/components/surface-card";
import { PlanListActions } from "@/components/plan-list-actions";
import { getPlans } from "@/lib/data";
import { formatPhaseLabel } from "@/lib/plan-labels";
import type { WorkoutPlan } from "@/lib/types";

export default async function PlansPage() {
  const plans = await getPlans();
  const activePlan = plans.find((plan) => plan.isActive && !plan.completedAt) ?? null;
  const savedPlans = activePlan
    ? plans.filter((plan) => plan.id !== activePlan.id)
    : plans;

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="overflow-hidden rounded-[30px] bg-hero p-5 text-white shadow-premium sm:rounded-[36px] sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/58">
              Plans
            </p>
            <h1 className="mt-4 text-3xl font-black leading-tight text-balance sm:text-4xl">
              Your structured training library.
            </h1>
            <p className="mt-4 text-sm leading-6 text-white/72 sm:text-base">
              Keep one plan active and review phase structure before you train.
            </p>
          </div>
          <Link
            href="/plans/new"
            className="ui-button-primary inline-flex justify-center focus-visible:ring-white focus-visible:ring-offset-hero"
          >
            Create plan
          </Link>
        </div>
      </section>

      {plans.length === 0 ? (
        <EmptyPlansState />
      ) : (
        <>
          {activePlan ? <ActivePlanSpotlight plan={activePlan} /> : null}

          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="ui-eyebrow">Saved plans</p>
                <h2 className="mt-2 text-2xl font-black leading-tight text-copy">
                  {savedPlans.length === 0 ? "No other saved plans" : "Plan archive"}
                </h2>
              </div>
              <p className="text-sm font-semibold text-muted">
                {plans.length} {plans.length === 1 ? "plan" : "plans"} total
              </p>
            </div>

            {savedPlans.length === 0 ? (
              <SurfaceCard>
                <p className="text-sm leading-6 text-muted">
                  Your active plan is the only saved plan. Create another when your goals change.
                </p>
              </SurfaceCard>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {savedPlans.map((plan) => (
                  <PlanSummaryCard key={plan.id} plan={plan} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function EmptyPlansState() {
  return (
    <SurfaceCard className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        <p className="ui-eyebrow">Start here</p>
        <h2 className="mt-2 text-2xl font-black leading-tight text-copy sm:text-3xl">
          Create your first phase-based plan.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Plans organize your goal, rhythm, phases, workouts, and progression rules.
        </p>
        <Link href="/plans/new" className="ui-button-primary mt-6 inline-flex justify-center">
          Create your first plan
        </Link>
      </div>
      <div className="rounded-[24px] border border-border bg-surface-soft p-4">
        <p className="text-sm font-black text-copy">A plan gives you</p>
        <div className="mt-4 grid gap-3">
          {["A current phase", "Planned workouts", "Progression rules"].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-2xl bg-surface px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              <span className="text-sm font-semibold text-copy">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </SurfaceCard>
  );
}

function ActivePlanSpotlight({ plan }: { plan: WorkoutPlan }) {
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <SurfaceCard className="border-primary/25 bg-primary/8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <ProgressBadge label="Active plan" tone="green" />
              <ProgressBadge label={formatPhaseLabel(plan.currentPhase.phaseNumber)} tone="ink" />
            </div>
            <h2 className="mt-4 text-2xl font-black leading-tight text-copy sm:text-4xl">
              {plan.name}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">{plan.description}</p>
          </div>
          <Link
            href={`/plans/${plan.id}` as Route}
            className="ui-button-primary inline-flex shrink-0 justify-center"
          >
            Open active plan
          </Link>
        </div>
      </SurfaceCard>

      <SurfaceCard className="h-full">
        <p className="ui-eyebrow">Current phase</p>
        <h3 className="mt-2 text-xl font-black leading-tight text-copy">
          {plan.currentPhase.goal}
        </h3>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <PlanStat label="Phases" value={String(plan.phases.length)} />
          <PlanStat label="Workouts" value={String(plan.workouts.length)} />
        </div>
        <p className="mt-4 text-sm leading-6 text-muted">{plan.scheduleSummary}</p>
      </SurfaceCard>
    </section>
  );
}

function PlanSummaryCard({ plan }: { plan: WorkoutPlan }) {
  const status = plan.completedAt ? "Completed" : plan.isActive ? "Active" : "Saved";

  return (
    <SurfaceCard>
      <div className="flex h-full flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <ProgressBadge
            label={status}
            tone={plan.completedAt ? "gold" : plan.isActive ? "green" : "blue"}
          />
          <ProgressBadge
            label={formatPhaseLabel(plan.currentPhase.phaseNumber)}
            tone="ink"
          />
        </div>

        <h3 className="mt-4 text-xl font-black leading-tight text-copy">{plan.name}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{plan.description}</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <PlanFact label="Phase" value={plan.currentPhase.goal} />
          <PlanFact label="Advance" value={plan.currentPhase.advanceCriteria} />
          <PlanFact label="Rhythm" value={plan.scheduleSummary} />
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href={`/plans/${plan.id}` as Route}
            className="ui-button-secondary inline-flex justify-center"
          >
            View plan
          </Link>
          <PlanListActions
            planId={plan.id}
            isActive={plan.isActive}
            completedAt={plan.completedAt}
          />
        </div>
      </div>
    </SurfaceCard>
  );
}

function PlanFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-soft p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-copy">{value}</p>
    </div>
  );
}

function PlanStat({ label, value }: { label: string; value: string }) {
  return (
    <div className={clsx("rounded-2xl border border-border bg-surface-soft p-3")}>
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-2 text-2xl font-black text-copy">{value}</p>
    </div>
  );
}
