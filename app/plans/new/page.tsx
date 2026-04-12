import { PlanBuilderForm } from "@/components/plan-builder-form";
import { SectionCard } from "@/components/section-card";

export default function NewPlanPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section>
        <p className="text-sm uppercase tracking-[0.24em] text-slate">
          New workout plan
        </p>
        <h1 className="mt-2 font-display text-4xl text-ink">
          Start with one clear phase and one workout you can repeat.
        </h1>
      </section>

      <SectionCard
        title="Plan builder"
        eyebrow="Manual entry"
        description="This form matches the core data model so it can be connected directly to Supabase inserts when you are ready."
      >
        <PlanBuilderForm />
      </SectionCard>
    </div>
  );
}

