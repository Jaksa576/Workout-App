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
          Start with one phase and one workout. You can add more later.
        </h1>
      </section>

      <SectionCard
        title="Create a Workout Plan"
        eyebrow="Plan details"
        description="Start with one phase and one workout. You can add more later."
      >
        <PlanBuilderForm />
      </SectionCard>
    </div>
  );
}
