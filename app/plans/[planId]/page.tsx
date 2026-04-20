import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { SectionCard } from "@/components/section-card";
import { getPlanById } from "@/lib/data";
import { ProgressBadge } from "@/components/progress-badge";
import { WorkoutChecklist } from "@/components/workout-checklist";
import { ExerciseVideoLinkEditor } from "@/components/exercise-video-link-editor";
import { PhaseProgressPanel } from "@/components/phase-progress-panel";
import { PlanArchiveAction } from "@/components/plan-archive-action";
import { getWorkoutPageData } from "@/lib/data";
import { formatPhaseLabel } from "@/lib/plan-labels";
import { PageHero } from "@/components/page-hero";
import { PlanPhaseCard } from "@/components/plan-phase-card";

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

  const previewWorkout = plan.workouts[0] ?? null;
  const activePhaseProgress =
    workoutData.activePlan?.id === plan.id ? workoutData.phaseProgress : null;

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHero
        eyebrow="Saved plan"
        title={plan.name}
        description={plan.description}
        badges={
          <>
            <ProgressBadge label={formatPhaseLabel(plan.currentPhase.phaseNumber)} tone="ink" />
            <ProgressBadge label={plan.currentPhase.goal} tone="green" />
          </>
        }
        actions={
          <>
            <Link href={`/plans/${plan.id}/edit` as Route} className="ui-button-primary text-center">
              Edit details
            </Link>
            <Link href="/plans" className="ui-button-ghost text-center">
              Back to plans
            </Link>
          </>
        }
        aside={
          <div className="space-y-4">
            <div>
              <p className="ui-eyebrow">Current structure</p>
              <p className="mt-2 text-xl font-semibold text-copy">
                {plan.phases.length} {plan.phases.length === 1 ? "phase" : "phases"}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                {plan.workouts.length} saved workouts with history snapshots preserved across edits.
              </p>
            </div>
            <div className="surface-panel-muted">
              <p className="ui-eyebrow">Primary action</p>
              <p className="mt-2 text-sm leading-6 text-copy">
                Edit details updates the live plan directly while keeping old history readable.
              </p>
            </div>
          </div>
        }
      />

      <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <SectionCard
          title="Current phase rules"
          eyebrow="Progression"
          description="Use these signals to decide when to progress, repeat, or deload."
        >
          <div className="space-y-4">
            <div className="surface-panel">
              <p className="ui-eyebrow">Goal</p>
              <p className="mt-3 text-sm leading-6 text-copy">{plan.currentPhase.goal}</p>
            </div>
            <div className="surface-panel">
              <p className="ui-eyebrow">Advance criteria</p>
              <p className="mt-3 text-sm leading-6 text-copy">{plan.currentPhase.advanceCriteria}</p>
            </div>
            <div className="surface-panel">
              <p className="ui-eyebrow">Deload criteria</p>
              <p className="mt-3 text-sm leading-6 text-copy">{plan.currentPhase.deloadCriteria}</p>
            </div>
          </div>
        </SectionCard>

        {previewWorkout ? (
          <SectionCard
            title={previewWorkout.name}
            eyebrow="Workout"
            description={previewWorkout.focus}
          >
            <WorkoutChecklist workout={previewWorkout} />
          </SectionCard>
        ) : (
          <SectionCard
            title="No workouts in this phase yet"
            eyebrow="Workout detail"
            description="Add a workout to make this phase ready."
          >
            <p className="text-sm leading-6 text-muted">
              Once the workout is added, its exercises will appear here.
            </p>
          </SectionCard>
        )}
      </section>

      {activePhaseProgress ? (
        <PhaseProgressPanel plan={plan} progress={activePhaseProgress} mode="plan" />
      ) : null}

      {plan.workouts.length > 0 ? (
        <SectionCard
          title="Exercise video links"
          eyebrow="Demos"
          description="Add or update YouTube demo links."
        >
          <ExerciseVideoLinkEditor workouts={plan.workouts} />
        </SectionCard>
      ) : null}

      <section className="space-y-4">
        <div>
          <p className="ui-eyebrow">Plan structure</p>
          <h2 className="mt-2 font-display text-2xl leading-tight text-copy sm:text-3xl">
            Phase-by-phase blueprint
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            Keep the full plan readable at a glance. The current phase stays visible alongside the upcoming structure.
          </p>
        </div>
        {plan.phases.map((phase) => (
          <PlanPhaseCard
            key={phase.id}
            phase={phase}
            workouts={plan.workouts.filter((workout) => workout.phaseId === phase.id)}
            isCurrent={phase.phaseNumber === plan.currentPhase.phaseNumber}
            progress={
              activePhaseProgress && phase.id === activePhaseProgress.currentPhaseId
                ? activePhaseProgress
                : null
            }
          />
        ))}
      </section>

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
