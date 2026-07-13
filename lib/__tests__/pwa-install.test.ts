import { describe, expect, it } from "vitest";
import {
  getDismissedUntil,
  getInstallPlatform,
  isInstallDismissed,
  shouldSuppressInstallPrompt
} from "@/lib/pwa-install";

describe("PWA install prompt state", () => {
  it("detects installed standalone mode before other platforms", () => {
    expect(getInstallPlatform({ hasPrompt: true, isStandalone: true, userAgent: "Chrome", maxTouchPoints: 0 })).toBe("installed");
  });

  it("uses the saved Chromium prompt only when available", () => {
    expect(getInstallPlatform({ hasPrompt: true, isStandalone: false, userAgent: "Chrome", maxTouchPoints: 0 })).toBe("chromium");
  });

  it("shows iOS Safari guidance instead of a broken install action", () => {
    expect(getInstallPlatform({ hasPrompt: false, isStandalone: false, userAgent: "Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1", maxTouchPoints: 5 })).toBe("ios-safari");
  });

  it("treats unsupported browsers without a prompt as unsupported", () => {
    expect(getInstallPlatform({ hasPrompt: false, isStandalone: false, userAgent: "Mozilla/5.0 Firefox/120.0", maxTouchPoints: 0 })).toBe("unsupported");
  });

  it("honors dismissal cooldown timestamps", () => {
    const now = 1_000;
    expect(isInstallDismissed(now, String(getDismissedUntil(now, 1)))).toBe(true);
    expect(isInstallDismissed(now, String(now - 1))).toBe(false);
    expect(isInstallDismissed(now, "not-a-number")).toBe(false);
  });

  it("suppresses the prompt when installed, dismissed, or on active workout routes", () => {
    expect(shouldSuppressInstallPrompt({ pathname: "/dashboard", isInstalled: true, dismissed: false })).toBe(true);
    expect(shouldSuppressInstallPrompt({ pathname: "/dashboard", isInstalled: false, dismissed: true })).toBe(true);
    expect(shouldSuppressInstallPrompt({ pathname: "/workout/active", isInstalled: false, dismissed: false })).toBe(true);
    expect(shouldSuppressInstallPrompt({ pathname: "/workout/active/sets", isInstalled: false, dismissed: false })).toBe(true);
    expect(shouldSuppressInstallPrompt({ pathname: "/dashboard", isInstalled: false, dismissed: false })).toBe(false);
  });
});
