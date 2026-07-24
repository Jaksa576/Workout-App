"use client";

import Link from "next/link";
import type { Route } from "next";
import type { ComponentProps, MouseEvent } from "react";
import { getPlanDetailHref, markPlansDetailNavigation } from "@/lib/plans-navigation";

type PlanDetailLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  planId: string;
};

export function isSameTabPlanDetailClick(event: MouseEvent<HTMLAnchorElement>) {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

export function PlanDetailLink({ planId, onClick, ...props }: PlanDetailLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (isSameTabPlanDetailClick(event)) {
      markPlansDetailNavigation(planId);
    }
  }

  return <Link {...props} href={getPlanDetailHref(planId) as Route} onClick={handleClick} />;
}
