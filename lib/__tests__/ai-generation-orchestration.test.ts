import { describe, expect, it, vi } from "vitest";
import { PlanGenerationError } from "@/lib/ai-generation/errors";
import { orchestrateAuthenticatedPlanGeneration } from "@/lib/ai-generation/orchestrate-generation";
import type {
  AiGenerationAttemptOutcome,
  AiGenerationReservation,
} from "@/lib/ai-generation/quota-repository";
import type { NormalizedGeneratedPlanDraft } from "@/lib/generated-plan-draft";

const env = {
  AI_GENERATION_ENABLED: "true",
  AI_GENERATION_PROVIDER: "gemini",
  GEMINI_API_KEY: "test-key",
  GEMINI_MODEL: "gemini-3.5-flash",
  GEMINI_TIMEOUT_MS: "20",
  GEMINI_MAX_INPUT_CHARS: "4000",
  GEMINI_MAX_OUTPUT_TOKENS: "1024",
};
const input = {
  setup: {
    goalType: "strength" as const,
    objectiveSummary: "Get stronger",
    daysPerWeek: 1,
    sessionMinutes: 45,
    weeklySchedule: ["mon" as const],
    preferredSplit: "full_body" as const,
    focusAreas: ["squat"],
    currentConstraints: [],
  },
};
const draft = {
  plan: {
    version: "structured-v1" as const,
    name: "Review draft",
    description: "",
    weeklySchedule: ["mon" as const],
    phases: [],
  },
  exercises: [],
  reviewBlockingIssues: [],
} satisfies NormalizedGeneratedPlanDraft;

function reservation(
  decision: AiGenerationReservation["decision"] = "reserved",
  attemptId: string | null = "attempt-1",
): AiGenerationReservation {
  return {
    decision,
    attemptId,
    quotaDate: "2026-07-18",
    attemptStatus: attemptId ? "reserved" : null,
  };
}

function createQuotaState() {
  const attempts: Array<{
    id: string;
    requestIdentifier: string | null;
    status: "reserved" | AiGenerationAttemptOutcome;
  }> = [];
  const reserveAttempt = vi.fn(async ({
    successLimit,
    attemptLimit,
    requestIdentifier,
  }: {
    userId: string;
    successLimit: number;
    attemptLimit: number;
    requestIdentifier: string | null;
  }) => {
    const duplicate = requestIdentifier
      ? attempts.find((attempt) => attempt.requestIdentifier === requestIdentifier)
      : undefined;
    if (duplicate) return reservation("duplicate_request", duplicate.id);
    if (attempts.length >= attemptLimit) return reservation("attempt_limit_reached", null);
    if (attempts.filter((attempt) => attempt.status === "reserved" || attempt.status === "succeeded" || attempt.status === "indeterminate_success").length >= successLimit) {
      return reservation("success_quota_reached", null);
    }
    const id = `attempt-${attempts.length + 1}`;
    attempts.push({ id, requestIdentifier, status: "reserved" });
    return reservation("reserved", id);
  });
  const completeAttempt = vi.fn(async ({
    attemptId,
    outcome,
  }: {
    userId: string;
    attemptId: string;
    outcome: AiGenerationAttemptOutcome;
  }) => {
    const attempt = attempts.find((candidate) => candidate.id === attemptId);
    if (!attempt) throw new Error("invalid completion");
    if (attempt.status === outcome) return;
    if (attempt.status === "succeeded" && outcome === "indeterminate_success") return;
    if (attempt.status !== "reserved") throw new Error("invalid completion");
    attempt.status = outcome;
  });
  return { attempts, reserveAttempt, completeAttempt };
}

function call(
  dependencies: Parameters<typeof orchestrateAuthenticatedPlanGeneration>[1],
  requestIdentifier: string | null = null,
) {
  return orchestrateAuthenticatedPlanGeneration(
    { userId: "user-1", draftInput: input, requestIdentifier },
    { env, ...dependencies },
  );
}

describe("authenticated AI generation orchestration", () => {
  it("fails disabled and invalid quota configuration before reservation or provider invocation", async () => {
    const reserveAttempt = vi.fn();
    const generate = vi.fn();
    const disabled = await orchestrateAuthenticatedPlanGeneration(
      { userId: "user-1", draftInput: input, requestIdentifier: null },
      { env: { ...env, AI_GENERATION_ENABLED: "false" }, reserveAttempt, generate },
    );
    const invalid = await orchestrateAuthenticatedPlanGeneration(
      { userId: "user-1", draftInput: input, requestIdentifier: null },
      { env: { ...env, AI_GENERATION_DAILY_ATTEMPT_LIMIT: "0" }, reserveAttempt, generate },
    );

    expect(disabled).toMatchObject({ ok: false, error: { code: "generation_disabled" } });
    expect(invalid).toMatchObject({ ok: false, error: { code: "invalid_configuration" } });
    expect(reserveAttempt).not.toHaveBeenCalled();
    expect(generate).not.toHaveBeenCalled();
  });

  it("rejects unsafe setup before reservation and provider invocation", async () => {
    const reserveAttempt = vi.fn();
    const generate = vi.fn();
    const result = await orchestrateAuthenticatedPlanGeneration(
      {
        userId: "user-1",
        draftInput: { setup: { ...input.setup, objectiveSummary: "x".repeat(241) } },
        requestIdentifier: null,
      },
      { env, reserveAttempt, generate },
    );

    expect(result).toMatchObject({ ok: false, error: { code: "unsafe_input" } });
    expect(reserveAttempt).not.toHaveBeenCalled();
    expect(generate).not.toHaveBeenCalled();
  });

  it("reserves the default one-success/three-attempt quota and completes a successful draft", async () => {
    const reserveAttempt = vi.fn().mockResolvedValue(reservation());
    const completeAttempt = vi.fn().mockResolvedValue(undefined);
    const generate = vi.fn().mockResolvedValue(draft);
    const result = await call({ reserveAttempt, completeAttempt, generate });

    expect(result).toEqual({ ok: true, draft, quotaDate: "2026-07-18" });
    expect(reserveAttempt).toHaveBeenCalledWith(expect.objectContaining({ successLimit: 1, attemptLimit: 3 }));
    expect(completeAttempt).toHaveBeenCalledWith(expect.objectContaining({ outcome: "succeeded" }));
  });

  it.each([
    ["request_timed_out", "timeout"],
    ["rate_limited", "rate_limited"],
    ["provider_unavailable", "provider_failure"],
    ["malformed_provider_output", "invalid_output"],
    ["invalid_generated_plan", "invalid_output"],
  ] as const)("records %s as provider-neutral %s without a success", async (code, outcome) => {
    const completeAttempt = vi.fn().mockResolvedValue(undefined);
    const generate = vi.fn().mockRejectedValue(new PlanGenerationError(code));
    const result = await call({
      reserveAttempt: vi.fn().mockResolvedValue(reservation()),
      completeAttempt,
      generate,
    });

    expect(result).toMatchObject({ ok: false, error: { code } });
    expect(completeAttempt).toHaveBeenCalledWith(expect.objectContaining({ outcome }));
  });

  it("counts failed attempts, does not count them as successes, and blocks the fourth provider call", async () => {
    const quota = createQuotaState();
    const generate = vi.fn().mockRejectedValue(new PlanGenerationError("provider_unavailable"));
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const result = await call({ ...quota, generate });
      expect(result).toMatchObject({ ok: false, error: { code: "provider_unavailable" } });
    }
    const blocked = await call({ ...quota, generate });

    expect(blocked).toMatchObject({ ok: false, error: { code: "attempt_limit_reached" } });
    expect(generate).toHaveBeenCalledTimes(3);
    expect(quota.attempts.every((attempt) => attempt.status === "provider_failure")).toBe(true);
  });

  it("blocks after success without calling the provider again", async () => {
    const quota = createQuotaState();
    const generate = vi.fn().mockResolvedValue(draft);
    expect(await call({ ...quota, generate })).toMatchObject({ ok: true });
    const blocked = await call({ ...quota, generate });

    expect(blocked).toMatchObject({ ok: false, error: { code: "success_quota_reached" } });
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it("uses live reservations as success capacity under concurrent requests", async () => {
    const quota = createQuotaState();
    let finishGeneration!: (value: NormalizedGeneratedPlanDraft) => void;
    const generate = vi.fn(() => new Promise<NormalizedGeneratedPlanDraft>((resolve) => {
      finishGeneration = resolve;
    }));

    const first = call({ ...quota, generate });
    await Promise.resolve();
    const second = await call({ ...quota, generate });
    expect(second).toMatchObject({ ok: false, error: { code: "success_quota_reached" } });
    expect(generate).toHaveBeenCalledTimes(1);

    finishGeneration(draft);
    expect(await first).toMatchObject({ ok: true });
  });

  it("deduplicates a repeated idempotency key without a second provider call", async () => {
    const quota = createQuotaState();
    const generate = vi.fn().mockRejectedValue(new PlanGenerationError("provider_unavailable"));
    await call({ ...quota, generate }, "request-123");
    const duplicate = await call({ ...quota, generate }, "request-123");

    expect(duplicate).toMatchObject({ ok: false, error: { code: "duplicate_request" } });
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it.each(["before persistence", "after commit"] as const)(
    "fails closed when succeeded completion errors %s",
    async (failurePoint) => {
      const quota = createQuotaState();
      const persistedComplete = quota.completeAttempt;
      let successCompletion = true;
      const completeAttempt = vi.fn(async (
        completion: Parameters<typeof persistedComplete>[0],
      ) => {
        if (completion.outcome === "succeeded" && successCompletion) {
          successCompletion = false;
          if (failurePoint === "after commit") await persistedComplete(completion);
          throw new Error("uncertain completion");
        }
        await persistedComplete(completion);
      });
      const generate = vi.fn().mockResolvedValue(draft);

      const result = await call({
        reserveAttempt: quota.reserveAttempt,
        completeAttempt,
        generate,
      }, "uncertain-request");
      const retry = await call({
        reserveAttempt: quota.reserveAttempt,
        completeAttempt,
        generate,
      }, "new-request");

      expect(result).toMatchObject({
        ok: false,
        error: { code: "orchestration_unavailable" },
      });
      expect(result).not.toHaveProperty("draft");
      expect(completeAttempt).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ outcome: "succeeded" }),
      );
      expect(completeAttempt).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ outcome: "indeterminate_success" }),
      );
      expect(completeAttempt).not.toHaveBeenCalledWith(
        expect.objectContaining({ outcome: "provider_failure" }),
      );
      expect(quota.attempts[0].status).toBe(
        failurePoint === "after commit" ? "succeeded" : "indeterminate_success",
      );
      expect(retry).toMatchObject({
        ok: false,
        error: { code: "success_quota_reached" },
      });
      expect(generate).toHaveBeenCalledTimes(1);
    },
  );

  it("fails closed when reservation or completion state cannot be persisted", async () => {
    const generate = vi.fn().mockResolvedValue(draft);
    const reservationFailure = await call({
      reserveAttempt: vi.fn().mockRejectedValue(new Error("database detail")),
      generate,
    });
    const completionFailure = await call({
      reserveAttempt: vi.fn().mockResolvedValue(reservation()),
      completeAttempt: vi.fn().mockRejectedValue(new Error("database detail")),
      generate,
    });

    expect(reservationFailure).toMatchObject({ ok: false, error: { code: "orchestration_unavailable" } });
    expect(completionFailure).toMatchObject({ ok: false, error: { code: "orchestration_unavailable" } });
    expect(JSON.stringify(completionFailure)).not.toContain("database detail");
  });

  it("fails closed when a provider-failure completion cannot persist", async () => {
    const completeAttempt = vi.fn().mockRejectedValue(new Error("database detail"));
    const result = await call({
      reserveAttempt: vi.fn().mockResolvedValue(reservation()),
      completeAttempt,
      generate: vi.fn().mockRejectedValue(
        new PlanGenerationError("provider_unavailable"),
      ),
    });

    expect(result).toMatchObject({
      ok: false,
      error: { code: "orchestration_unavailable" },
    });
    expect(completeAttempt).toHaveBeenCalledOnce();
    expect(completeAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "provider_failure" }),
    );
  });
});
