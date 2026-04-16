import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { PlanBuilderForm } from "@/components/plan-builder-form";
import { PageHero } from "@/components/page-hero";
import { ProgressBadge } from "@/components/progress-badge";
import { requireUser } from "@/lib/auth";
import { getPlanById } from "@/lib/data";
import { savedPlanToStructuredPlanInput } from "@/lib/plan-edit-draft";
import { formatPhaseLabel } from "@/lib/plan-labels";

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
      <PageHero
        eyebrow="Edit details"
        title={`Edit the saved details for ${plan.name}.`}
        description="Use this to refine the plan you already have. This stays in the saved plan details flow rather than reopening setup or onboarding."
        badges={
          <>
            <ProgressBadge label="Primary edit path" tone="ink" />
            <ProgressBadge label={formatPhaseLabel(plan.currentPhase.phaseNumber)} tone="gold" />
          </>
        }
        actions={
          <>
            <Link href={`/plans/${plan.id}` as Route} className="ui-button-secondary text-center">
              Back to plan
            </Link>
            <Link href="/plans" className="ui-button-ghost text-center">
              View all plans
            </Link>
          </>
        }
        aside={
          <div className="space-y-3">
            <p className="ui-eyebrow">How this save works</p>
            <p className="text-sm leading-6 text-copy">
              Saving updates the live plan structure. Existing history stays readable through snapshots.
            </p>
            <p className="text-sm leading-6 text-muted">
              For larger goal or schedule changes, use the separate setup/regenerate route instead of treating this like a restart.
            </p>
          </div>
        }
      />

      <section className="space-y-4">
        <div>
          <p className="ui-eyebrow">Review and update</p>
          <h2 className="mt-2 font-display text-2xl leading-tight text-copy sm:text-3xl">
            Refine the current blueprint
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            Adjust the saved structure directly, review the outcome, and save when the live plan looks right.
          </p>
        </div>
        <PlanBuilderForm
          initialPlan={savedPlanToStructuredPlanInput(plan)}
          submitLabel="Save plan changes"
          setupContext={plan.setupContext}
          planId={plan.id}
          flow="edit-details"
          editingPlanName={plan.name}
        />
      </section>
    </div>
  );
}
