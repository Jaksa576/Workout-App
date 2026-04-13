"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import type { WorkoutPlan } from "@/lib/types";

type DeleteTarget = "phase" | "workout" | "exercise" | "plan";

type PlanManagementActionsProps = {
  plan: WorkoutPlan;
};

function getWorkoutCount(plan: WorkoutPlan, phaseId: string) {
  return plan.workouts.filter((workout) => workout.phaseId === phaseId).length;
}

export function PlanManagementActions({ plan }: PlanManagementActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);

  async function runDelete(target: DeleteTarget, id: string, label: string) {
    const message =
      target === "plan"
        ? `Archive ${label}? It will stop driving workouts, but your history stays available.`
        : `Delete ${label} from this plan? Past logs stay available for history.`;

    if (!window.confirm(message)) {
      return;
    }

    setWorkingId(id);
    setStatus(null);

    const path =
      target === "plan"
        ? `/api/plans/${id}`
        : target === "phase"
          ? `/api/phases/${id}`
          : target === "workout"
            ? `/api/workouts/${id}`
            : `/api/exercises/${id}`;

    try {
      const response = await fetch(path, { method: "DELETE" });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to update this plan.");
      }

      if (target === "plan") {
        router.push("/plans" as Route);
        router.refresh();
        return;
      }

      setStatus("Plan updated.");
      startTransition(() => router.refresh());
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to update this plan.");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <section className="rounded-[24px] border border-white/70 bg-[#fffdf9]/85 p-5 shadow-card sm:rounded-[32px] sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate sm:tracking-[0.22em]">Plan management</p>
      <h2 className="mt-2 font-display text-2xl leading-tight text-ink sm:text-3xl">Edit plan structure</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate">
        Delete mistakes from the plan. Completed workout history stays saved.
      </p>

      <div className="mt-6 space-y-4">
        {plan.phases.map((phase) => {
          const phaseWorkouts = plan.workouts.filter((workout) => workout.phaseId === phase.id);
          const phaseDeleteDisabled = plan.phases.length <= 1;

          return (
            <div key={phase.id} className="rounded-[28px] bg-white/70 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate">
                    Phase {phase.phaseNumber}
                  </p>
                  <p className="mt-2 font-semibold text-ink">{phase.goal}</p>
                </div>
                <button
                  type="button"
                  onClick={() => runDelete("phase", phase.id, `Phase ${phase.phaseNumber}`)}
                  disabled={phaseDeleteDisabled || workingId === phase.id || isPending}
                className="rounded-full border border-coral/30 bg-white px-4 py-2 text-sm font-semibold text-coral transition hover:border-coral hover:bg-coral/5 disabled:opacity-45"
                >
                  {workingId === phase.id ? "Deleting..." : "Delete Phase"}
                </button>
              </div>
              {phaseDeleteDisabled ? (
                <p className="mt-2 text-sm leading-6 text-slate">
                  A plan needs at least one phase.
                </p>
              ) : null}

              <div className="mt-4 space-y-3">
                {phaseWorkouts.map((workout) => {
                  const workoutDeleteDisabled = getWorkoutCount(plan, phase.id) <= 1;

                  return (
                    <div key={workout.id} className="rounded-3xl bg-[#fffdf9] p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold text-ink">{workout.name}</p>
                          <p className="mt-1 text-sm leading-6 text-slate">
                            {workout.exercises.length}{" "}
                            {workout.exercises.length === 1 ? "exercise" : "exercises"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => runDelete("workout", workout.id, workout.name)}
                          disabled={workoutDeleteDisabled || workingId === workout.id || isPending}
                          className="rounded-full border border-coral/30 bg-white px-4 py-2 text-sm font-semibold text-coral transition hover:border-coral hover:bg-coral/5 disabled:opacity-45"
                        >
                          {workingId === workout.id ? "Deleting..." : "Delete Workout"}
                        </button>
                      </div>
                      {workoutDeleteDisabled ? (
                        <p className="mt-2 text-sm leading-6 text-slate">
                          A phase needs at least one workout.
                        </p>
                      ) : null}

                      <div className="mt-3 grid gap-2">
                        {workout.exercises.map((exercise) => {
                          const exerciseDeleteDisabled = workout.exercises.length <= 1;

                          return (
                            <div
                              key={exercise.id}
                              className="flex flex-col gap-2 rounded-2xl bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <p className="text-sm font-semibold text-ink">{exercise.name}</p>
                              <button
                                type="button"
                                onClick={() => runDelete("exercise", exercise.id, exercise.name)}
                                disabled={
                                  exerciseDeleteDisabled ||
                                  workingId === exercise.id ||
                                  isPending
                                }
                                className="rounded-full border border-coral/30 bg-white px-3 py-2 text-xs font-semibold text-coral transition hover:border-coral hover:bg-coral/5 disabled:opacity-45"
                              >
                                {workingId === exercise.id ? "Deleting..." : "Delete Exercise"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      {workout.exercises.length <= 1 ? (
                        <p className="mt-2 text-sm leading-6 text-slate">
                          A workout needs at least one exercise.
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 border-t border-ink/10 pt-5">
        <button
          type="button"
          onClick={() => runDelete("plan", plan.id, plan.name)}
          disabled={workingId === plan.id || isPending}
          className="rounded-full border border-ink/10 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-coral hover:text-coral disabled:opacity-45"
        >
          {workingId === plan.id ? "Archiving..." : "Archive Plan"}
        </button>
      </div>

      {status ? <p className="mt-4 text-sm leading-6 text-slate">{status}</p> : null}
    </section>
  );
}
