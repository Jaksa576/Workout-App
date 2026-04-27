"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import type { UserSummary } from "@/lib/types";
import { AppLogo } from "@/components/app-logo";
import { SignOutButton } from "@/components/sign-out-button";
import { isAuthenticatedShellRoute } from "@/lib/app-route-boundary";

const navItems = [
  { href: "/dashboard" as Route, label: "Dashboard", icon: "dashboard" },
  { href: "/plans" as Route, label: "Plans", icon: "plans" },
  { href: "/workout" as Route, label: "Workout", icon: "workout" },
  { href: "/settings" as Route, label: "Settings", icon: "settings" }
];

export function AppShell({
  children,
  user
}: {
  children: React.ReactNode;
  user: UserSummary | null;
}) {
  const pathname = usePathname();
  const showShell = Boolean(user) && isAuthenticatedShellRoute(pathname);
  const userEmail = user?.email ?? "Adaptive Training";

  return (
    <div className="min-h-screen px-3 pb-24 pt-4 sm:px-6 sm:pb-28 sm:pt-5 lg:px-8 lg:pb-8">
      <div className={clsx("mx-auto max-w-6xl", showShell && "lg:max-w-7xl")}>
        {showShell ? (
          <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="sticky top-5 hidden h-[calc(100vh-2.5rem)] flex-col overflow-hidden rounded-[32px] border border-white/10 bg-hero p-4 text-white shadow-premium lg:flex">
              <div className="rounded-[26px] border border-white/10 bg-white/[0.05] p-4">
                <Link
                  href="/dashboard"
                  className="inline-flex rounded-2xl outline-none transition focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-hero"
                  aria-label="Adaptive Training dashboard"
                >
                  <AppLogo
                    compact
                    showTagline={false}
                    iconClassName="h-12 w-12 rounded-[18px]"
                    textClassName="text-white"
                  />
                </Link>
                <p className="mt-4 max-w-[13rem] text-sm font-semibold leading-6 text-white/68">
                  Structured plans, clear phases, and progress that adapts with you.
                </p>
              </div>

              <nav className="mt-5 grid gap-2" aria-label="Primary navigation">
                {navItems.map((item) => (
                  <ShellNavLink
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    active={isActiveRoute(pathname, item.href)}
                    variant="rail"
                  />
                ))}
              </nav>

              <div className="mt-auto rounded-[26px] border border-white/10 bg-white/[0.05] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">
                  Signed in
                </p>
                <p className="mt-2 truncate text-sm font-semibold text-white/82">
                  {userEmail}
                </p>
                <SignOutButton className="mt-4 w-full border-white/10 bg-white/[0.06] text-white/75 hover:border-white/20 hover:bg-white/[0.12] hover:text-white focus-visible:ring-secondary focus-visible:ring-offset-hero" />
              </div>
            </aside>

            <div className="min-w-0">
              <header className="surface-card mb-5 px-3 py-3 sm:mb-6 sm:px-5 sm:py-4 lg:hidden">
                <div className="flex items-center justify-between gap-3">
                  <Link
                    href="/dashboard"
                    className="inline-flex min-w-0 rounded-2xl outline-none transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-shell"
                    aria-label="Adaptive Training dashboard"
                  >
                    <AppLogo compact showTagline={false} />
                  </Link>
                  <SignOutButton className="shrink-0 px-3" />
                </div>
              </header>

              <nav
                className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 gap-1 rounded-[24px] border border-border/80 bg-surface/95 p-1.5 shadow-premium backdrop-blur sm:inset-x-6 lg:hidden"
                aria-label="Primary navigation"
              >
                {navItems.map((item) => (
                  <ShellNavLink
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    active={isActiveRoute(pathname, item.href)}
                    variant="mobile"
                  />
                ))}
              </nav>

              <main>{children}</main>
            </div>
          </div>
        ) : null}

        {!showShell ? <main>{children}</main> : null}
      </div>
    </div>
  );
}

function isActiveRoute(pathname: string, href: Route): boolean {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

function ShellNavLink({
  href,
  icon,
  label,
  active,
  variant
}: {
  href: Route;
  icon: string;
  label: string;
  active: boolean;
  variant: "rail" | "mobile";
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "group outline-none transition focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2",
        variant === "rail"
          ? "flex items-center gap-3 rounded-[22px] px-4 py-3 focus-visible:ring-offset-hero"
          : "flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-[18px] px-1 py-2 focus-visible:ring-offset-surface",
        active
          ? variant === "rail"
            ? "bg-white text-hero shadow-soft"
            : "bg-hero text-white shadow-sm"
          : variant === "rail"
            ? "text-white/66 hover:bg-white/[0.08] hover:text-white"
            : "text-muted hover:bg-surface-soft hover:text-copy"
      )}
      aria-current={active ? "page" : undefined}
    >
      <span
        className={clsx(
          "flex shrink-0 items-center justify-center rounded-2xl transition",
          variant === "rail" ? "h-11 w-11" : "h-8 w-8",
          active
            ? variant === "rail"
              ? "bg-primary/12 text-primary"
              : "bg-white/12 text-white"
            : variant === "rail"
              ? "bg-white/[0.06] text-white/70 group-hover:bg-white/[0.12] group-hover:text-white"
              : "bg-shell-elevated text-muted group-hover:text-copy"
        )}
        aria-hidden="true"
      >
        <ShellIcon name={icon} className={variant === "rail" ? "h-5 w-5" : "h-4 w-4"} />
      </span>
      <span
        className={clsx(
          "font-bold",
          variant === "rail" ? "text-sm" : "text-[11px] leading-none sm:text-xs"
        )}
      >
        {label}
      </span>
    </Link>
  );
}

function ShellIcon({ name, className }: { name: string; className?: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const
  };

  const paths: Record<string, React.ReactNode> = {
    dashboard: (
      <>
        <path d="M4 13a8 8 0 0 1 16 0" />
        <path d="M12 13l4-4" />
        <path d="M5 19h14" />
      </>
    ),
    plans: (
      <>
        <path d="M5 4h14v16H5z" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),
    workout: (
      <>
        <path d="M3 12h18" />
        <path d="M6 8v8M9 7v10M15 7v10M18 8v8" />
      </>
    ),
    settings: (
      <>
        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.04.04a2 2 0 0 1-2.82 2.82l-.04-.04A1.8 1.8 0 0 0 15 19.4a1.8 1.8 0 0 0-1 1.6V21a2 2 0 0 1-4 0v-.06a1.8 1.8 0 0 0-1-1.6 1.8 1.8 0 0 0-1.98.36l-.04.04a2 2 0 0 1-2.82-2.82l.04-.04A1.8 1.8 0 0 0 4.6 15a1.8 1.8 0 0 0-1.6-1H3a2 2 0 0 1 0-4h.06a1.8 1.8 0 0 0 1.6-1 1.8 1.8 0 0 0-.36-1.98l-.04-.04a2 2 0 0 1 2.82-2.82l.04.04A1.8 1.8 0 0 0 9 4.6a1.8 1.8 0 0 0 1-1.6V3a2 2 0 0 1 4 0v.06a1.8 1.8 0 0 0 1 1.6 1.8 1.8 0 0 0 1.98-.36l.04-.04a2 2 0 0 1 2.82 2.82l-.04.04A1.8 1.8 0 0 0 19.4 9c.3.62.93 1 1.6 1H21a2 2 0 0 1 0 4h-.06a1.8 1.8 0 0 0-1.54 1Z" />
      </>
    )
  };

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...common}>
      {paths[name]}
    </svg>
  );
}
