import Link from "next/link";
import type { Route } from "next";
import { AppLogo } from "@/components/app-logo";
import { GoalIconCard } from "@/components/goal-icon-card";
import { LandingSection } from "@/components/landing-section";
import { ProductPreviewCard } from "@/components/product-preview-card";
import { SurfaceCard } from "@/components/surface-card";

export default async function HomePage() {
  return (
    <div className="pb-12">
      <LandingSection className="pb-6 pt-5 sm:pt-7">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg">
            <AppLogo compact showTagline={false} />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="ui-button-ghost px-4 py-2.5">
              Sign in
            </Link>
            <Link
              href={"/login?mode=sign-up" as Route}
              className="ui-button-primary px-4 py-2.5"
            >
              Get started
            </Link>
          </div>
        </div>
      </LandingSection>

      <LandingSection className="pt-2">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="ui-eyebrow">Adaptive Training</p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight text-copy sm:text-5xl">
              Structured training that evolves with you.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
              Build phased plans, log workouts, complete check-ins, and follow progression
              guidance that stays tied to your actual training rhythm.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={"/login?mode=sign-up" as Route}
                className="ui-button-primary inline-flex justify-center"
              >
                Create your account
              </Link>
              <Link
                href="/login"
                className="ui-button-secondary inline-flex justify-center"
              >
                Sign in
              </Link>
              <Link
                href="#how-it-works"
                className="ui-button-ghost inline-flex justify-center"
              >
                See how it works
              </Link>
            </div>
          </div>

          <ProductPreviewCard
            eyebrow="Product preview"
            title="A calmer way to stay consistent"
          >
            <div className="space-y-4">
              <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                  Today
                </p>
                <p className="mt-2 text-lg font-semibold text-text-inverse">
                  Lower Body Strength
                </p>
                <p className="mt-2 text-sm leading-6 text-white/72">
                  Check in, train through a structured phase, and review adaptive next-step cues.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <SurfaceCard tone="darkElevated" padding="compact">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
                    This week
                  </p>
                  <p className="mt-2 text-base font-semibold text-text-inverse">4 planned sessions</p>
                </SurfaceCard>
                <SurfaceCard tone="darkElevated" padding="compact">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
                    Progress
                  </p>
                  <p className="mt-2 text-base font-semibold text-text-inverse">Phase-ready guidance</p>
                </SurfaceCard>
              </div>
            </div>
          </ProductPreviewCard>
        </div>
      </LandingSection>

      <LandingSection id="how-it-works" className="pt-6">
        <div className="space-y-4">
          <div>
            <p className="ui-eyebrow">How it works</p>
            <h2 className="mt-3 font-display text-3xl leading-tight text-copy sm:text-4xl">
              Plans, phases, check-ins, and adaptive progress.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <GoalIconCard
              title="Phased plans"
              description="Create structured training programs built around focused phases and scheduled workouts."
              tone="green"
            />
            <GoalIconCard
              title="Workout check-ins"
              description="Log what happened, capture difficulty and pain signals, and keep your history readable."
              tone="blue"
            />
            <GoalIconCard
              title="Adaptive next steps"
              description="Use clear progression prompts that stay grounded in your plan and actual completed sessions."
              tone="coral"
            />
          </div>
        </div>
      </LandingSection>
    </div>
  );
}
