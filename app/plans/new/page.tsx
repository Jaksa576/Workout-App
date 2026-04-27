import { PlanSetupWizard } from "@/components/plan-setup-wizard";
import { SectionCard } from "@/components/section-card";
import { SurfaceCard } from "@/components/surface-card";
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
      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <SurfaceCard tone="dark" padding="comfortable">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/65">
            Create Plan
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-white sm:text-5xl">
            Set up the plan you want to train for right now.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/72">
            Use your profile as context, choose a goal track for this plan, then draft, review,
            edit, and save through the same plan contract.
          </p>
        </SurfaceCard>
        <SurfaceCard tone="soft" padding="comfortable">
          <p className="ui-eyebrow">Flow</p>
          <div className="mt-4 space-y-3 text-sm leading-6 text-muted">
            <p>
              <span className="font-semibold text-copy">Guided setup</span> is the default path
              for a structured template draft.
            </p>
            <p>
              <span className="font-semibold text-copy">Draft with AI</span> uses your own
              external assistant and imports markdown for review.
            </p>
            <p>
              <span className="font-semibold text-copy">Manual builder</span> remains available
              for precise edits and plans you already know.
            </p>
          </div>
        </SurfaceCard>
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
