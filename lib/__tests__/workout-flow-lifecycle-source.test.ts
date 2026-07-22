import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getRecoveredDraftStep } from "@/lib/active-workout-shell";

const source = readFileSync("components/workout-flow.tsx", "utf8");

describe("workout flow lifecycle source guards", () => {
  it("keeps stale recovered drafts on an explicit resume/discard decision", () => {
    expect(
      getRecoveredDraftStep({
        mode: "active",
        stale: true,
        lifecycle: "finishing",
      }),
    ).toBe("idle");
    expect(source).toContain("function handleResumeDraft()");
    expect(source).toContain("Resume workout");
    expect(source).toContain("Discard");
  });

  it("allows malformed recovery data to be cleared explicitly", () => {
    expect(source).toContain("invalidRecoveryKey");
    expect(source).toContain("function handleClearRecoveryData()");
    expect(source).toContain("Clear recovery data");
    expect(source).toContain(
      "window.localStorage.removeItem(invalidRecoveryKey)",
    );
  });

  it("returns Start another workout to idle instead of stranded workout step", () => {
    const start = source.indexOf("function handleStartAnotherWorkout()");
    const handler = source.slice(start, source.indexOf("  return (", start));

    expect(handler).toContain("setSavedSession(null)");
    expect(handler).toContain("setActiveDraft(null)");
    expect(handler).toContain('setStep("idle")');
    expect(handler).not.toContain('setStep("workout")');
  });

  it("keeps workout selection concise and free of execution-only timer copy", () => {
    expect(source).not.toContain("import { TimerCard }");
    expect(source).not.toContain("<TimerCard />");
    expect(source).not.toContain(
      "Start creates one local active draft for this signed-in user and browser.",
    );
  });

  it("renders the workout list as the direct start surface without selected/recommended badges", () => {
    expect(source).toContain("Choose today&apos;s workout");
    expect(source).not.toContain(">Workout</p>");
    expect(source).not.toContain("Phase workouts");
    expect(source).not.toContain("Start from the list");
    expect(source).toContain("scheduleLabel");
    expect(source).toContain("handleStartWorkout(item)");
    expect(source).not.toContain(">Recommended<");
    expect(source).not.toContain(">Selected<");
    expect(source).not.toContain("Selected workout");
    expect(source).not.toContain("Resume workout</button>");
    expect(source).toContain("formatExercisePrescription(exercise)");
    expect(source).toContain("remainingExerciseCount");
    expect(source).toContain("+{remainingExerciseCount} more");
    expect(source).not.toContain("Workout details");
    expect(source).not.toContain("Exercise preview");
    expect(source).not.toContain("{item.exercises.length} exercises");
    expect(source).not.toContain("Execute today&apos;s session");
    expect(source).not.toContain("Recommended today");
    expect(source).not.toContain("Other workouts in this phase");
    expect(source).not.toContain("Recent workouts");
    expect(source).not.toContain("Workout rhythm");
    expect(source).not.toContain("Latest suggestion");
  });

  it("freezes and reuses finish elapsed time across review, back, and save", () => {
    expect(source).toContain("finishElapsedSnapshot");
    expect(source).toContain(
      "const snapshot = finishElapsedSnapshot ?? getElapsedSeconds(activeDraft)",
    );
    expect(source).toContain("elapsedOffsetSeconds: snapshot");
    expect(source).toContain("function handleBackToWorkout()");
    expect(source).toContain("elapsedSeconds: activeDraft");
    expect(source).toContain(
      "? (finishElapsedSnapshot ?? getElapsedSeconds(activeDraft))",
    );
  });

  it("uses shared navigation attention for terminal active-workout views", () => {
    expect(source).toContain("directNavigationAttention(checkInHeadingRef.current");
    expect(source).toContain("directNavigationAttention(savedHeadingRef.current");
    expect(source).not.toContain("window.scrollTo({ top: 0, left: 0, behavior: \"auto\" })");
  });

  it("preserves selected-workout card targeting as an explicit selection behavior", () => {
    expect(source).toContain('card.scrollIntoView({ block: "nearest" })');
  });

  it("hides the active sticky header and rest dock padding on finish", () => {
    expect(source).toContain('{step !== "check-in" ? (');
    expect(source).toContain(
      'liveRestTimer.status === "idle" || step === "check-in"',
    );
  });

  it("keeps finish as save, back, then guarded bottom discard", () => {
    const start = source.indexOf('{step === "check-in" ? (');
    const end = source.indexOf('{step === "saved" && savedSession ?', start);
    const finishView = source.slice(start, end);

    expect(finishView).not.toContain("Did you finish?");
    expect(finishView).not.toContain("sets still incomplete");
    expect(finishView).toContain("Save workout");
    expect(finishView).toContain("Back to workout");
    expect(finishView).toContain("Discard workout");
    expect(finishView.indexOf("Save workout")).toBeLessThan(
      finishView.indexOf("Back to workout"),
    );
    expect(finishView.indexOf("Back to workout")).toBeLessThan(
      finishView.indexOf("Discard workout"),
    );
    expect(finishView).toContain("onClick={requestDiscardDraft}");
  });

  it("uses an in-app discard confirmation instead of a native browser prompt", () => {
    const requestStart = source.indexOf("function requestDiscardDraft()");
    const discardStart = source.indexOf("function handleDiscardDraft()");
    const discardEnd = source.indexOf(
      "  function handleClearRecoveryData()",
      discardStart,
    );
    const discardHandler = source.slice(requestStart, discardEnd);

    expect(source).toContain("function DiscardWorkoutDialog(");
    expect(source).toContain("Discard workout?");
    expect(source).toContain("Your progress from this workout will be lost.");
    expect(source).toContain("Keep workout");
    expect(source).toContain("Discard workout");
    expect(discardHandler).not.toContain("window.confirm");
    expect(discardHandler).toContain("setDiscardDialogOpen(true)");
    expect(discardHandler).toContain("setDiscardDialogOpen(false)");
  });

});
