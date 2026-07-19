import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  orchestrateAuthenticatedPlanGeneration,
  type AiGenerationOrchestrationResult,
} from "@/lib/ai-generation/orchestrate-generation";
import type { PlanGenerationErrorCode } from "@/lib/ai-generation/errors";
import { isPlanSetupInput, normalizeWeekdays } from "@/lib/validation";

export const runtime = "nodejs";

const requestIdentifierPattern = /^[A-Za-z0-9._:-]{1,128}$/;

function statusFor(code: PlanGenerationErrorCode) {
  if (code === "unsafe_input") return 400;
  if (code === "success_quota_reached" || code === "duplicate_request") return 409;
  if (code === "attempt_limit_reached" || code === "rate_limited") return 429;
  if (code === "request_timed_out") return 504;
  if (
    code === "provider_unavailable" ||
    code === "malformed_provider_output" ||
    code === "invalid_generated_plan" ||
    code === "orchestration_unavailable"
  ) {
    return 503;
  }
  return 403;
}

function errorResponse(result: Extract<AiGenerationOrchestrationResult, { ok: false }>) {
  return NextResponse.json(
    {
      ok: false,
      error: { code: result.error.code, message: result.error.message },
      ...(result.quotaDate ? { quotaDate: result.quotaDate } : {}),
    },
    { status: statusFor(result.error.code) },
  );
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: "unauthenticated", message: "Authentication is required." } },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "unsafe_input", message: "Check your plan setup answers, then try again." } },
      { status: 400 },
    );
  }

  if (!isPlanSetupInput(body)) {
    return NextResponse.json(
      { ok: false, error: { code: "unsafe_input", message: "Check your plan setup answers, then try again." } },
      { status: 400 },
    );
  }

  const headerValue = request.headers.get("idempotency-key");
  if (headerValue !== null && !requestIdentifierPattern.test(headerValue)) {
    return NextResponse.json(
      { ok: false, error: { code: "unsafe_input", message: "The request identifier is invalid." } },
      { status: 400 },
    );
  }

  const result = await orchestrateAuthenticatedPlanGeneration({
    userId: user.id,
    draftInput: {
      setup: { ...body, weeklySchedule: normalizeWeekdays(body.weeklySchedule) },
    },
    requestIdentifier: headerValue === null
      ? null
      : createHash("sha256").update(headerValue, "utf8").digest("hex"),
  });

  if (!result.ok) return errorResponse(result);
  return NextResponse.json({
    ok: true,
    draft: result.draft,
    quotaDate: result.quotaDate,
  });
}
