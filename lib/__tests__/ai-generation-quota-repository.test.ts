import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import {
  completeAiGenerationAttempt,
  reserveAiGenerationAttempt,
} from "@/lib/ai-generation/quota-repository";

describe("AI generation quota repository", () => {
  it("maps a valid reservation RPC response", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        decision: "reserved",
        attempt_id: "attempt-1",
        quota_date: "2026-07-19",
        attempt_status: "reserved",
      },
      error: null,
    });
    const rpc = vi.fn().mockReturnValue({ single });
    const result = await reserveAiGenerationAttempt(
      {
        userId: "user-1",
        successLimit: 1,
        attemptLimit: 3,
        requestIdentifier: "request-1",
      },
      { rpc } as unknown as SupabaseClient,
    );

    expect(result).toEqual({
      decision: "reserved",
      attemptId: "attempt-1",
      quotaDate: "2026-07-19",
      attemptStatus: "reserved",
    });
    expect(rpc).toHaveBeenCalledWith("reserve_ai_generation_attempt", {
      p_user_id: "user-1",
      p_success_limit: 1,
      p_attempt_limit: 3,
      p_request_identifier: "request-1",
    });
  });

  it("persists indeterminate success through the completion RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
    await expect(
      completeAiGenerationAttempt(
        {
          userId: "user-1",
          attemptId: "attempt-1",
          outcome: "indeterminate_success",
        },
        { rpc } as unknown as SupabaseClient,
      ),
    ).resolves.toBeUndefined();

    expect(rpc).toHaveBeenCalledWith("complete_ai_generation_attempt", {
      p_user_id: "user-1",
      p_attempt_id: "attempt-1",
      p_outcome: "indeterminate_success",
    });
  });

  it("fails closed on invalid reservation and completion RPC results", async () => {
    const reservationRpc = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: { decision: "reserved", attempt_id: 7, quota_date: "2026-07-19" },
        error: null,
      }),
    });
    await expect(
      reserveAiGenerationAttempt(
        {
          userId: "user-1",
          successLimit: 1,
          attemptLimit: 3,
          requestIdentifier: null,
        },
        { rpc: reservationRpc } as unknown as SupabaseClient,
      ),
    ).rejects.toThrow("invalid result");

    await expect(
      completeAiGenerationAttempt(
        {
          userId: "user-1",
          attemptId: "attempt-1",
          outcome: "succeeded",
        },
        {
          rpc: vi.fn().mockResolvedValue({ data: false, error: null }),
        } as unknown as SupabaseClient,
      ),
    ).rejects.toThrow("completion failed");
  });
});
