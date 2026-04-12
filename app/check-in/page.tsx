import { CheckInForm } from "@/components/check-in-form";
import { SectionCard } from "@/components/section-card";

export default function CheckInPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section>
        <p className="text-sm uppercase tracking-[0.24em] text-slate">
          Session check-in
        </p>
        <h1 className="mt-2 font-display text-4xl text-ink">
          Capture what happened while it&apos;s still fresh.
        </h1>
      </section>

      <SectionCard
        title="Post-workout review"
        eyebrow="Required"
        description="Pain and difficulty should guide the next decision. This starter flow makes the recommendation visible instead of changing your plan behind the scenes."
      >
        <CheckInForm />
      </SectionCard>
    </div>
  );
}

