import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { InstallAppPrompt } from "@/components/install-app-prompt";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { ThemeScript } from "@/components/theme-script";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Adaptive Training",
  description: "Structured plans that progress with you.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192-v2.png", type: "image/png", sizes: "192x192" }
    ],
    apple: "/apple-touch-icon-v2.png"
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
  const user = await getCurrentUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <ServiceWorkerRegistration />
        <AppShell user={user}>{children}</AppShell>
      </body>
    </html>
  );
}
