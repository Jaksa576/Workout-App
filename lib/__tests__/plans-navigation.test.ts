import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isSameTabPlanDetailClick } from "@/components/plans-detail-link";
import {
  PLANS_DETAIL_RETURN_MARKER_KEY,
  canReturnToPlansFromHistory,
  getPlanDetailHref,
  markPlansDetailNavigation,
  returnToPlans,
} from "@/lib/plans-navigation";

function createStorage() {
  const values = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    removeItem: vi.fn((key: string) => values.delete(key)),
  };
}

function useSessionStorage(storage = createStorage()) {
  vi.stubGlobal("window", { sessionStorage: storage });
  return storage;
}

function clickEvent(overrides: Partial<React.MouseEvent<HTMLAnchorElement>> = {}) {
  return {
    defaultPrevented: false,
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    ...overrides,
  } as React.MouseEvent<HTMLAnchorElement>;
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("plans list/detail return navigation", () => {
  it("marks an ordinary same-tab plans-list detail navigation", () => {
    const storage = useSessionStorage();

    expect(getPlanDetailHref("plan-123")).toBe("/plans/plan-123?from=plans");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-24T04:00:00Z"));
    markPlansDetailNavigation("plan-123");

    expect(storage.setItem).toHaveBeenCalledWith(
      PLANS_DETAIL_RETURN_MARKER_KEY,
      JSON.stringify({ origin: "plans", planId: "plan-123", createdAt: Date.now() }),
    );
    expect(canReturnToPlansFromHistory("plan-123", true)).toBe(true);
  });

  it("returns through browser history only for matching URL context and marker", () => {
    const storage = useSessionStorage();
    const router = { back: vi.fn(), push: vi.fn() };
    markPlansDetailNavigation("plan-123");

    returnToPlans(router, "plan-123", true);

    expect(router.back).toHaveBeenCalledOnce();
    expect(router.push).not.toHaveBeenCalled();
    expect(storage.removeItem).toHaveBeenCalledWith(PLANS_DETAIL_RETURN_MARKER_KEY);
  });

  it("falls back for copied, direct, and new-tab URLs without a marker", () => {
    const router = { back: vi.fn(), push: vi.fn() };
    useSessionStorage();

    returnToPlans(router, "plan-123", true);

    expect(router.back).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith("/plans");
  });

  it("falls back for direct or Dashboard-origin detail entries even with a leftover marker", () => {
    const storage = useSessionStorage();
    const router = { back: vi.fn(), push: vi.fn() };
    markPlansDetailNavigation("plan-123");

    returnToPlans(router, "plan-123", false);

    expect(router.back).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith("/plans");
    expect(storage.removeItem).toHaveBeenCalledWith(PLANS_DETAIL_RETURN_MARKER_KEY);
  });

  it("falls back and clears a marker for a different plan", () => {
    const storage = useSessionStorage();
    const router = { back: vi.fn(), push: vi.fn() };
    markPlansDetailNavigation("plan-a");

    returnToPlans(router, "plan-b", true);

    expect(router.back).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith("/plans");
    expect(storage.removeItem).toHaveBeenCalledWith(PLANS_DETAIL_RETURN_MARKER_KEY);
  });

  it("falls back and clears malformed markers", () => {
    const storage = useSessionStorage();
    const router = { back: vi.fn(), push: vi.fn() };
    storage.setItem(PLANS_DETAIL_RETURN_MARKER_KEY, "not-json");

    returnToPlans(router, "plan-123", true);

    expect(router.back).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith("/plans");
    expect(storage.removeItem).toHaveBeenCalledWith(PLANS_DETAIL_RETURN_MARKER_KEY);
  });

  it("falls back and clears stale markers", () => {
    const storage = useSessionStorage();
    const router = { back: vi.fn(), push: vi.fn() };
    storage.setItem(
      PLANS_DETAIL_RETURN_MARKER_KEY,
      JSON.stringify({ origin: "plans", planId: "plan-123", createdAt: 0 }),
    );

    returnToPlans(router, "plan-123", true);

    expect(router.back).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith("/plans");
    expect(storage.removeItem).toHaveBeenCalledWith(PLANS_DETAIL_RETURN_MARKER_KEY);
  });

  it("consumes a matching marker before back so it cannot authorize a second traversal", () => {
    const storage = useSessionStorage();
    const router = { back: vi.fn(), push: vi.fn() };
    markPlansDetailNavigation("plan-123");

    returnToPlans(router, "plan-123", true);
    returnToPlans(router, "plan-123", true);

    expect(router.back).toHaveBeenCalledOnce();
    expect(router.push).toHaveBeenCalledOnce();
  });

  it("does not mark modified clicks or block their native link behavior", () => {
    expect(isSameTabPlanDetailClick(clickEvent())).toBe(true);
    expect(isSameTabPlanDetailClick(clickEvent({ ctrlKey: true }))).toBe(false);
    expect(isSameTabPlanDetailClick(clickEvent({ metaKey: true }))).toBe(false);
    expect(isSameTabPlanDetailClick(clickEvent({ shiftKey: true }))).toBe(false);
    expect(isSameTabPlanDetailClick(clickEvent({ button: 1 }))).toBe(false);

    const detailLink = readFileSync("components/plans-detail-link.tsx", "utf8");
    expect(detailLink).not.toContain("preventDefault");
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
      "components/plans-detail-link.tsx",
      "components/plan-return-link.tsx",
      "lib/plans-navigation.ts",
    ].map((path) => readFileSync(path, "utf8"));

    expect(sources.join("\n")).not.toContain('history.scrollRestoration = "manual"');
  });
});
