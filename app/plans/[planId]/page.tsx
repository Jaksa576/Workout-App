import { notFound } from "next/navigation";
import { SectionCard } from "@/components/section-card";
import { getPlanById } from "@/lib/data";
import { ProgressBadge } from "@/components/progress-badge";
import { WorkoutChecklist } from "@/components/workout-checklist";

export default async function PlanDetailPage({
  params
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  const plan = await getPlanById(planId);

  if (!plan) {
    notFound();
  }

  const previewWorkout = plan.workouts[0] ?? null;

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] bg-white/80 p-6 shadow-card">
        <p className="text-sm uppercase tracking-[0.22em] text-slate">
          Plan detail
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-4xl text-ink">{plan.name}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate">
              {plan.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ProgressBadge
              label={`Phase ${plan.currentPhase.phaseNumber}`}
              tone="gold"
            />
            <ProgressBadge label={plan.currentPhase.goal} tone="green" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <SectionCard
          title="Phase progression"
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
            title="No workouts in this phase yet"
            eyebrow="Workout detail"
            description="Add a workout to make this phase ready to run."
          >
            <p className="text-sm leading-6 text-slate">
              Once the workout is added, its exercises will appear here.
            </p>
          </SectionCard>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {plan.phases.map((phase) => (
          <SectionCard
            key={phase.id}
            title={`Phase ${phase.phaseNumber}`}
            eyebrow={phase.phaseNumber === plan.currentPhase.phaseNumber ? "Current" : "Upcoming"}
            description={phase.goal}
          >
            <div className="space-y-3 text-sm leading-6 text-slate">
              <p>
                <span className="font-semibold text-ink">Advance:</span>{" "}
                {phase.advanceCriteria}
              </p>
              <p>
                <span className="font-semibold text-ink">Deload:</span>{" "}
                {phase.deloadCriteria}
              </p>
            </div>
          </SectionCard>
        ))}
      </section>
    </div>
  );
}
