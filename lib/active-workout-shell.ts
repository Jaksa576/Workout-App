export type WorkoutFlowMode = "selection" | "active";
export type WorkoutFlowStep = "idle" | "workout" | "check-in" | "saved";

export function getRecoveredDraftStep(input: {
  mode: WorkoutFlowMode;
  stale: boolean;
  lifecycle: "active" | "finishing" | "save_failed";
}): WorkoutFlowStep {
  if (input.mode === "selection" || input.stale) {
    return "idle";
  }

  return input.lifecycle === "finishing" || input.lifecycle === "save_failed"
    ? "check-in"
    : "workout";
}

export function canFinishActiveWorkout(input: {
  mode: WorkoutFlowMode;
  hasActiveDraft: boolean;
  step: WorkoutFlowStep;
  awaitingStaleRecoveryDecision: boolean;
  hasMalformedRecoveryData: boolean;
  saving: boolean;
}) {
  return (
    input.mode === "active" &&
    input.hasActiveDraft &&
    input.step === "workout" &&
    !input.awaitingStaleRecoveryDecision &&
    !input.hasMalformedRecoveryData &&
    !input.saving
  );
}

export function canRenderExecutionUi(input: {
  mode: WorkoutFlowMode;
  step: WorkoutFlowStep;
}) {
  return input.mode === "active" && input.step !== "idle";
}

export function shouldShowActiveStartCard(input: {
  mode: WorkoutFlowMode;
  hasActiveDraft: boolean;
  hasMalformedRecoveryData: boolean;
  step: WorkoutFlowStep;
}) {
  return (
    input.mode === "active" &&
    !input.hasActiveDraft &&
    !input.hasMalformedRecoveryData &&
    input.step !== "saved"
  );
}

export function getDiscardRedirectPath(workoutId: string) {
  return `/workout?workoutId=${encodeURIComponent(workoutId)}`;
}
