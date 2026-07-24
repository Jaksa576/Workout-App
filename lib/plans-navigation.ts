export const PLANS_LIST_ORIGIN = "plans";

export function getPlanDetailHref(planId: string) {
  return `/plans/${planId}?from=${PLANS_LIST_ORIGIN}`;
}

export function isPlansListOrigin(origin: string | string[] | undefined) {
  return origin === PLANS_LIST_ORIGIN;
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
export function returnToPlans(router: PlansReturnRouter, fromPlans: boolean) {
  if (fromPlans) {
    router.back();
    return;
  }

  router.push("/plans");
}
