import { LoginForm } from "@/components/login-form";
import { SectionCard } from "@/components/section-card";
import { redirectIfAuthenticated } from "@/lib/auth";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ mode?: string }>;
}) {
  await redirectIfAuthenticated();
  const params = searchParams ? await searchParams : undefined;
  const initialMode = params?.mode === "sign-up" ? "sign-up" : "sign-in";

  return (
    <div className="mx-auto max-w-md pt-6">
      <SectionCard
        title="Welcome back"
        eyebrow="Sign in"
        description="Sign in to access your workout plans, track sessions, and review your progress."
      >
        <LoginForm initialMode={initialMode} />
      </SectionCard>
    </div>
  );
}
