import clsx from "clsx";
import { ProgressBadge } from "@/components/progress-badge";
import { SurfaceCard } from "@/components/surface-card";
import { formatPhaseLabel } from "@/lib/plan-labels";
import type { PhaseProgressSummary, PlanPhase, WorkoutTemplate } from "@/lib/types";

type PlanPhaseCardProps = {
  phase: PlanPhase;
  workouts: WorkoutTemplate[];
  isCurrent: boolean;
  progress?: PhaseProgressSummary | null;
};

export function PlanPhaseCard({
  phase,
  workouts,
  isCurrent,
  progress
}: PlanPhaseCardProps) {
  const exerciseTotal = workouts.reduce(
    (total, workout) => total + workout.exercises.length,
    0
  );
  const progressPercent = progress?.completionPercent ?? 0;

  return (
    <SurfaceCard className={clsx(isCurrent && "border-primary/30 bg-primary/8")}>
      <div className="grid gap-5 lg:grid-cols-[180px_minmax(0,1fr)]">
        <div className="flex gap-4 lg:block">
          <div
            className={clsx(
              "flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] text-2xl font-black",
              isCurrent ? "bg-hero text-white" : "bg-surface-soft text-copy"
            )}
          >
            {phase.phaseNumber}
          </div>
          <div className="min-w-0 lg:mt-5">
            <p className="ui-eyebrow">{formatPhaseLabel(phase.phaseNumber)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ProgressBadge
                label={isCurrent ? "Current phase" : "Saved phase"}
                tone={isCurrent ? "green" : "blue"}
              />
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <h3 className="text-2xl font-black leading-tight text-copy">{phase.goal}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">
                {workouts.length} {workouts.length === 1 ? "workout" : "workouts"} and{" "}
                {exerciseTotal} {exerciseTotal === 1 ? "exercise" : "exercises"} in this phase.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-[18rem]">
              <PhaseStat label="Workouts" value={String(workouts.length)} />
              <PhaseStat label="Exercises" value={String(exerciseTotal)} />
            </div>
          </div>

          {isCurrent && progress ? (
            <div className="mt-5 rounded-[24px] border border-primary/25 bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="ui-eyebrow">Progression signal</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-copy">
                    {progress.recommendation}
                  </p>
                </div>
                <span className="rounded-full bg-primary/12 px-3 py-1.5 text-xs font-bold text-primary">
                  {progressPercent}%
                </span>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-shell-elevated">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">
                {progress.cleanSessions} of {progress.requiredCleanSessions} clean sessions and{" "}
                {progress.painFlags} {progress.painFlags === 1 ? "pain flag" : "pain flags"}.
              </p>
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
            <div className="rounded-[24px] border border-border bg-surface-soft p-4">
              <p className="ui-eyebrow">Rules</p>
              <div className="mt-4 grid gap-3">
                <RuleCard label="Advance" value={phase.advanceCriteria} />
                <RuleCard label="Deload" value={phase.deloadCriteria} />
              </div>
            </div>

            <div className="rounded-[24px] border border-border bg-surface-soft p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="ui-eyebrow">Workouts</p>
                <span className="text-xs font-bold text-muted">
                  {workouts.length} total
                </span>
              </div>
              <div className="mt-4 grid gap-3">
                {workouts.map((workout) => (
                  <div
                    key={workout.id}
                    className="rounded-[20px] border border-border/70 bg-surface px-4 py-3"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-black text-copy">{workout.name}</p>
                        <p className="mt-1 text-sm leading-6 text-muted">{workout.focus}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-surface-soft px-3 py-1.5 text-xs font-bold text-muted">
                        {workout.exercises.length}{" "}
                        {workout.exercises.length === 1 ? "exercise" : "exercises"}
                      </span>
                    </div>
                    {workout.scheduledDays.length > 0 ? (
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                        {workout.scheduledDays.join(" / ")}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}

function PhaseStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-soft p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-2 text-2xl font-black text-copy">{value}</p>
    </div>
  );
}

function RuleCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface px-3 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-copy">{value}</p>
    </div>
  );
}
