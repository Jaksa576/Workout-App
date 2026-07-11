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
    expect(source).not.toContain('import { TimerCard }');
    expect(source).not.toContain('<TimerCard />');
    expect(source).not.toContain(
      "Start creates one local active draft for this signed-in user and browser.",
    );
  });

  it("uses only the recommended workout name and summary in the recommendation card", () => {
    const start = source.indexOf(
      '<p className="ui-eyebrow">Recommended today</p>',
    );
    const end = source.indexOf('{workouts.length > 1 ?', start);
    const recommendedCard = source.slice(start, end);

    expect(recommendedCard).toContain(
      '{recommendedWorkout?.name ?? workout.name}',
    );
    expect(recommendedCard).toContain(
      '{(recommendedWorkout ?? workout).summary}',
    );
    expect(recommendedCard).not.toContain('formatPhaseLabel');
    expect(recommendedCard).not.toContain('activePlan.currentPhase.goal');
  });
});
