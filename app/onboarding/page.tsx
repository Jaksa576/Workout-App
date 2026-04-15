import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { requireUser } from "@/lib/auth";
import { getDashboardData, getProfile } from "@/lib/data";

export default async function OnboardingPage() {
  await requireUser();
  const [profile, dashboard] = await Promise.all([getProfile(), getDashboardData()]);

  if (profile?.onboardingCompletedAt && dashboard.activePlan) {
    redirect("/");
  }

  if (profile?.onboardingCompletedAt) {
    redirect("/plans/new");
  }

  return <OnboardingFlow initialProfile={profile} />;
}
