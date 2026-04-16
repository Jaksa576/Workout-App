"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type PlanListActionsProps = {
  planId: string;
  isActive: boolean;
  completedAt: string | null;
};

export function PlanListActions({ planId, isActive, completedAt }: PlanListActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);

  async function makeActive() {
    setStatus(null);

    try {
      const response = await fetch(`/api/plans/${planId}/activate`, {
        method: "POST"
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to make this plan active.");
      }

      setStatus("Active plan updated.");
      startTransition(() => router.refresh());
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to make this plan active.");
    }
  }

  if (completedAt) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {!isActive ? (
        <button
          type="button"
          onClick={makeActive}
          disabled={isPending}
          className="ui-button-primary disabled:opacity-60"
        >
          {isPending ? "Updating..." : "Make Active Plan"}
        </button>
      ) : null}
      {status ? <p className="text-sm leading-6 text-muted">{status}</p> : null}
    </div>
  );
}
