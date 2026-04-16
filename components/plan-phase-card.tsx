import { formatPhaseLabel } from "@/lib/plan-labels";
import type { PhaseProgressSummary, PlanPhase, WorkoutTemplate } from "@/lib/types";
import { ProgressBadge } from "@/components/progress-badge";

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

  return (
    <section className="surface-card-soft p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <ProgressBadge label={formatPhaseLabel(phase.phaseNumber)} tone="ink" />
            <ProgressBadge label={isCurrent ? "Current phase" : "Saved phase"} tone={isCurrent ? "gold" : "green"} />
          </div>
          <h3 className="mt-4 text-xl font-semibold text-copy sm:text-2xl">{phase.goal}</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            {workouts.length} {workouts.length === 1 ? "workout" : "workouts"} and {exerciseTotal}{" "}
            {exerciseTotal === 1 ? "exercise" : "exercises"} in this phase.
          </p>
        </div>
        <div className="surface-panel-muted min-w-[13rem]">
          <p className="ui-eyebrow">Structure</p>
          <p className="mt-2 text-sm font-semibold text-copy">
            {workouts.length} {workouts.length === 1 ? "workout" : "workouts"}
          </p>
          <p className="mt-1 text-sm leading-6 text-muted">
            Weekly work stays readable here even after future plan edits.
          </p>
        </div>
      </div>

      {isCurrent && progress ? (
        <div className="surface-panel mt-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="ui-eyebrow">Current progress</p>
              <p className="mt-2 text-base font-semibold text-copy">{progress.recommendation}</p>
            </div>
            <p className="text-sm font-semibold text-copy">{progress.completionPercent}%</p>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-shell-elevated">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${progress.completionPercent}%` }}
            />
          </div>
          <p className="mt-3 text-sm leading-6 text-muted">
            {progress.cleanSessions} of {progress.requiredCleanSessions} clean sessions and{" "}
            {progress.painFlags} {progress.painFlags === 1 ? "pain flag" : "pain flags"}.
          </p>
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="surface-panel">
          <p className="ui-eyebrow">Rules</p>
          <div className="mt-3 space-y-3 text-sm leading-6 text-copy">
            <p>
              <span className="font-semibold">Advance:</span> {phase.advanceCriteria}
            </p>
            <p>
              <span className="font-semibold">Deload:</span> {phase.deloadCriteria}
            </p>
          </div>
        </div>
        <div className="surface-panel">
          <p className="ui-eyebrow">Workouts</p>
          <div className="mt-3 space-y-3">
            {workouts.map((workout) => (
              <div
                key={workout.id}
                className="rounded-[18px] border border-border/70 bg-surface px-4 py-3"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-copy">{workout.name}</p>
                    <p className="text-sm leading-6 text-muted">{workout.focus}</p>
                  </div>
                  <p className="text-sm font-semibold text-copy">
                    {workout.exercises.length}{" "}
                    {workout.exercises.length === 1 ? "exercise" : "exercises"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
