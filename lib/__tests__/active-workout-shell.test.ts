import { describe, expect, it } from "vitest";
import { getElapsedSeconds } from "@/lib/active-workout-draft";
import {
  canFinishActiveWorkout,
  getDiscardRedirectPath,
  getRecoveredDraftStep,
  shouldShowActiveStartCard,
} from "@/lib/active-workout-shell";
import type { ActiveWorkoutDraft } from "@/lib/active-workout-draft";

function finishState(overrides: Partial<Parameters<typeof canFinishActiveWorkout>[0]> = {}) {
  return canFinishActiveWorkout({
    mode: "active",
    hasActiveDraft: true,
    step: "workout",
    awaitingStaleRecoveryDecision: false,
    hasMalformedRecoveryData: false,
    saving: false,
    ...overrides,
  });
}

describe("active workout shell behavior", () => {
  it("requires stale drafts to open on Resume or Discard before Finish is available", () => {
    const staleStep = getRecoveredDraftStep({
      mode: "active",
      stale: true,
      lifecycle: "active",
    });

    expect(staleStep).toBe("idle");
    expect(
      finishState({
        step: staleStep,
        awaitingStaleRecoveryDecision: true,
      }),
    ).toBe(false);
    expect(
      finishState({
        step: "workout",
        awaitingStaleRecoveryDecision: false,
      }),
    ).toBe(true);
  });

  it("blocks check-in reachability for stale drafts until explicit Resume", () => {
    expect(
      getRecoveredDraftStep({
        mode: "active",
        stale: true,
        lifecycle: "finishing",
      }),
    ).toBe("idle");
    expect(
      getRecoveredDraftStep({
        mode: "active",
        stale: false,
        lifecycle: "finishing",
      }),
    ).toBe("check-in");
  });

  it("keeps the /workout selection route recovery-only for fresh drafts", () => {
    expect(
      getRecoveredDraftStep({
        mode: "selection",
        stale: false,
        lifecycle: "active",
      }),
    ).toBe("idle");
    expect(finishState({ mode: "selection" })).toBe(false);
  });

  it("returns active Discard to workout details", () => {
    expect(getDiscardRedirectPath("workout a/b")).toBe(
      "/workout?workoutId=workout%20a%2Fb",
    );
  });

  it("does not show the active Start card after a saved session", () => {
    expect(
      shouldShowActiveStartCard({
        mode: "active",
        hasActiveDraft: false,
        hasMalformedRecoveryData: false,
        step: "saved",
      }),
    ).toBe(false);
  });

  it("reconstructs elapsed time from durable draft timestamps after refresh or resume", () => {
    const draft: ActiveWorkoutDraft = {
      version: 1,
      lifecycle: "active",
      userId: "user-a",
      draftId: "00000000-0000-4000-8000-000000000123",
      workoutTemplateId: "workout-a",
      planId: "plan-a",
      phaseId: "phase-a",
      workoutNameSnapshot: "Lower Strength",
      startedAt: "2026-07-11T12:00:00.000Z",
      lastUpdatedAt: "2026-07-11T12:10:00.000Z",
      elapsedOffsetSeconds: 30,
      checkedExerciseIds: [],
      checkIn: {
        completedOn: null,
        completed: false,
        painOccurred: false,
        perceivedDifficulty: "appropriate",
        notes: "",
      },
    };

    expect(getElapsedSeconds(draft, new Date("2026-07-11T12:05:00.000Z"))).toBe(330);
  });

  it("keeps Issue #11 retry and stale recovery guards intact", () => {
    expect(finishState({ saving: true })).toBe(false);
    expect(
      finishState({
        step: "idle",
        awaitingStaleRecoveryDecision: true,
      }),
    ).toBe(false);
  });
});
