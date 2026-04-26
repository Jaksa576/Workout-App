import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { ThemeScript } from "@/components/theme-script";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Adaptive Training",
  description: "Structured plans that progress with you.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon-192.svg",
    apple: "/icon-192.svg"
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4efe7" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1219" }
  ]
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? "";
  const shouldLoadUser =
    pathname === "/dashboard" ||
    pathname === "/onboarding" ||
    pathname === "/plans" ||
    pathname.startsWith("/plans/") ||
    pathname === "/workout" ||
    pathname === "/settings" ||
    pathname === "/today" ||
    pathname === "/check-in";
  const user = shouldLoadUser ? await getCurrentUser() : null;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <AppShell user={user}>{children}</AppShell>
      </body>
    </html>
  );
}
