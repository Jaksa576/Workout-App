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
    <div className="min-h-screen px-3 pb-20 pt-4 sm:px-6 sm:pb-24 sm:pt-5 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {showShell ? (
          <header className="mb-5 flex flex-col gap-3 rounded-[24px] border border-white/70 bg-white/80 px-3 py-3 shadow-sm backdrop-blur sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-4">
            <Link
              href="/"
              className="inline-flex rounded-2xl outline-none transition focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-mist"
              aria-label="Adaptive Training dashboard"
            >
              <AppLogo />
            </Link>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <nav
                className="grid grid-cols-2 gap-1 rounded-[20px] border border-ink/5 bg-white/85 p-1 sm:flex sm:flex-wrap sm:rounded-full"
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
                        "rounded-full px-3 py-2 text-center text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:px-4",
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
