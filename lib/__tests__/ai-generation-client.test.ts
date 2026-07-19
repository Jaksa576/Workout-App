import { describe, expect, it, vi } from "vitest";
import {
  applySetupMetadataToAiDraft,
  AiGenerationAttemptGuard,
  getPlanCreationModeTransition,
  isPlanDraftGenerationDisabled,
  mapAiPlanGenerationError,
  requestAiPlanDraft,
  validateAiGenerationSetup
} from "@/lib/ai-generation/client";
import type { PlanSetupInput } from "@/lib/types";

const setup: PlanSetupInput = {
  goalType: "strength",
  objectiveSummary: "Build strength",
  daysPerWeek: 1,
  sessionMinutes: 45,
  weeklySchedule: ["mon"],
  preferredSplit: "full_body",
  focusAreas: ["squat"],
  currentConstraints: [],
  progressionModeOverride: null
};

const normalizedDraft = {
  plan: {
    version: "structured-v1" as const,
    name: "AI draft",
    description: "Review first",
    creationSource: "llm_draft" as const,
    weeklySchedule: ["mon" as const],
    phases: []
  },
  exercises: [],
  reviewBlockingIssues: []
};

describe("AI generation client", () => {
  it("preserves setup goal and deterministic progression metadata in the editor draft", () => {
    expect(applySetupMetadataToAiDraft(normalizedDraft.plan, setup)).toMatchObject({
      goalType: "strength",
      progressionMode: "performance_based"
    });
    expect(applySetupMetadataToAiDraft(normalizedDraft.plan, {
      ...setup,
      goalType: "recovery",
      progressionModeOverride: "hybrid"
    })).toMatchObject({
      goalType: "recovery",
      progressionMode: "hybrid"
    });
  });

  it("clears a terminal AI error and enables guided generation without changing setup", () => {
    const generationError = mapAiPlanGenerationError("success_quota_reached");
    expect(isPlanDraftGenerationDisabled({
      generating: false,
      isDirectAi: true,
      generationError
    })).toBe(true);

    const currentSetup = setup;
    const transition = getPlanCreationModeTransition("guided");
    expect(transition).toEqual({
      mode: "guided",
      generationError: null,
      clearGeneratedExerciseReview: true,
      clearGeneratedDraft: true
    });
    expect(currentSetup).toBe(setup);
    expect(isPlanDraftGenerationDisabled({
      generating: false,
      isDirectAi: false,
      generationError: transition.generationError
    })).toBe(false);
  });

  it("validates setup before making a request", async () => {
    const fetcher = vi.fn();
    const invalid = { ...setup, weeklySchedule: [] };
    expect(validateAiGenerationSetup(invalid)).toEqual(["Choose 1 training day."]);
    await expect(requestAiPlanDraft({
      setup: invalid,
      guard: new AiGenerationAttemptGuard(() => "attempt-1"),
      fetcher
    })).rejects.toThrow("Choose 1 training day.");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("sends the setup and one idempotency key per intentional attempt", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({
      ok: true,
      draft: normalizedDraft,
      quotaDate: "2026-07-19"
    }), { status: 200 }));
    const keys = ["attempt-1", "attempt-2"];
    const guard = new AiGenerationAttemptGuard(() => keys.shift() ?? "unexpected");

    await requestAiPlanDraft({ setup, guard, fetcher });
    await requestAiPlanDraft({ setup, guard, fetcher });

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[0][1]).toMatchObject({
      body: JSON.stringify(setup),
      headers: expect.objectContaining({ "Idempotency-Key": "attempt-1" })
    });
    expect(fetcher.mock.calls[1][1]).toMatchObject({
      headers: expect.objectContaining({ "Idempotency-Key": "attempt-2" })
    });
  });

  it("drops duplicate submissions while the first request is loading", async () => {
    let release: (() => void) | undefined;
    const fetcher = vi.fn<typeof fetch>(() => new Promise<Response>((resolve) => {
      release = () => resolve(new Response(JSON.stringify({
        ok: true,
        draft: normalizedDraft,
        quotaDate: "2026-07-19"
      }), { status: 200 }));
    }));
    const guard = new AiGenerationAttemptGuard(() => "attempt-1");
    const first = requestAiPlanDraft({ setup, guard, fetcher });
    const duplicate = await requestAiPlanDraft({ setup, guard, fetcher });
    expect(duplicate).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
    release?.();
    await first;
  });

  it("maps every typed endpoint error without provider detail", () => {
    const codes = [
      "unauthenticated", "generation_disabled", "missing_api_key", "invalid_configuration",
      "unsafe_input", "duplicate_request", "success_quota_reached", "attempt_limit_reached",
      "request_timed_out", "rate_limited", "provider_unavailable", "malformed_provider_output",
      "invalid_generated_plan", "orchestration_unavailable"
    ];
    for (const code of codes) {
      const mapped = mapAiPlanGenerationError(code);
      expect(mapped.code).toBe(code);
      expect(mapped.title).not.toBe("");
      expect(mapped.message).not.toMatch(/gemini|provider body|api key/i);
    }
    expect(mapAiPlanGenerationError("secret-provider-failure").code).toBe("unknown");
  });
});
