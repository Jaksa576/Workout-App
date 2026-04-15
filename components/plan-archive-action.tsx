"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";

type PlanArchiveActionProps = {
  planId: string;
  planName: string;
};

export function PlanArchiveAction({ planId, planName }: PlanArchiveActionProps) {
  const router = useRouter();
  const [isArchiving, setIsArchiving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function archivePlan() {
    const message = `Archive ${planName}? It will stop driving workouts, but your history stays available.`;

    if (!window.confirm(message)) {
      return;
    }

    setIsArchiving(true);
    setStatus(null);

    try {
      const response = await fetch(`/api/plans/${planId}`, { method: "DELETE" });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to update this plan.");
      }

      router.push("/plans" as Route);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to update this plan.");
    } finally {
      setIsArchiving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <button
        type="button"
        onClick={archivePlan}
        disabled={isArchiving}
        className="rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-coral hover:text-coral disabled:opacity-45"
      >
        {isArchiving ? "Archiving..." : "Archive Plan"}
      </button>
      {status ? <p className="text-sm leading-6 text-slate">{status}</p> : null}
    </div>
  );
}
