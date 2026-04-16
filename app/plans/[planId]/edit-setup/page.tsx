import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { PlanSetupWizard } from "@/components/plan-setup-wizard";
import { PageHero } from "@/components/page-hero";
import { ProgressBadge } from "@/components/progress-badge";
import { requireUser } from "@/lib/auth";
import { getPlanById, getProfile } from "@/lib/data";
import { buildPlanSetupContext } from "@/lib/plan-setup-context";

export default async function EditPlanSetupPage({
  params
}: {
  params: Promise<{ planId: string }>;
}) {
  await requireUser();
  const { planId } = await params;
  const [plan, profile] = await Promise.all([getPlanById(planId), getProfile()]);

  if (!plan) {
    notFound();
  }

  const setupContext = buildPlanSetupContext({ plan, profile });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHero
        eyebrow="Update setup and regenerate"
        title={`Update setup for ${plan.name}.`}
        description="Use this when your goal, schedule, or training context has changed and you want a new guided draft from setup. It does not rerun onboarding."
        tone="secondary"
        badges={
          <>
            <ProgressBadge label="Secondary path" tone="gold" />
            <ProgressBadge label="Setup-driven regenerate" tone="green" />
          </>
        }
        actions={
          <>
            <Link href={`/plans/${plan.id}` as Route} className="ui-button-secondary text-center">
              Back to plan
            </Link>
            <Link href={`/plans/${plan.id}/edit` as Route} className="ui-button-ghost text-center">
              Edit details instead
            </Link>
          </>
        }
        aside={
          <div className="space-y-3">
            <p className="ui-eyebrow">When to use this</p>
            <p className="text-sm leading-6 text-copy">
              Regenerate from setup when the inputs behind the plan have changed.
            </p>
            <p className="text-sm leading-6 text-muted">
              Direct saved-plan refinements still belong in Edit details.
            </p>
          </div>
        }
      />

      <section className="space-y-4">
        <div>
          <p className="ui-eyebrow">Plan setup</p>
          <h2 className="mt-2 font-display text-2xl leading-tight text-copy sm:text-3xl">
            Review the guided inputs before drafting
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            Confirm the setup inputs that should shape the regenerated draft, then review the result before saving.
          </p>
        </div>
        <PlanSetupWizard
          profile={profile}
          initialMode="guided"
          initialSetup={setupContext.setup}
          editingPlan={{ id: plan.id, name: plan.name }}
          setupContextNotices={setupContext.notices}
          setupContextMissingFields={setupContext.missingFields}
          allowManualMode={false}
        />
      </section>
    </div>
  );
}
