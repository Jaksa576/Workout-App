export const PLANS_LIST_ORIGIN = "plans";
export const PLANS_DETAIL_RETURN_MARKER_KEY = "workout-app:plans-detail-return";
const PLANS_DETAIL_RETURN_MARKER_MAX_AGE_MS = 5 * 60 * 1000;

type PlansDetailReturnMarker = {
  origin: typeof PLANS_LIST_ORIGIN;
  planId: string;
  createdAt: number;
};

export function getPlanDetailHref(planId: string) {
  return `/plans/${planId}?from=${PLANS_LIST_ORIGIN}`;
}

export function isPlansListOrigin(origin: string | string[] | undefined) {
  return origin === PLANS_LIST_ORIGIN;
}

function getSessionStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function markPlansDetailNavigation(planId: string) {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  const marker: PlansDetailReturnMarker = {
    origin: PLANS_LIST_ORIGIN,
    planId,
    createdAt: Date.now(),
  };

  try {
    storage.setItem(PLANS_DETAIL_RETURN_MARKER_KEY, JSON.stringify(marker));
  } catch {
    // Storage can be disabled without preventing ordinary link navigation.
  }
}

export function clearPlansReturnMarker() {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(PLANS_DETAIL_RETURN_MARKER_KEY);
  } catch {
    // Storage can be disabled without affecting the safe route fallback.
  }
}

function readPlansReturnMarker(): PlansDetailReturnMarker | null {
  const storage = getSessionStorage();
  if (!storage) {
    return null;
  }

  try {
    const value = storage.getItem(PLANS_DETAIL_RETURN_MARKER_KEY);
    if (!value) {
      return null;
    }

    const marker: unknown = JSON.parse(value);
    if (
      typeof marker !== "object" ||
      marker === null ||
      !Object.hasOwn(marker, "origin") ||
      !Object.hasOwn(marker, "planId") ||
      !Object.hasOwn(marker, "createdAt") ||
      (marker as Record<string, unknown>).origin !== PLANS_LIST_ORIGIN ||
      typeof (marker as Record<string, unknown>).planId !== "string" ||
      typeof (marker as Record<string, unknown>).createdAt !== "number"
    ) {
      clearPlansReturnMarker();
      return null;
    }

    const typedMarker = marker as PlansDetailReturnMarker;
    if (
      !Number.isFinite(typedMarker.createdAt) ||
      typedMarker.createdAt > Date.now() ||
      Date.now() - typedMarker.createdAt > PLANS_DETAIL_RETURN_MARKER_MAX_AGE_MS
    ) {
      clearPlansReturnMarker();
      return null;
    }

    return typedMarker;
  } catch {
    clearPlansReturnMarker();
    return null;
  }
}

/**
 * Verifies that this tab's current detail route was reached by an ordinary
 * same-tab link from /plans, rather than trusting the URL query alone.
 */
export function canReturnToPlansFromHistory(planId: string, fromPlans: boolean) {
  if (!fromPlans) {
    clearPlansReturnMarker();
    return false;
  }

  const marker = readPlansReturnMarker();
  if (!marker || marker.planId !== planId) {
    clearPlansReturnMarker();
    return false;
  }

  return true;
}

export function consumePlansReturnMarker(planId: string) {
  const marker = readPlansReturnMarker();
  if (!marker || marker.planId !== planId) {
    clearPlansReturnMarker();
    return false;
  }

  clearPlansReturnMarker();
  return true;
}

type PlansReturnRouter = {
  back: () => void;
  push: (href: "/plans") => void;
};

/**
 * Keeps plan-list returns on the existing browser history entry when the
 * detail route was explicitly opened from /plans. Other entry points use the
 * stable list fallback instead of guessing from unrelated history entries.
 */
export function returnToPlans(router: PlansReturnRouter, planId: string, fromPlans: boolean) {
  if (canReturnToPlansFromHistory(planId, fromPlans) && consumePlansReturnMarker(planId)) {
    router.back();
    return;
  }

  router.push("/plans");
}
