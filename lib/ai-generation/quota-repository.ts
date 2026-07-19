import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-service-role";

export type AiGenerationReservationDecision =
  | "reserved"
  | "duplicate_request"
  | "success_quota_reached"
  | "attempt_limit_reached";

export type AiGenerationAttemptOutcome =
  | "succeeded"
  | "provider_failure"
  | "timeout"
  | "rate_limited"
  | "invalid_output"
  | "unsafe_input";

export type AiGenerationReservation = {
  decision: AiGenerationReservationDecision;
  attemptId: string | null;
  quotaDate: string;
  attemptStatus: string | null;
};

type ReservationRow = {
  decision: unknown;
  attempt_id: unknown;
  quota_date: unknown;
  attempt_status: unknown;
};

function isReservationDecision(value: unknown): value is AiGenerationReservationDecision {
  return (
    value === "reserved" ||
    value === "duplicate_request" ||
    value === "success_quota_reached" ||
    value === "attempt_limit_reached"
  );
}

export async function reserveAiGenerationAttempt(
  input: {
    userId: string;
    successLimit: number;
    attemptLimit: number;
    requestIdentifier: string | null;
  },
  supabase: SupabaseClient = getSupabaseServiceRoleClient(),
): Promise<AiGenerationReservation> {
  const { data, error } = await supabase
    .rpc("reserve_ai_generation_attempt", {
      p_user_id: input.userId,
      p_success_limit: input.successLimit,
      p_attempt_limit: input.attemptLimit,
      p_request_identifier: input.requestIdentifier,
    })
    .single();

  if (error || !data) throw new Error("AI generation reservation failed.");
  const row = data as ReservationRow;
  if (
    !isReservationDecision(row.decision) ||
    typeof row.quota_date !== "string" ||
    (row.attempt_id !== null && typeof row.attempt_id !== "string") ||
    (row.attempt_status !== null && typeof row.attempt_status !== "string")
  ) {
    throw new Error("AI generation reservation returned an invalid result.");
  }

  return {
    decision: row.decision,
    attemptId: row.attempt_id as string | null,
    quotaDate: row.quota_date,
    attemptStatus: row.attempt_status as string | null,
  };
}

export async function completeAiGenerationAttempt(
  input: { userId: string; attemptId: string; outcome: AiGenerationAttemptOutcome },
  supabase: SupabaseClient = getSupabaseServiceRoleClient(),
) {
  const { data, error } = await supabase.rpc("complete_ai_generation_attempt", {
    p_user_id: input.userId,
    p_attempt_id: input.attemptId,
    p_outcome: input.outcome,
  });

  if (error || data !== true) throw new Error("AI generation completion failed.");
}
