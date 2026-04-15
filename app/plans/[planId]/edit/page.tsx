import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { PlanBuilderForm } from "@/components/plan-builder-form";
import { SectionCard } from "@/components/section-card";
import { requireUser } from "@/lib/auth";
import { getPlanById } from "@/lib/data";
import { savedPlanToStructuredPlanInput } from "@/lib/plan-edit-draft";

export default async function EditPlanDetailsPage({
  params
}: {
  params: Promise<{ planId: string }>;
}) {
  await requireUser();
  const { planId } = await params;
  const plan = await getPlanById(planId);

  if (!plan) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section>
        <p className="text-sm uppercase tracking-[0.24em] text-slate">Edit Details</p>
        <h1 className="mt-2 font-display text-4xl text-ink">
          Edit the saved details for {plan.name}.
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate">
          Use this to update the plan you already have. This keeps you in the saved plan details,
          not onboarding or setup. If you want something substantially different, create a new
          plan instead.
        </p>
        <Link
          href={`/plans/${plan.id}` as Route}
          className="mt-4 inline-flex rounded-full border border-ink/10 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-coral hover:text-coral"
        >
          Back to plan
        </Link>
      </section>

      <SectionCard
        title="Edit plan details"
        eyebrow="Review/edit"
        description="Adjust the saved structure directly, then save when it looks right."
      >
        <PlanBuilderForm
          initialPlan={savedPlanToStructuredPlanInput(plan)}
          submitLabel="Save plan changes"
          setupContext={plan.setupContext}
          planId={plan.id}
          flow="edit-details"
          editingPlanName={plan.name}
        />
      </SectionCard>
    </div>
  );
}
