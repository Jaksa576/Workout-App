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
          <h1 className="mt-3 font-display text-3xl leading-tight text-white sm:text-4xl">
            Set up your next plan.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/72">
            Choose a path, draft the structure, then review and save.
          </p>
        </SurfaceCard>
        <SurfaceCard tone="soft" padding="comfortable">
          <p className="ui-eyebrow">Flow</p>
          <div className="mt-4 space-y-3 text-sm leading-6 text-muted">
            <p>
              <span className="font-semibold text-copy">Guided setup</span> is the default path
              for templates.
            </p>
            <p>
              <span className="font-semibold text-copy">Draft with AI</span> uses your own
              external assistant.
            </p>
            <p>
              <span className="font-semibold text-copy">Manual builder</span> remains available
              for known plans.
            </p>
          </div>
        </SurfaceCard>
      </section>

      <SectionCard
        title="Create a goal-based plan"
        eyebrow="Plan setup"
        description="Guided, AI-assisted, and manual plans all move through review before save."
      >
        <PlanSetupWizard profile={profile} initialMode={initialMode} />
      </SectionCard>
    </div>
  );
}
