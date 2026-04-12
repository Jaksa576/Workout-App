import { LoginForm } from "@/components/login-form";
import { SectionCard } from "@/components/section-card";
import { redirectIfAuthenticated } from "@/lib/auth";

export default async function LoginPage() {
  await redirectIfAuthenticated();

  return (
    <div className="mx-auto max-w-md pt-6">
      <SectionCard
        title="Welcome back"
        eyebrow="Sign in"
        description="Sign in to access your workout plans, track sessions, and review your progress."
      >
        <LoginForm />
      </SectionCard>
    </div>
  );
}
