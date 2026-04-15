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
    <section className="rounded-[24px] border border-white/70 bg-[#fffdf9]/85 p-5 shadow-card sm:rounded-[32px] sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate sm:tracking-[0.22em]">Phase progress</p>
      <h2 className="mt-2 font-display text-2xl leading-tight text-ink sm:text-3xl">
        {formatPhaseLabel(plan.currentPhase.phaseNumber)}
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate">{progress.reason}</p>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="font-semibold text-ink">Exit criteria progress</p>
          <p className="font-semibold text-ink">{progress.completionPercent}%</p>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-mist">
          <div
            className="h-full rounded-full bg-coral"
            style={{ width: `${progress.completionPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl bg-white/70 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate">Clean sessions</p>
          <p className="mt-2 text-xl font-semibold text-ink">
            {progress.cleanSessions} of {progress.requiredCleanSessions}
          </p>
        </div>
        <div className="rounded-3xl bg-white/70 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate">Pain flags</p>
          <p className="mt-2 text-xl font-semibold text-ink">{progress.painFlags}</p>
        </div>
        <div className="rounded-3xl bg-white/70 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate">Next step</p>
          <p className="mt-2 text-xl font-semibold text-ink">{progress.recommendation}</p>
        </div>
      </div>

      {plan.completedAt ? (
        <p className="mt-5 rounded-3xl bg-moss/10 px-4 py-3 text-sm leading-6 text-ink">
          This plan is marked complete and kept for reference.
        </p>
      ) : !isPlanMode && progress.canAdvance ? (
        <div className="mt-5 rounded-3xl bg-coral/10 p-4">
          <p className="text-sm font-semibold text-ink">Ready to review the next phase.</p>
          <p className="mt-2 text-sm leading-6 text-slate">
            You met the criteria. Review the plan before moving forward.
          </p>
          <Link
            href={`/plans/${plan.id}` as Route}
            className="mt-4 inline-flex w-full justify-center rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#f95a2b] sm:w-auto"
          >
            Review Plan Progress
          </Link>
        </div>
      ) : !isPlanMode ? (
        <p className="mt-5 rounded-3xl bg-white/70 px-4 py-3 text-sm leading-6 text-slate">
          Keep logging workouts here. Manual phase changes live on the plan page.
        </p>
      ) : (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {progress.canAdvance && nextPhaseName ? (
            <button
              type="button"
              onClick={() => runAction("advance")}
              disabled={isPending || Boolean(workingAction)}
              className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#f95a2b] disabled:opacity-60"
            >
              {workingAction === "advance" ? "Moving..." : `Move to ${nextPhaseName}`}
            </button>
          ) : progress.nextPhaseId ? (
            <button
              type="button"
              onClick={() => runAction("force_advance")}
              disabled={isPending || Boolean(workingAction)}
              className="rounded-full border border-coral/30 bg-white px-5 py-3 text-sm font-semibold text-coral transition hover:border-coral disabled:opacity-60"
            >
              {workingAction === "force_advance" ? "Moving..." : "Move Anyway"}
            </button>
          ) : null}

          {progress.canComplete ? (
            <button
              type="button"
              onClick={() => runAction("complete_plan")}
              disabled={isPending || Boolean(workingAction)}
              className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:opacity-60"
            >
              {workingAction === "complete_plan" ? "Completing..." : "Mark Plan Complete"}
            </button>
          ) : null}

          {previousPhaseName ? (
            <button
              type="button"
              onClick={() => runAction("return_previous")}
              disabled={isPending || Boolean(workingAction)}
              className="rounded-full border border-ink/10 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-coral hover:text-coral disabled:opacity-60"
            >
              {workingAction === "return_previous" ? "Moving..." : `Return to ${previousPhaseName}`}
            </button>
          ) : null}
        </div>
      )}

      {status ? <p className="mt-4 text-sm leading-6 text-slate">{status}</p> : null}
    </section>
  );
}
