"use client";

import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { returnToPlans } from "@/lib/plans-navigation";

type PlanReturnLinkProps = {
  fromPlans: boolean;
};

export function PlanReturnLink({ fromPlans }: PlanReturnLinkProps) {
  const router = useRouter();
  const isNavigatingRef = useRef(false);

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (isNavigatingRef.current) {
      event.preventDefault();
      return;
    }

    isNavigatingRef.current = true;
    event.preventDefault();
    returnToPlans(router, fromPlans);
  }

  return (
    <Link
      href="/plans"
      onClick={handleClick}
      className="rounded-full border border-white/20 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-hero"
    >
      Back to plans
    </Link>
  );
}
