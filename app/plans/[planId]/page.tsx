import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { ExerciseVideoLinkEditor } from "@/components/exercise-video-link-editor";
import { PhaseProgressPanel } from "@/components/phase-progress-panel";
import { PlanArchiveAction } from "@/components/plan-archive-action";
import { PlanPhaseCard } from "@/components/plan-phase-card";
import { SectionCard } from "@/components/section-card";
import { SurfaceCard } from "@/components/surface-card";
import { WorkoutChecklist } from "@/components/workout-checklist";
import { getPlanById, getWorkoutPageData } from "@/lib/data";
import { formatPhaseLabel } from "@/lib/plan-labels";
import type { WorkoutPlan, WorkoutTemplate } from "@/lib/types";

export default async function PlanDetailPage({
  params
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  const [plan, workoutData] = await Promise.all([
    getPlanById(planId),
    getWorkoutPageData()
  ]);

  if (!plan) {
    notFound();
  }

  const previewWorkout =
    plan.workouts.find((workout) => workout.phaseId === plan.currentPhase.id) ??
    plan.workouts[0] ??
    null;
  const activePhaseProgress =
    workoutData.activePlan?.id === plan.id ? workoutData.phaseProgress : null;

  return (
    <div className="space-y-5 sm:space-y-6">
      <PlanDetailHero plan={plan} />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <CurrentPhasePanel plan={plan} />
        {previewWorkout ? (
          <WorkoutPreviewCard workout={previewWorkout} />
        ) : (
          <SurfaceCard>
            <p className="ui-eyebrow">Workout detail</p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-copy">
              No workouts in this phase yet
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Once a workout is added, its exercises will appear here.
            </p>
          </SurfaceCard>
        )}
      </section>

      {activePhaseProgress ? (
        <PhaseProgressPanel plan={plan} progress={activePhaseProgress} mode="plan" />
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="ui-eyebrow">Plan structure</p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-copy sm:text-3xl">
              Phase-by-phase blueprint
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted">
            Current phase stays highlighted while upcoming work remains visible.
          </p>
        </div>
        {plan.phases.map((phase) => (
          <PlanPhaseCard
            key={phase.id}
            phase={phase}
            workouts={plan.workouts.filter((workout) => workout.phaseId === phase.id)}
            isCurrent={phase.id === plan.currentPhase.id}
            progress={
              activePhaseProgress && phase.id === activePhaseProgress.currentPhaseId
                ? activePhaseProgress
                : null
            }
          />
        ))}
      </section>

      {plan.workouts.length > 0 ? (
        <SectionCard
          title="Exercise video links"
          eyebrow="Demos"
          description="Add or update YouTube demo links without changing the plan structure."
        >
          <ExerciseVideoLinkEditor workouts={plan.workouts} />
        </SectionCard>
      ) : null}

      <section className="surface-card-soft p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="ui-eyebrow">Plan management</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Archive this plan to stop using it while keeping past workout history readable.
            </p>
          </div>
          <PlanArchiveAction planId={plan.id} planName={plan.name} />
        </div>
      </section>
    </div>
  );
}

function PlanDetailHero({ plan }: { plan: WorkoutPlan }) {
  return (
    <section className="overflow-hidden rounded-[30px] bg-hero p-5 text-white shadow-premium sm:rounded-[36px] sm:p-7">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <HeroBadge label={plan.isActive ? "Active plan" : "Saved plan"} />
            <HeroBadge label={formatPhaseLabel(plan.currentPhase.phaseNumber)} />
          </div>
          <h1 className="mt-5 max-w-4xl text-3xl font-black leading-tight text-balance sm:text-5xl">
            {plan.name}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/72">
            {plan.description}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={`/plans/${plan.id}/edit` as Route}
              className="ui-button-primary inline-flex justify-center focus-visible:ring-white focus-visible:ring-offset-hero"
            >
              Edit details
            </Link>
            <Link
              href="/plans"
              className="rounded-full border border-white/20 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-hero"
            >
              Back to plans
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <HeroStat label="Phases" value={String(plan.phases.length)} />
          <HeroStat label="Workouts" value={String(plan.workouts.length)} />
          <HeroStat label="Current" value={formatPhaseLabel(plan.currentPhase.phaseNumber)} />
        </div>
      </div>
    </section>
  );
}

function CurrentPhasePanel({ plan }: { plan: WorkoutPlan }) {
  return (
    <SurfaceCard>
      <p className="ui-eyebrow">Current phase rules</p>
      <h2 className="mt-2 text-2xl font-black leading-tight text-copy">
        {plan.currentPhase.goal}
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted">
        Use these signals to decide when to progress, repeat, or deload.
      </p>
      <div className="mt-5 grid gap-3">
        <RuleCard label="Advance when" value={plan.currentPhase.advanceCriteria} />
        <RuleCard label="Deload signal" value={plan.currentPhase.deloadCriteria} />
        <RuleCard label="Weekly rhythm" value={plan.scheduleSummary} />
      </div>
    </SurfaceCard>
  );
}

function WorkoutPreviewCard({ workout }: { workout: WorkoutTemplate }) {
  return (
    <SurfaceCard>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="ui-eyebrow">Workout preview</p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-copy">{workout.name}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{workout.focus}</p>
        </div>
        <span className="rounded-full bg-secondary/12 px-3 py-1.5 text-xs font-bold text-secondary">
          {workout.exercises.length}{" "}
          {workout.exercises.length === 1 ? "exercise" : "exercises"}
        </span>
      </div>
      <div className="mt-5">
        <WorkoutChecklist workout={workout} />
      </div>
    </SurfaceCard>
  );
}

function HeroBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-white">
      {label}
    </span>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.06] p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/45">
        {label}
      </p>
      <p className="mt-2 text-lg font-black leading-tight text-white">{value}</p>
    </div>
  );
}

function RuleCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-border bg-surface-soft p-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-copy">{value}</p>
    </div>
  );
}
