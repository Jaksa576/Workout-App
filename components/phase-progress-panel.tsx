"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { formatPhaseLabel } from "@/lib/plan-labels";
import type { PhaseProgressSummary, WorkoutPlan } from "@/lib/types";

type PhaseAction = "advance" | "force_advance" | "return_previous" | "complete_plan";

type PhaseProgressPanelProps = {
  plan: WorkoutPlan;
  progress: PhaseProgressSummary;
  mode?: "plan" | "workout";
};

function getPhaseName(plan: WorkoutPlan, phaseId: string | null) {
  const phase = plan.phases.find((item) => item.id === phaseId);
  return phase ? formatPhaseLabel(phase.phaseNumber) : null;
}

export function PhaseProgressPanel({
  plan,
  progress,
  mode = "plan"
}: PhaseProgressPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const [workingAction, setWorkingAction] = useState<PhaseAction | null>(null);
  const nextPhaseName = getPhaseName(plan, progress.nextPhaseId);
  const previousPhaseName = getPhaseName(plan, progress.previousPhaseId);
  const isPlanMode = mode === "plan";

  async function runAction(action: PhaseAction) {
    if (
      action === "force_advance" &&
      !window.confirm(
        "This phase has not met the criteria yet. Move to the next phase anyway?"
      )
    ) {
      return;
    }

    if (
      action === "return_previous" &&
      !window.confirm("Return this plan to the previous phase?")
    ) {
      return;
    }

    if (
      action === "complete_plan" &&
      !window.confirm("Mark this plan complete? You can still view it later.")
    ) {
      return;
    }

    setWorkingAction(action);
    setStatus(null);

    try {
      const response = await fetch(`/api/plans/${plan.id}/phase-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to update phase.");
      }

      setStatus("Plan updated.");
      startTransition(() => router.refresh());
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to update phase.");
    } finally {
      setWorkingAction(null);
    }
  }

  return (
    <section className="surface-card p-5 sm:p-6">
      <p className="ui-eyebrow">Phase progress</p>
      <h2 className="mt-2 font-display text-2xl leading-tight text-copy sm:text-3xl">
        {formatPhaseLabel(plan.currentPhase.phaseNumber)}
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted">{progress.reason}</p>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="font-semibold text-copy">Exit criteria progress</p>
          <p className="font-semibold text-copy">{progress.completionPercent}%</p>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-shell-elevated">
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${progress.completionPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="surface-panel">
          <p className="ui-eyebrow">Clean sessions</p>
          <p className="mt-2 text-xl font-semibold text-copy">
            {progress.cleanSessions} of {progress.requiredCleanSessions}
          </p>
        </div>
        <div className="surface-panel">
          <p className="ui-eyebrow">Pain flags</p>
          <p className="mt-2 text-xl font-semibold text-copy">{progress.painFlags}</p>
        </div>
        <div className="surface-panel">
          <p className="ui-eyebrow">Next step</p>
          <p className="mt-2 text-xl font-semibold text-copy">{progress.recommendation}</p>
        </div>
      </div>

      {plan.completedAt ? (
        <p className="mt-5 rounded-3xl bg-success/10 px-4 py-3 text-sm leading-6 text-copy">
          This plan is marked complete and kept for reference.
        </p>
      ) : !isPlanMode && progress.canAdvance ? (
        <div className="mt-5 rounded-3xl bg-accent/10 p-4">
          <p className="text-sm font-semibold text-copy">Ready to review the next phase.</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            You met the criteria. Review the plan before moving forward.
          </p>
          <Link
            href={`/plans/${plan.id}` as Route}
            className="ui-button-primary mt-4 inline-flex w-full justify-center sm:w-auto"
          >
            Review Plan Progress
          </Link>
        </div>
      ) : !isPlanMode ? (
        <p className="mt-5 rounded-3xl bg-surface-soft/85 px-4 py-3 text-sm leading-6 text-muted">
          Keep logging workouts here. Manual phase changes live on the plan page.
        </p>
      ) : (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {progress.canAdvance && nextPhaseName ? (
            <button
              type="button"
              onClick={() => runAction("advance")}
              disabled={isPending || Boolean(workingAction)}
              className="ui-button-primary disabled:opacity-60"
            >
              {workingAction === "advance" ? "Moving..." : `Move to ${nextPhaseName}`}
            </button>
          ) : progress.nextPhaseId ? (
            <button
              type="button"
              onClick={() => runAction("force_advance")}
              disabled={isPending || Boolean(workingAction)}
              className="ui-button-secondary disabled:opacity-60"
            >
              {workingAction === "force_advance" ? "Moving..." : "Move Anyway"}
            </button>
          ) : null}

          {progress.canComplete ? (
            <button
              type="button"
              onClick={() => runAction("complete_plan")}
              disabled={isPending || Boolean(workingAction)}
              className="rounded-full bg-hero px-5 py-3 text-sm font-semibold text-white transition hover:bg-hero/90 disabled:opacity-60"
            >
              {workingAction === "complete_plan" ? "Completing..." : "Mark Plan Complete"}
            </button>
          ) : null}

          {previousPhaseName ? (
            <button
              type="button"
              onClick={() => runAction("return_previous")}
              disabled={isPending || Boolean(workingAction)}
              className="ui-button-ghost disabled:opacity-60"
            >
              {workingAction === "return_previous" ? "Moving..." : `Return to ${previousPhaseName}`}
            </button>
          ) : null}
        </div>
      )}

      {status ? <p className="mt-4 text-sm leading-6 text-muted">{status}</p> : null}
    </section>
  );
}
