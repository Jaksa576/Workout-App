import Link from "next/link";
import type { Route } from "next";
import { ProfileSettingsForm } from "@/components/profile-settings-form";
import { SectionCard } from "@/components/section-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/data";

export default async function SettingsPage() {
  await requireUser();
  const profile = await getProfile();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section>
        <p className="ui-eyebrow">
          Profile settings
        </p>
        <h1 className="mt-2 font-display text-3xl text-copy sm:text-4xl">
          Keep your profile current.
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          These details help future plans reflect your availability, equipment, and limitations.
        </p>
      </section>

      <SectionCard
        title="Appearance"
        eyebrow="Theme"
        description="Choose how the app looks on this device."
        compact
      >
        <div className="surface-panel flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-copy">Theme preference</p>
            <p className="max-w-2xl text-sm leading-6 text-muted">
              System follows your device theme.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </SectionCard>

      <SectionCard
        title="Training profile"
        eyebrow="Profile"
        description="Update reusable training context without repeating onboarding."
      >
        {profile ? (
          <ProfileSettingsForm profile={profile} />
        ) : (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-muted">
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
