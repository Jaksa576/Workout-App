import Link from "next/link";
import type { Route } from "next";
import { ProfileSettingsForm } from "@/components/profile-settings-form";
import { SectionCard } from "@/components/section-card";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/data";

export default async function SettingsPage() {
  await requireUser();
  const profile = await getProfile();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section>
        <p className="text-sm uppercase tracking-[0.24em] text-slate">
          Profile settings
        </p>
        <h1 className="mt-2 font-display text-4xl text-ink">
          Keep your training profile current.
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate">
          These details help future guided plans account for your availability, equipment,
          preferences, and limitations.
        </p>
      </section>

      <SectionCard
        title="Training profile"
        eyebrow="Profile"
        description="Update your reusable training context without going back through onboarding."
      >
        {profile ? (
          <ProfileSettingsForm profile={profile} />
        ) : (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-slate">
              Your profile is not ready yet. Complete profile setup first, then return here
              for ongoing edits.
            </p>
            <Link
              href={"/onboarding" as Route}
              className="inline-flex rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#f95a2b]"
            >
              Complete Profile Setup
            </Link>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
