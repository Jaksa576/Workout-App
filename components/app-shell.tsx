"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import type { UserSummary } from "@/lib/types";
import { AppLogo } from "@/components/app-logo";
import { SignOutButton } from "@/components/sign-out-button";

const navItems = [
  { href: "/" as Route, label: "Dashboard" },
  { href: "/plans" as Route, label: "Plans" },
  { href: "/workout" as Route, label: "Workout" },
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
          <header className="mb-6 flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/75 px-4 py-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <Link
              href="/"
              className="inline-flex rounded-2xl outline-none transition focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-mist"
              aria-label="Workout App dashboard"
            >
              <AppLogo />
            </Link>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <nav
                className="flex flex-wrap gap-1 rounded-full border border-ink/5 bg-white/80 p-1"
                aria-label="Primary navigation"
              >
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
                        "rounded-full px-4 py-2 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                        active
                          ? "bg-ink text-white shadow-sm"
                          : "text-slate hover:bg-mist hover:text-ink"
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
