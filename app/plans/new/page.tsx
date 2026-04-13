import { PlanBuilderForm } from "@/components/plan-builder-form";
import { SectionCard } from "@/components/section-card";

export default function NewPlanPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section>
        <p className="text-sm uppercase tracking-[0.24em] text-slate">
          Create Plan
        </p>
        <h1 className="mt-2 font-display text-4xl text-ink">
          Build the program, phases, and workouts in one guided flow.
        </h1>
      </section>

      <SectionCard
        title="Create a Workout Plan"
        eyebrow="Guided builder"
        description="Start with structure first, then choose exercises from the starter library and adjust the details."
      >
        <PlanBuilderForm />
      </SectionCard>
    </div>
  );
}
