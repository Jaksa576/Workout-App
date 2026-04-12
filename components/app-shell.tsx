"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import type { UserSummary } from "@/lib/types";
import { SignOutButton } from "@/components/sign-out-button";

const navItems = [
  { href: "/" as Route, label: "Dashboard" },
  { href: "/plans" as Route, label: "Plans" },
  { href: "/today" as Route, label: "Today" },
  { href: "/check-in" as Route, label: "Check-in" },
  { href: "/settings" as Route, label: "Settings" }
];

export function AppShell({
  children,
  user
}: {
  children: React.ReactNode;
  user: UserSummary | null;
}) {
  const pathname = usePathname();
  const showShell = Boolean(user);

  return (
    <div className="min-h-screen px-4 pb-24 pt-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {showShell ? (
          <header className="mb-6 flex flex-col gap-4 rounded-[28px] border border-white/60 bg-white/70 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-lg font-bold text-white">
                F
              </div>
              <div>
                <p className="font-display text-2xl text-ink">Workout App</p>
                <p className="text-xs uppercase tracking-[0.24em] text-slate">
                  Personal workout planner
                </p>
              </div>
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <nav className="flex flex-wrap gap-2">
                {navItems.map((item) => {
                  const active =
                    item.href === "/"
                      ? pathname === item.href
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={clsx(
                        "rounded-full px-4 py-2 text-sm font-semibold transition",
                        active
                          ? "bg-ink text-white"
                          : "bg-white text-slate hover:text-coral"
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <SignOutButton />
            </div>
          </header>
        ) : null}

        <main>{children}</main>
      </div>
    </div>
  );
}
