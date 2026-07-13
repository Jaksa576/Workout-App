export const INSTALL_DISMISS_KEY = "workout-app:install-dismissed-until:v1";
export const INSTALL_DISMISS_COOLDOWN_DAYS = 14;

export type InstallPlatform = "installed" | "chromium" | "ios-safari" | "unsupported";

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export function getInstallPlatform({
  hasPrompt,
  isStandalone,
  userAgent,
  maxTouchPoints
}: {
  hasPrompt: boolean;
  isStandalone: boolean;
  userAgent: string;
  maxTouchPoints: number;
}): InstallPlatform {
  if (isStandalone) return "installed";
  if (hasPrompt) return "chromium";

  const isiOS = /iphone|ipad|ipod/i.test(userAgent) || (/macintosh/i.test(userAgent) && maxTouchPoints > 1);
  const isSafari = /safari/i.test(userAgent) && !/crios|fxios|edgios|chrome|chromium|android/i.test(userAgent);

  if (isiOS && isSafari) return "ios-safari";
  return "unsupported";
}

export function isInstallDismissed(now: number, storedValue: string | null): boolean {
  if (!storedValue) return false;
  const dismissedUntil = Number(storedValue);
  return Number.isFinite(dismissedUntil) && dismissedUntil > now;
}

export function getDismissedUntil(now: number, cooldownDays = INSTALL_DISMISS_COOLDOWN_DAYS): number {
  return now + cooldownDays * 24 * 60 * 60 * 1000;
}

export function shouldSuppressInstallPrompt({
  pathname,
  isInstalled,
  dismissed
}: {
  pathname: string;
  isInstalled: boolean;
  dismissed: boolean;
}): boolean {
  return isInstalled || dismissed || pathname === "/workout/active" || pathname.startsWith("/workout/active/");
}
