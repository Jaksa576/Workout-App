import { LoginForm } from "@/components/login-form";
import { SectionCard } from "@/components/section-card";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md pt-6">
      <SectionCard
        title="Welcome back"
        eyebrow="Sign in"
        description="Use Supabase email login for your personal account. This screen is wired for the expected flow and is ready for your project keys."
      >
        <LoginForm />
      </SectionCard>
    </div>
  );
}

