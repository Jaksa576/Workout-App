export type ActiveWorkoutFlowStep = "idle" | "workout" | "check-in" | "saved";

export function shouldPersistActiveWorkoutDraft(input: {
  hasActiveDraft: boolean;
  step: ActiveWorkoutFlowStep;
  awaitingStaleRecoveryDecision: boolean;
}) {
  if (!input.hasActiveDraft || input.step === "saved") {
    return false;
  }

  if (input.awaitingStaleRecoveryDecision && input.step === "idle") {
    return false;
  }

  return true;
}
