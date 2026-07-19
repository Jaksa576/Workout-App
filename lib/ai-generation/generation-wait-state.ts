export const GENERATION_LONG_RUNNING_THRESHOLD_MS = 45_000;

const activityMessages = [
  "Creating your program structure\u2026",
  "Building workouts around your schedule\u2026",
  "Adding exercises and prescriptions\u2026",
  "Validating the draft and preparing it for review\u2026"
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

type BeforeUnloadTarget = Pick<Window, "addEventListener" | "removeEventListener" | "confirm" | "location">;
type ClickListenerTarget = Pick<Document, "addEventListener" | "removeEventListener">;

function findNavigationLink(target: EventTarget | null) {
  if (!target || typeof (target as Element).closest !== "function") return null;
  return (target as Element).closest("a[href]") as HTMLAnchorElement | null;
}

export function attachGenerationNavigationWarning(
  target: BeforeUnloadTarget,
  documentTarget: ClickListenerTarget = document,
) {
  const onBeforeUnload = (event: BeforeUnloadEvent) => {
    event.preventDefault();
    event.returnValue = "";
  };
  const cleanup = () => {
    target.removeEventListener("beforeunload", onBeforeUnload);
    documentTarget.removeEventListener("click", onDocumentClick, true);
  };
  const onDocumentClick = (event: MouseEvent) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) return;

    const link = findNavigationLink(event.target);
    if (
      !link ||
      link.origin !== target.location.origin ||
      (link.target && link.target !== "_self") ||
      link.hasAttribute("download")
    ) return;

    event.preventDefault();
    if (target.confirm("A draft is still being generated. Leave without saving it?")) {
      cleanup();
      target.location.assign(link.href);
    }
  };

  target.addEventListener("beforeunload", onBeforeUnload);
  documentTarget.addEventListener("click", onDocumentClick, true);
  return cleanup;
}