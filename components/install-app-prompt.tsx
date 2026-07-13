"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  getDismissedUntil,
  getInstallPlatform,
  INSTALL_DISMISS_KEY,
  isInstallDismissed,
  isStandaloneDisplay,
  shouldSuppressInstallPrompt
} from "@/lib/pwa-install";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function InstallAppPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setInstalled(isStandaloneDisplay());
    setDismissed(isInstallDismissed(Date.now(), window.localStorage.getItem(INSTALL_DISMISS_KEY)));

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setDismissed(isInstallDismissed(Date.now(), window.localStorage.getItem(INSTALL_DISMISS_KEY)));
    };
    const handleInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const platform = useMemo(
    () =>
      getInstallPlatform({
        hasPrompt: Boolean(deferredPrompt),
        isStandalone: installed,
        userAgent: typeof navigator === "undefined" ? "" : navigator.userAgent,
        maxTouchPoints: typeof navigator === "undefined" ? 0 : navigator.maxTouchPoints
      }),
    [deferredPrompt, installed]
  );

  const suppress = shouldSuppressInstallPrompt({
    pathname,
    isInstalled: platform === "installed",
    dismissed
  });

  if (suppress || platform === "unsupported") return null;

  const dismiss = () => {
    window.localStorage.setItem(INSTALL_DISMISS_KEY, String(getDismissedUntil(Date.now())));
    setDismissed(true);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    const promptEvent = deferredPrompt;
    setDeferredPrompt(null);
    await promptEvent.prompt();
    await promptEvent.userChoice;
  };

  return (
    <aside className="fixed inset-x-3 bottom-[6.25rem] z-30 rounded-[24px] border border-border/80 bg-surface/95 p-4 shadow-premium backdrop-blur sm:inset-x-auto sm:right-6 sm:max-w-sm lg:bottom-6" aria-label="Install app">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-copy">Keep Adaptive Training handy</p>
          <p className="mt-1 text-sm leading-5 text-muted">
            {platform === "ios-safari"
              ? "In Safari, use Share, then Add to Home Screen."
              : "Install the app for a faster home-screen launch."}
          </p>
        </div>
        <button type="button" onClick={dismiss} className="rounded-full px-2 py-1 text-sm font-bold text-muted outline-none transition hover:bg-surface-soft hover:text-copy focus-visible:ring-2 focus-visible:ring-accent" aria-label="Dismiss install suggestion">
          ×
        </button>
      </div>
      {platform === "chromium" ? (
        <button type="button" onClick={install} className="mt-3 w-full rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm outline-none transition hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface">
          Install app
        </button>
      ) : null}
    </aside>
  );
}
