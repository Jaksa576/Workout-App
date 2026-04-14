import { notFound } from "next/navigation";
import { SectionCard } from "@/components/section-card";
import { getPlanById } from "@/lib/data";
import { ProgressBadge } from "@/components/progress-badge";
import { WorkoutChecklist } from "@/components/workout-checklist";
import { ExerciseVideoLinkEditor } from "@/components/exercise-video-link-editor";
import { PhaseProgressPanel } from "@/components/phase-progress-panel";
import { PlanManagementActions } from "@/components/plan-management-actions";
import { getWorkoutPageData } from "@/lib/data";
import { formatBlockLabel } from "@/lib/plan-labels";

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
      <section className="rounded-[24px] bg-white/80 p-5 shadow-card sm:rounded-[32px] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate sm:tracking-[0.22em]">
          Plan detail
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl">{plan.name}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate">
              {plan.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ProgressBadge
              label={formatBlockLabel(plan.currentPhase.phaseNumber)}
              tone="gold"
            />
            <ProgressBadge label={plan.currentPhase.goal} tone="green" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <SectionCard
          title="Block progression"
          eyebrow="Rules"
          description="Use these signals to decide when to progress, repeat, or deload."
        >
          <div className="space-y-4">
            <div className="rounded-3xl bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate">
                Goal
              </p>
              <p className="mt-3 text-sm leading-6 text-ink">
                {plan.currentPhase.goal}
              </p>
            </div>
            <div className="rounded-3xl bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate">
                Advance criteria
              </p>
              <p className="mt-3 text-sm leading-6 text-ink">
                {plan.currentPhase.advanceCriteria}
              </p>
            </div>
            <div className="rounded-3xl bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate">
                Deload criteria
              </p>
              <p className="mt-3 text-sm leading-6 text-ink">
                {plan.currentPhase.deloadCriteria}
              </p>
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
            title="No workouts in this block yet"
            eyebrow="Workout detail"
            description="Add a workout to make this block ready."
          >
            <p className="text-sm leading-6 text-slate">
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

      <section className="grid gap-4 lg:grid-cols-2">
        {plan.phases.map((phase) => (
          <SectionCard
            key={phase.id}
            title={formatBlockLabel(phase.phaseNumber)}
            eyebrow={phase.phaseNumber === plan.currentPhase.phaseNumber ? "Current" : "Upcoming"}
            description={phase.goal}
          >
            <div className="space-y-3 text-sm leading-6 text-slate">
              {activePhaseProgress && phase.id === activePhaseProgress.currentPhaseId ? (
                <div className="rounded-3xl bg-coral/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-ink">Current block progress</p>
                    <p className="font-semibold text-ink">
                      {activePhaseProgress.completionPercent}%
                    </p>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-coral"
                      style={{ width: `${activePhaseProgress.completionPercent}%` }}
                    />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate">
                    {activePhaseProgress.cleanSessions} of{" "}
                    {activePhaseProgress.requiredCleanSessions} clean sessions,{" "}
                    {activePhaseProgress.painFlags}{" "}
                    {activePhaseProgress.painFlags === 1 ? "pain flag" : "pain flags"}.
                  </p>
                </div>
              ) : null}
              <p>
                <span className="font-semibold text-ink">Advance:</span>{" "}
                {phase.advanceCriteria}
              </p>
              <p>
                <span className="font-semibold text-ink">Deload:</span>{" "}
                {phase.deloadCriteria}
              </p>
              <div>
                <p className="font-semibold text-ink">Workouts:</p>
                <div className="mt-2 space-y-2">
                  {plan.workouts
                    .filter((workout) => workout.phaseId === phase.id)
                    .map((workout) => (
                      <div key={workout.id} className="rounded-2xl bg-white/70 px-3 py-2">
                        <p className="font-semibold text-ink">{workout.name}</p>
                        <p>{workout.exercises.length} exercises</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </SectionCard>
        ))}
      </section>

      <PlanManagementActions plan={plan} />
    </div>
  );
}
