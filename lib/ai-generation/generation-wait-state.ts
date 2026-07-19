export const GENERATION_LONG_RUNNING_THRESHOLD_MS = 45_000;

const activityMessages = [
  "Creating your program structure…",
  "Building workouts around your schedule…",
  "Adding exercises and prescriptions…",
  "Validating the draft and preparing it for review…"
] as const;

export function formatGenerationElapsedTime(elapsedMs: number) {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0
    ? `${minutes}:${seconds.toString().padStart(2, "0")}`
    : `${seconds}s`;
}

export function getGenerationWaitState(elapsedMs: number) {
  const safeElapsedMs = Math.max(0, elapsedMs);
  return {
    activityMessage: activityMessages[Math.floor(safeElapsedMs / 12_000) % activityMessages.length],
    elapsedLabel: formatGenerationElapsedTime(safeElapsedMs),
    showLongRunningGuidance: safeElapsedMs >= GENERATION_LONG_RUNNING_THRESHOLD_MS
  };
}

type BeforeUnloadTarget = Pick<Window, "addEventListener" | "removeEventListener">;

export function attachGenerationNavigationWarning(target: BeforeUnloadTarget) {
  const onBeforeUnload = (event: BeforeUnloadEvent) => {
    event.preventDefault();
    event.returnValue = "";
  };

  target.addEventListener("beforeunload", onBeforeUnload);
  return () => target.removeEventListener("beforeunload", onBeforeUnload);
}