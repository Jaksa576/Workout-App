import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  getPlanDetailHref,
  isPlansListOrigin,
  returnToPlans,
} from "@/lib/plans-navigation";

describe("plans list/detail return navigation", () => {
  it("marks plan detail links opened from the plans list", () => {
    expect(getPlanDetailHref("plan-123")).toBe("/plans/plan-123?from=plans");

    const plansPage = readFileSync("app/plans/page.tsx", "utf8");
    expect(plansPage.match(/getPlanDetailHref\(plan\.id\)/g)).toHaveLength(2);
  });

  it("returns through browser history only for the explicit plans-list origin", () => {
    const router = { back: vi.fn(), push: vi.fn() };

    returnToPlans(router, true);

    expect(router.back).toHaveBeenCalledOnce();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("falls back to the plans route for direct or non-plans detail entries", () => {
    const router = { back: vi.fn(), push: vi.fn() };

    returnToPlans(router, false);

    expect(router.back).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith("/plans");
  });

  it("does not infer a list origin from a browser history length", () => {
    expect(isPlansListOrigin(undefined)).toBe(false);
    expect(isPlansListOrigin("dashboard")).toBe(false);
    expect(isPlansListOrigin(["plans"])).toBe(false);
    expect(isPlansListOrigin("plans")).toBe(true);
  });

  it("keeps changed-list archive and delete redirects unchanged", () => {
    const archiveAction = readFileSync("components/plan-archive-action.tsx", "utf8");
    const managementActions = readFileSync("components/plan-management-actions.tsx", "utf8");

    expect(archiveAction).toContain('router.push("/plans" as Route)');
    expect(managementActions).toContain('router.push("/plans" as Route)');
  });

  it("does not introduce a global manual scroll-restoration policy", () => {
    const sources = [
      "app/plans/page.tsx",
      "app/plans/[planId]/page.tsx",
      "components/plan-return-link.tsx",
      "lib/plans-navigation.ts",
    ].map((path) => readFileSync(path, "utf8"));

    expect(sources.join("\n")).not.toContain('history.scrollRestoration = "manual"');
  });
});
