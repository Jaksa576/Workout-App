import { SectionCard } from "@/components/section-card";
import { profile } from "@/lib/mock-data";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm uppercase tracking-[0.24em] text-slate">
          Profile settings
        </p>
        <h1 className="mt-2 font-display text-4xl text-ink">
          Personal details that shape your plan.
        </h1>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard
          title="Training profile"
          eyebrow="Inputs"
          description="These values should become form fields once the backend is connected."
        >
          <div className="space-y-4 text-sm text-slate">
            <p>
              <span className="font-semibold text-ink">Goal:</span>{" "}
              {profile.goal}
            </p>
            <p>
              <span className="font-semibold text-ink">Available days:</span>{" "}
              {profile.daysPerWeek} per week
            </p>
            <p>
              <span className="font-semibold text-ink">Equipment:</span>{" "}
              {profile.equipment.join(", ")}
            </p>
            <p>
              <span className="font-semibold text-ink">Session length:</span>{" "}
              {profile.sessionMinutes} minutes
            </p>
          </div>
        </SectionCard>

        <SectionCard
          title="Future enhancements"
          eyebrow="Roadmap"
          description="These are already accounted for in the project shape."
        >
          <ul className="space-y-3 text-sm leading-6 text-slate">
            <li>AI-generated workout drafts saved as reviewable plan suggestions</li>
            <li>YouTube video links on each exercise entry</li>
            <li>Read-only plan sharing for friends</li>
            <li>Exercise substitutions when pain or equipment changes</li>
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
