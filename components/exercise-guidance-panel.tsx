import { hasExerciseGuidance } from "@/lib/exercise-guidance";
import type { ExerciseEntry } from "@/lib/types";

type ExerciseGuidancePanelProps = {
  exercise: ExerciseEntry;
  compact?: boolean;
};

export function ExerciseGuidancePanel({
  exercise,
  compact = false
}: ExerciseGuidancePanelProps) {
  const guidance = exercise.guidance;
  const hasGuidance = hasExerciseGuidance(guidance);
  const hasPrimaryGuidance = Boolean(
    exercise.coachingNote ||
      guidance?.setup ||
      guidance?.executionCues?.length ||
      guidance?.safetyNotes ||
      exercise.videoUrl
  );

  if (!exercise.coachingNote && !hasGuidance && !exercise.videoUrl) {
    return null;
  }

  return (
    <div className="mt-3 rounded-[18px] border border-border bg-surface-soft p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
          Guidance
        </p>
        {exercise.videoUrl ? (
          <a
            href={exercise.videoUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold uppercase tracking-[0.12em] text-primary transition hover:text-accent"
          >
            Watch demo
          </a>
        ) : null}
      </div>

      {guidance?.setup ? (
        <GuidanceText label="Setup" value={guidance.setup} />
      ) : exercise.coachingNote ? (
        <p className="mt-3 text-sm leading-6 text-copy">{exercise.coachingNote}</p>
      ) : null}

      {guidance?.executionCues?.length ? (
        <GuidanceList label="Cues" items={guidance.executionCues} />
      ) : null}

      {guidance?.safetyNotes ? (
        <GuidanceText label="Safety" value={guidance.safetyNotes} />
      ) : null}

      {(!compact || !hasPrimaryGuidance) && guidance?.commonMistakes?.length ? (
        <GuidanceList label="Common mistakes" items={guidance.commonMistakes} />
      ) : null}

      {(!compact || !hasPrimaryGuidance) && guidance?.modifications?.length ? (
        <GuidanceList label="Modifications" items={guidance.modifications} />
      ) : null}

      {!compact && guidance?.videoSearchQuery && !exercise.videoUrl ? (
        <GuidanceText label="Video search" value={guidance.videoSearchQuery} />
      ) : null}

      {guidance?.setup && exercise.coachingNote ? (
        <GuidanceText label="Note" value={exercise.coachingNote} />
      ) : null}
    </div>
  );
}

function GuidanceText({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-copy">{value}</p>
    </div>
  );
}

function GuidanceList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="mt-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <ul className="mt-1 space-y-1 text-sm leading-6 text-copy">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
