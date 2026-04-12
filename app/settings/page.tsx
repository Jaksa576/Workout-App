import { SectionCard } from "@/components/section-card";
import { getProfile } from "@/lib/data";

export default async function SettingsPage() {
  const profile = await getProfile();

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
          description="These details help personalize your workout plans."
        >
          {profile ? (
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
                {profile.equipment.length > 0 ? profile.equipment.join(", ") : "Not set yet"}
              </p>
              <p>
                <span className="font-semibold text-ink">Session length:</span>{" "}
                {profile.sessionMinutes} minutes
              </p>
            </div>
          ) : (
            <p className="text-sm leading-6 text-slate">
              Your profile details will appear here after your account is ready.
            </p>
          )}
        </SectionCard>

        <SectionCard
          title="Coming Soon"
          eyebrow="Up next"
          description="Useful additions to make planning easier over time."
        >
          <ul className="space-y-3 text-sm leading-6 text-slate">
            <li>AI-assisted workout plan drafts</li>
            <li>YouTube video links on each exercise entry</li>
            <li>Read-only plan sharing for friends</li>
            <li>Exercise substitutions when pain or equipment changes</li>
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
