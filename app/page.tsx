import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";

type IconName =
  | "clipboard"
  | "brain"
  | "chart"
  | "leaf"
  | "heart"
  | "barbell"
  | "muscle"
  | "runner"
  | "rocket"
  | "check"
  | "shield"
  | "user"
  | "lock";

const goalCards: Array<{
  title: string;
  description: string;
  icon: IconName;
  tone: string;
}> = [
  {
    title: "Recovery",
    description: "Rebuild, restore, and move better.",
    icon: "leaf",
    tone: "text-emerald-700 bg-emerald-50 border-emerald-100"
  },
  {
    title: "General fitness",
    description: "Feel stronger, healthier, and more energized.",
    icon: "heart",
    tone: "text-blue-700 bg-blue-50 border-blue-100"
  },
  {
    title: "Strength",
    description: "Build real strength that carries over.",
    icon: "barbell",
    tone: "text-indigo-700 bg-indigo-50 border-indigo-100"
  },
  {
    title: "Hypertrophy",
    description: "Build muscle with smart progression.",
    icon: "muscle",
    tone: "text-rose-700 bg-rose-50 border-rose-100"
  },
  {
    title: "Running",
    description: "Run stronger, longer, and with confidence.",
    icon: "runner",
    tone: "text-orange-700 bg-orange-50 border-orange-100"
  },
  {
    title: "Performance",
    description: "Train for events. Peak on race day.",
    icon: "rocket",
    tone: "text-violet-700 bg-violet-50 border-violet-100"
  },
  {
    title: "Consistency",
    description: "Build habits that stick for life.",
    icon: "check",
    tone: "text-emerald-700 bg-lime-50 border-lime-100"
  }
];

export default async function HomePage() {
  const user = await getCurrentUser();
  const isSignedIn = Boolean(user);

  const headerPrimary = isSignedIn
    ? { href: "/dashboard" as Route, label: "Continue your plan" }
    : { href: "/login?mode=sign-up" as Route, label: "Get started" };
  const headerSecondary = isSignedIn
    ? { href: "/dashboard" as Route, label: "Dashboard" }
    : { href: "/login" as Route, label: "Sign in" };
  const heroPrimary = isSignedIn
    ? { href: "/dashboard" as Route, label: "Continue your plan" }
    : { href: "/login?mode=sign-up" as Route, label: "Create your account" };

  return (
    <div className="-mx-3 -mb-20 -mt-4 overflow-x-clip bg-[#f8f4ed] px-3 pb-20 pt-4 text-[#101827] sm:-mx-6 sm:-mt-5 sm:px-6 sm:pt-5 lg:-mx-8 lg:px-8">
      <Header primary={headerPrimary} secondary={headerSecondary} />

      <section className="mx-auto grid max-w-[1180px] gap-12 py-12 sm:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16 lg:py-24">
        <div className="relative z-10">
          <div className="absolute -left-16 top-16 hidden h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl lg:block" />
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700 sm:text-sm">
            Smarter training. Better results.
          </p>
          <h1 className="mt-5 max-w-[620px] text-5xl font-black leading-[0.98] tracking-normal text-[#0e1726] sm:text-6xl lg:text-7xl">
            Structured training that evolves with you.
          </h1>
          <p className="mt-6 max-w-[560px] text-lg leading-8 text-slate-600 sm:text-xl">
            Phased plans, intelligent adaptation, and progress built around your goals.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href={heroPrimary.href}
              className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-emerald-700 px-7 text-base font-bold text-white shadow-[0_18px_40px_rgba(6,95,70,0.24)] transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8f4ed]"
            >
              {heroPrimary.label}
              <span aria-hidden="true" className="ml-3 text-xl">
                &rarr;
              </span>
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-slate-300 bg-white/70 px-7 text-base font-bold text-slate-800 transition hover:border-blue-500 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8f4ed]"
            >
              See how it works
            </Link>
          </div>
        </div>

        <ProductMockup />
      </section>

      <section id="how-it-works" className="mx-auto max-w-[1180px] py-12 sm:py-16 lg:py-20">
        <div className="grid gap-5 rounded-[28px] border border-slate-200 bg-white/86 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-6 lg:grid-cols-3 lg:p-7">
          <StepCard
            number="1"
            title="You check in"
            description="Share how you feel, how you slept, and how your last workout went."
            icon="clipboard"
            tone="emerald"
          />
          <StepCard
            number="2"
            title="We adapt"
            description="Your plan adjusts focus, volume, and intensity around your readiness."
            icon="brain"
            tone="blue"
          />
          <StepCard
            number="3"
            title="You progress"
            description="Follow clear phases that evolve with you, week after week."
            icon="chart"
            tone="coral"
          />
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] py-12 text-center sm:py-16 lg:py-20">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">
          Built around your goals
        </p>
        <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black leading-tight text-[#0e1726] sm:text-4xl">
          Whatever you&apos;re training for, we&apos;ll adapt to it.
        </h2>
        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-7">
          {goalCards.map((goal) => (
            <GoalCard key={goal.title} {...goal} />
          ))}
        </div>
      </section>

      <ReturningUserBanner signedIn={isSignedIn} />

      <section className="mx-auto max-w-[1180px] py-12 sm:py-16">
        <div className="grid gap-4 rounded-[28px] border border-slate-200 bg-white/86 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-6 md:grid-cols-4">
          <TrustItem icon="shield" title="Evidence-based" description="Built around proven training principles." />
          <TrustItem icon="user" title="Personalized" description="Plans reflect your goals and schedule." />
          <TrustItem icon="lock" title="Privacy-first" description="Your training data stays yours." />
          <TrustItem icon="check" title="Secure" description="Protected app routes stay protected." />
        </div>
      </section>
    </div>
  );
}

function Header({
  primary,
  secondary
}: {
  primary: { href: Route; label: string };
  secondary: { href: Route; label: string };
}) {
  return (
    <header className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 py-5">
      <Link
        href="/"
        className="inline-flex items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8f4ed]"
        aria-label="Adaptive Training home"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#071426] text-emerald-400 shadow-sm sm:h-11 sm:w-11">
          <LogoMark />
        </span>
        <span className="text-sm font-black uppercase tracking-[0.18em] text-slate-950 sm:text-base">
          Adaptive Training
        </span>
      </Link>
      <nav className="flex shrink-0 items-center gap-2 sm:gap-3" aria-label="Public navigation">
        <Link
          href={secondary.href}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white/70 px-4 text-sm font-bold text-slate-900 transition hover:border-blue-500 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8f4ed] sm:px-6"
        >
          {secondary.label}
        </Link>
        <Link
          href={primary.href}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-emerald-700 px-4 text-sm font-bold text-white shadow-[0_14px_32px_rgba(6,95,70,0.22)] transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8f4ed] sm:px-6"
        >
          {primary.label}
        </Link>
      </nav>
    </header>
  );
}

function ProductMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[660px] lg:mr-0">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-300/30 blur-3xl" />
      <div className="absolute -bottom-8 left-8 h-36 w-36 rounded-full bg-blue-300/20 blur-3xl" />
      <div className="relative rounded-[30px] border border-slate-200 bg-white p-3 shadow-[0_34px_90px_rgba(15,23,42,0.16)] sm:p-4 lg:p-5">
        <div className="grid min-h-[520px] overflow-hidden rounded-[24px] border border-slate-200 bg-white md:grid-cols-[128px_1fr]">
          <aside className="hidden bg-[#071426] p-5 text-white md:block">
            <LogoMark className="h-8 w-8 text-emerald-400" />
            <div className="mt-8 space-y-3 text-xs font-bold text-white/70">
              {["Dashboard", "Training", "Calendar", "Progress", "Check-ins"].map((item, index) => (
                <div
                  key={item}
                  className={`rounded-xl px-3 py-2 ${index === 0 ? "bg-white/12 text-white" : ""}`}
                >
                  {item}
                </div>
              ))}
            </div>
          </aside>
          <div className="min-w-0 bg-white p-5 sm:p-6">
            <p className="text-2xl font-black text-slate-950">Dashboard</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">Wednesday, May 13</p>

            <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_42px_rgba(15,23,42,0.06)]">
                <p className="text-sm font-black text-slate-900">Readiness</p>
                <div className="mx-auto mt-5 flex h-32 w-32 items-center justify-center rounded-full border-[12px] border-slate-100 border-t-emerald-600 border-r-emerald-600">
                  <div className="text-center">
                    <p className="text-4xl font-black text-slate-950">82</p>
                    <p className="text-sm font-bold text-slate-600">/100</p>
                  </div>
                </div>
                <p className="mt-5 text-center text-base font-black text-emerald-700">Good to go</p>
                <p className="mt-2 text-center text-sm leading-6 text-slate-600">
                  Your body is ready for a challenging workout.
                </p>
              </div>

              <div className="grid gap-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_42px_rgba(15,23,42,0.06)]">
                  <p className="text-sm font-black text-slate-900">This week</p>
                  <div className="mt-4 grid grid-cols-[0.8fr_1.2fr] gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-500">Progress</p>
                      <p className="mt-1 text-3xl font-black text-emerald-700">12%</p>
                      <p className="mt-3 text-xs font-bold text-slate-500">Workouts</p>
                      <p className="mt-1 text-2xl font-black text-slate-950">2 / 5</p>
                    </div>
                    <MiniBars />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <MiniInfoCard title="Current phase" value="Strength Foundation" meta="Weeks 3-6 of 12" />
                  <MiniInfoCard title="Next workout" value="Lower Body Strength" meta="45 min &middot; 8 exercises" action="Start workout" />
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_42px_rgba(15,23,42,0.06)]">
              <p className="text-sm font-black text-slate-900">Check-in</p>
              <p className="mt-3 text-sm font-bold text-slate-600">How are you feeling?</p>
              <div className="mt-4 grid grid-cols-5 gap-2 text-center text-2xl">
                {["Low", "OK", "Ready", "Good", "Peak"].map((face, index) => (
                  <span
                    key={face}
                    className={`rounded-full border px-2 py-3 text-xs font-black ${index === 2 ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}
                  >
                    {face}
                  </span>
                ))}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Metric label="Sleep quality" value="7.5 hrs" />
                <Metric label="Muscle soreness" value="Moderate" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <MobilePlanPreview />
    </div>
  );
}

function MobilePlanPreview() {
  return (
    <div className="relative mx-auto -mt-8 w-[min(88%,340px)] rounded-[34px] border border-slate-900 bg-[#081321] p-3 shadow-[0_26px_70px_rgba(15,23,42,0.28)] sm:absolute sm:-bottom-10 sm:left-10 sm:mt-0 sm:w-[310px]">
      <div className="rounded-[28px] border border-white/10 bg-[#0b1624] p-5 text-white">
        <div className="flex items-center justify-between text-xs font-bold text-white/70">
          <span>9:41</span>
          <span>Week 3</span>
        </div>
        <p className="mt-4 text-xl font-black">Weekly plan</p>
        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-white/50">
          {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
            <span
              key={`${day}-${index}`}
              className={`rounded-full py-2 ${index === 2 ? "bg-emerald-500 text-white" : "bg-white/6"}`}
            >
              {day}
            </span>
          ))}
        </div>
        <div className="mt-5">
          <div className="flex items-end justify-between gap-3">
            <p className="text-sm font-black">This week&apos;s plan</p>
            <p className="text-xs font-bold text-white/60">2 / 5 workouts</p>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[40%] rounded-full bg-emerald-500" />
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {["Lower Body Strength", "Upper Body Strength", "Active Recovery"].map((workout, index) => (
            <div key={workout} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400/70 to-blue-500/60" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black">{workout}</p>
                <p className="text-xs font-bold text-white/55">45 min</p>
              </div>
              <span className={`h-4 w-4 rounded-full border ${index === 0 ? "border-emerald-400 bg-emerald-400" : "border-white/40"}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniInfoCard({
  title,
  value,
  meta,
  action
}: {
  title: string;
  value: string;
  meta: string;
  action?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_16px_42px_rgba(15,23,42,0.06)]">
      <p className="text-sm font-black text-slate-900">{title}</p>
      <p className="mt-3 text-sm font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{meta}</p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-[42%] rounded-full bg-emerald-600" />
      </div>
      {action ? (
        <div className="mt-4 rounded-xl bg-emerald-700 px-3 py-2 text-center text-xs font-black text-white">
          {action}
        </div>
      ) : null}
    </div>
  );
}

function MiniBars() {
  return (
    <div className="flex h-28 items-end justify-between gap-2 border-l border-b border-slate-100 px-3 pb-2">
      {[52, 76, 36, 68, 24, 20, 28].map((height, index) => (
        <span
          key={index}
          className={`w-3 rounded-full ${index < 4 ? "bg-emerald-500" : "bg-slate-200"}`}
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
  icon,
  tone
}: {
  number: string;
  title: string;
  description: string;
  icon: IconName;
  tone: "emerald" | "blue" | "coral";
}) {
  const toneClass = {
    emerald: "text-emerald-700 bg-emerald-50 border-emerald-100",
    blue: "text-blue-700 bg-blue-50 border-blue-100",
    coral: "text-red-600 bg-red-50 border-red-100"
  }[tone];

  return (
    <div className="relative flex gap-5 rounded-3xl border border-slate-100 bg-white p-5 sm:p-6">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${toneClass}`}>
        {number}
      </span>
      <div className="min-w-0">
        <Icon name={icon} className={`h-14 w-14 ${toneClass} rounded-2xl border p-2.5`} />
        <h3 className="mt-4 text-lg font-black text-slate-950">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </div>
  );
}

function GoalCard({ title, description, icon, tone }: (typeof goalCards)[number]) {
  return (
    <div className={`rounded-3xl border p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] ${tone}`}>
      <Icon name={icon} className="mx-auto h-14 w-14" />
      <h3 className="mt-4 text-base font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function ReturningUserBanner({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="mx-auto max-w-[1180px] py-12 sm:py-16 lg:py-20">
      <div className="grid gap-8 overflow-hidden rounded-[30px] bg-[#071426] p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.2)] sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-3xl font-black leading-tight sm:text-4xl">Returning user?</p>
          <p className="mt-4 max-w-md text-lg leading-8 text-white/78">
            Pick up where you left off and keep your momentum going.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href={(signedIn ? "/dashboard" : "/login") as Route}
              className="inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-blue-600 px-7 text-base font-black text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071426]"
            >
              {signedIn ? "Continue your plan" : "Sign in"}
              <span aria-hidden="true" className="ml-3 text-xl">
                &rarr;
              </span>
            </Link>
            {signedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-white/25 px-7 text-base font-black text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071426]"
              >
                Dashboard
              </Link>
            ) : null}
          </div>
        </div>
        <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm font-black text-white">Weekly progress</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-4xl font-black">75%</p>
              <p className="mt-2 text-sm font-bold text-emerald-300">Great week</p>
              <div className="mt-6 flex h-24 items-end gap-2">
                {[28, 52, 44, 68, 60, 84, 88].map((height, index) => (
                  <span key={index} className="flex-1 rounded-full bg-emerald-400/80" style={{ height: `${height}%` }} />
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-sm font-black text-white/80">Current phase</p>
              <p className="mt-3 text-base font-black">Strength Foundation</p>
              <p className="mt-1 text-xs font-bold text-white/55">Weeks 3-6 of 12</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[42%] rounded-full bg-emerald-400" />
              </div>
              <div className="mt-5 space-y-2 text-sm font-bold text-white/75">
                <p>Done - Lower Body Strength</p>
                <p>Done - Upper Body Strength</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustItem({
  icon,
  title,
  description
}: {
  icon: IconName;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <Icon name={icon} className="h-11 w-11 shrink-0 rounded-2xl border border-emerald-100 bg-emerald-50 p-2 text-emerald-700" />
      <div>
        <p className="font-black text-slate-950">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </div>
  );
}

function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
      <path
        d="M13 36L24 10L35 36"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M18 28H30" stroke="#2f80ed" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function Icon({ name, className }: { name: IconName; className?: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const
  };
  const paths: Record<IconName, ReactNode> = {
    clipboard: (
      <>
        <path d="M9 5h6l1 2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1-2Z" />
        <path d="M8 13h8M8 17h5M16 16l2 2 4-5" />
      </>
    ),
    brain: (
      <>
        <path d="M9 4a4 4 0 0 0-4 4v1a4 4 0 0 0 0 8v1a4 4 0 0 0 7 2" />
        <path d="M15 4a4 4 0 0 1 4 4v1a4 4 0 0 1 0 8v1a4 4 0 0 1-7 2" />
        <path d="M12 5v18M8 10h4M12 14h4M8 18h4" />
      </>
    ),
    chart: (
      <>
        <path d="M4 21h16" />
        <path d="M6 17V9M12 17V5M18 17v-7" />
      </>
    ),
    leaf: (
      <>
        <path d="M5 19C13 19 20 12 20 4C12 4 5 11 5 19Z" />
        <path d="M5 19L20 4" />
      </>
    ),
    heart: (
      <>
        <path d="M20.8 5.6a5.2 5.2 0 0 0-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 0 0-7.4 7.4L12 21.8l8.8-8.8a5.2 5.2 0 0 0 0-7.4Z" />
        <path d="M7 13h3l1.5-3 2 5 1.5-2h2" />
      </>
    ),
    barbell: (
      <>
        <path d="M2 12h20M6 8v8M9 7v10M15 7v10M18 8v8" />
      </>
    ),
    muscle: (
      <>
        <path d="M8 13c1-5 4-8 8-8l1 4h3c1 5-2 10-8 10H6c-2 0-3-1-3-3 0-1.7 1.3-3 3-3h2Z" />
        <path d="M12 9c1.5 1 2.5 2.4 3 4" />
      </>
    ),
    runner: (
      <>
        <path d="M14 4a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z" />
        <path d="M13 9l-3 4 4 2 3-3 3 2" />
        <path d="M14 15l-3 6M17 12l2 8M10 13l-5 1" />
      </>
    ),
    rocket: (
      <>
        <path d="M13 14l-4-4c2-4 6-6 11-6-1 5-2 9-6 11Z" />
        <path d="M9 10l-4 1-2 4 5-1M14 15l-1 5-4 2 1-5M15 9l.01.01" />
      </>
    ),
    check: (
      <>
        <path d="M20 6L9 17l-5-5" />
        <circle cx="12" cy="12" r="10" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3l8 3v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6l8-3Z" />
        <path d="M8.5 12l2.5 2.5 5-5" />
      </>
    ),
    user: (
      <>
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3M12 15v2" />
      </>
    )
  };

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...common}>
      {paths[name]}
    </svg>
  );
}
