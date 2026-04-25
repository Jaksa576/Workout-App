import { PlanSetupWizard } from "@/components/plan-setup-wizard";
import { SectionCard } from "@/components/section-card";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/data";

export default async function NewPlanPage({
  searchParams
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  await requireUser();
  const [profile, params] = await Promise.all([getProfile(), searchParams]);
  const initialMode =
    params.mode === "manual"
      ? "manual"
      : params.mode === "ai"
        ? "ai"
        : "guided";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section>
        <p className="text-sm uppercase tracking-[0.24em] text-muted">
          Create Plan
        </p>
        <h1 className="mt-2 font-display text-4xl text-copy">
          Set up the plan you want to train for right now.
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          Use your profile as context, choose a goal track for this plan, then either generate a
          draft in-app, draft with your own external AI assistant, or build the structure manually
          before saving.
        </p>
      </section>

      <SectionCard
        title="Create a goal-based plan"
        eyebrow="Plan setup"
        description="Guided setup stays the default path. Draft with AI is an optional helper, and manual building is still available for advanced edits."
      >
        <PlanSetupWizard profile={profile} initialMode={initialMode} />
      </SectionCard>
    </div>
  );
}
