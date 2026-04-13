import type {
  PhaseProgressSummary,
  PlanPhase,
  ProgressionDecision,
  WorkoutPlan,
  WorkoutSession
} from "@/lib/types";

type EvaluationInput = {
  plan: WorkoutPlan;
  currentPhase: PlanPhase;
  sessions: WorkoutSession[];
};

export type ProgressionEvaluation = {
  decision: ProgressionDecision;
  recommendation: string;
  reason: string;
  nextPhaseId: string | null;
};

function getNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

function getSessionDate(session: WorkoutSession) {
  return new Date(`${session.completedOn}T00:00:00.000Z`);
}

function getWindowedSessions(sessions: WorkoutSession[], days: number) {
  const cutoff = new Date();
  cutoff.setUTCHours(0, 0, 0, 0);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);

  return sessions.filter((session) => getSessionDate(session) >= cutoff);
}

function isCleanSession(session: WorkoutSession) {
  return (
    session.completed &&
    !session.painOccurred &&
    session.perceivedDifficulty !== "too_hard"
  );
}

function getNextPhase(plan: WorkoutPlan, currentPhase: PlanPhase) {
  return plan.phases
    .slice()
    .sort((a, b) => a.phaseNumber - b.phaseNumber)
    .find((phase) => phase.phaseNumber > currentPhase.phaseNumber);
}

function getPreviousPhase(plan: WorkoutPlan, currentPhase: PlanPhase) {
  return plan.phases
    .slice()
    .sort((a, b) => b.phaseNumber - a.phaseNumber)
    .find((phase) => phase.phaseNumber < currentPhase.phaseNumber);
}

export function calculatePhaseProgress({
  plan,
  currentPhase,
  sessions
}: EvaluationInput): PhaseProgressSummary {
  const recentSessions = sessions.filter(
    (session) => session.phaseIdAtCompletion === currentPhase.id
  );
  const deloadSettings = currentPhase.deloadSettings;
  const painWindowDays = getNumber(deloadSettings.days, 7);
  const painFlags = getWindowedSessions(recentSessions, painWindowDays).filter(
    (session) => session.painOccurred
  ).length;
  const advanceSettings = currentPhase.advancementSettings;
  const requiredCleanSessions = getNumber(advanceSettings.sessions, 4);
  const weeks = getNumber(advanceSettings.weeks, 2);
  const cleanSessions =
    currentPhase.advancementPreset === "clean_sessions_streak"
      ? recentSessions.slice(0, requiredCleanSessions).filter(isCleanSession).length
      : getWindowedSessions(recentSessions, weeks * 7).filter(isCleanSession).length;
  const nextPhase = getNextPhase(plan, currentPhase);
  const previousPhase = getPreviousPhase(plan, currentPhase);
  const baseEvaluation = evaluatePhaseProgression({ plan, currentPhase, sessions });
  const criteriaMet = cleanSessions >= requiredCleanSessions && baseEvaluation.decision !== "deload";

  return {
    decision: baseEvaluation.decision,
    recommendation: baseEvaluation.recommendation,
    reason: baseEvaluation.reason,
    canAdvance: Boolean(nextPhase && criteriaMet),
    canComplete: Boolean(!nextPhase && criteriaMet),
    criteriaMet,
    currentPhaseId: currentPhase.id,
    nextPhaseId: nextPhase?.id ?? null,
    previousPhaseId: previousPhase?.id ?? null,
    cleanSessions,
    requiredCleanSessions,
    painFlags,
    completionPercent: Math.min(100, Math.round((cleanSessions / requiredCleanSessions) * 100))
  };
}

export function evaluatePhaseProgression({
  plan,
  currentPhase,
  sessions
}: EvaluationInput): ProgressionEvaluation {
  const recentSessions = sessions.filter(
    (session) => session.phaseIdAtCompletion === currentPhase.id
  );
  const deloadSettings = currentPhase.deloadSettings;
  const painFlagLimit = getNumber(deloadSettings.painFlags, 2);
  const painWindowDays = getNumber(deloadSettings.days, 7);
  const tooHardStreakLimit = getNumber(deloadSettings.sessions, 2);

  if (currentPhase.deloadPreset === "too_hard_streak") {
    const tooHardStreak = recentSessions
      .slice(0, tooHardStreakLimit)
      .filter((session) => session.perceivedDifficulty === "too_hard").length;

    if (tooHardStreak >= tooHardStreakLimit) {
      return {
        decision: "deload",
        recommendation: "Tough workouts are stacking up",
        reason: `${tooHardStreakLimit} tough sessions in a row. Pause progression and consider reducing load or volume.`,
        nextPhaseId: null
      };
    }
  } else {
    const painFlags = getWindowedSessions(recentSessions, painWindowDays).filter(
      (session) => session.painOccurred
    ).length;

    if (painFlags >= painFlagLimit) {
      return {
        decision: "deload",
        recommendation: "Pain trend needs review",
        reason: `${painFlags} pain flags in the last ${painWindowDays} days. Stay in this phase and review the plan before progressing.`,
        nextPhaseId: null
      };
    }
  }

  if (recentSessions[0]?.painOccurred) {
    return {
      decision: "review",
      recommendation: "Pain logged, pause progression for now",
      reason: "The latest check-in included pain, so the safest next step is to review before moving forward.",
      nextPhaseId: null
    };
  }

  if (recentSessions[0]?.perceivedDifficulty === "too_hard") {
    return {
      decision: "repeat",
      recommendation: "Tough workout, repeat before progressing",
      reason: "The latest workout felt too hard. Repeat this phase until it feels controlled.",
      nextPhaseId: null
    };
  }

  const advanceSettings = currentPhase.advancementSettings;
  const neededSessions = getNumber(advanceSettings.sessions, 4);
  const nextPhase = getNextPhase(plan, currentPhase);
  let cleanSessionCount = 0;
  let advanceReason = "";

  if (currentPhase.advancementPreset === "clean_sessions_streak") {
    cleanSessionCount = recentSessions.slice(0, neededSessions).filter(isCleanSession).length;
    advanceReason = `${cleanSessionCount} of ${neededSessions} clean sessions in a row.`;
  } else {
    const weeks = getNumber(advanceSettings.weeks, 2);
    const sessionsInWindow = getWindowedSessions(recentSessions, weeks * 7);
    cleanSessionCount = sessionsInWindow.filter(isCleanSession).length;
    advanceReason = `${cleanSessionCount} of ${neededSessions} clean sessions in the last ${weeks} weeks.`;
  }

  if (cleanSessionCount >= neededSessions && nextPhase) {
    return {
      decision: "advance",
      recommendation: `Ready for Phase ${nextPhase.phaseNumber}`,
      reason: `${advanceReason} You met the phase progression target.`,
      nextPhaseId: nextPhase.id
    };
  }

  return {
    decision: cleanSessionCount >= neededSessions ? "advance" : "repeat",
    recommendation:
      cleanSessionCount >= neededSessions
        ? "Ready to complete this plan"
        : "Keep going with this phase",
    reason:
      cleanSessionCount >= neededSessions
        ? `${advanceReason} You met the final phase target.`
        : nextPhase
          ? `${advanceReason} Keep building consistency before moving to Phase ${nextPhase.phaseNumber}.`
          : `${advanceReason} This is the final planned phase, so keep using it while it fits.`,
    nextPhaseId: null
  };
}
