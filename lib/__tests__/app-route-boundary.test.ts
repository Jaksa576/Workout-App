import { describe, expect, it } from "vitest";
import {
  isAuthenticatedShellRoute,
  isProtectedAppRoute
} from "@/lib/app-route-boundary";

describe("app route boundary helpers", () => {
  it("keeps the public landing page outside protected and shell routes", () => {
    expect(isProtectedAppRoute("/")).toBe(false);
    expect(isAuthenticatedShellRoute("/")).toBe(false);
  });

  it("marks dashboard and app sections as protected shell routes", () => {
    for (const pathname of [
      "/dashboard",
      "/plans",
      "/plans/plan-123",
      "/workout",
      "/settings",
      "/onboarding"
    ]) {
      expect(isProtectedAppRoute(pathname)).toBe(true);
      expect(isAuthenticatedShellRoute(pathname)).toBe(true);
    }
  });

  it("keeps login outside protected and shell routes", () => {
    expect(isProtectedAppRoute("/login")).toBe(false);
    expect(isAuthenticatedShellRoute("/login")).toBe(false);
  });

  it("preserves compatibility routes as shell routes without making them protected", () => {
    expect(isProtectedAppRoute("/today")).toBe(false);
    expect(isProtectedAppRoute("/check-in")).toBe(false);
    expect(isAuthenticatedShellRoute("/today")).toBe(true);
    expect(isAuthenticatedShellRoute("/check-in")).toBe(true);
  });
});
