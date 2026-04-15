import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { PlanSetupWizard } from "@/components/plan-setup-wizard";
import { SectionCard } from "@/components/section-card";
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
      <section>
        <p className="text-sm uppercase tracking-[0.24em] text-slate">
          Edit Plan Setup
        </p>
        <h1 className="mt-2 font-display text-4xl text-ink">
          Adjust the setup for {plan.name}.
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate">
          This reopens the guided setup for this plan. It does not rerun onboarding, and
          you will review the updated draft before saving.
        </p>
        <Link
          href={`/plans/${plan.id}` as Route}
          className="mt-4 inline-flex rounded-full border border-ink/10 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-coral hover:text-coral"
        >
          Back to plan
        </Link>
      </section>

      <SectionCard
        title="Update guided setup"
        eyebrow="Plan setup"
        description="Use this for setup and context changes. Deep structure edits remain available from plan management."
      >
        <PlanSetupWizard
          profile={profile}
          initialMode="guided"
          initialSetup={setupContext.setup}
          editingPlan={{ id: plan.id, name: plan.name }}
          setupContextNotices={setupContext.notices}
          setupContextMissingFields={setupContext.missingFields}
          allowManualMode={false}
        />
      </SectionCard>
    </div>
  );
}
