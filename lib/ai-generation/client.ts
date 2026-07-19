import type { NormalizedGeneratedPlanDraft } from "@/lib/generated-plan-draft";
import type { PlanSetupInput } from "@/lib/types";
import { isPlanSetupInput } from "@/lib/validation";

export type ClientPlanGenerationErrorCode =
  | "unauthenticated"
  | "generation_disabled"
  | "missing_api_key"
  | "invalid_configuration"
  | "unsafe_input"
  | "duplicate_request"
  | "success_quota_reached"
  | "attempt_limit_reached"
  | "request_timed_out"
  | "rate_limited"
  | "provider_unavailable"
  | "malformed_provider_output"
  | "invalid_generated_plan"
  | "orchestration_unavailable"
  | "unknown";

export type AiGenerationErrorPresentation = {
  title: string;
  message: string;
  retryAllowed: boolean;
  signInRequired?: boolean;
};

const errorPresentations: Record<ClientPlanGenerationErrorCode, AiGenerationErrorPresentation> = {
  unauthenticated: {
    title: "Sign in again",
    message: "Your session ended before the draft could be generated.",
    retryAllowed: false,
    signInRequired: true
  },
  generation_disabled: {
    title: "AI drafting is unavailable",
    message: "Use Guided Setup, Manual Builder, or external AI import instead.",
    retryAllowed: false
  },
  missing_api_key: {
    title: "AI drafting is unavailable",
    message: "Direct generation is not configured. The other creation methods still work.",
    retryAllowed: false
  },
  invalid_configuration: {
    title: "AI drafting is unavailable",
    message: "Direct generation is not configured correctly. The other creation methods still work.",
    retryAllowed: false
  },
  unsafe_input: {
    title: "Check your setup",
    message: "Review the plan details and remove sensitive medical information before trying again.",
    retryAllowed: true
  },
  duplicate_request: {
    title: "Request already received",
    message: "That draft request was already submitted. Start a new attempt or choose another creation method.",
    retryAllowed: true
  },
  success_quota_reached: {
    title: "Daily draft limit reached",
    message: "You have used today’s successful AI draft allowance. Continue with another creation method.",
    retryAllowed: false
  },
  attempt_limit_reached: {
    title: "Daily attempt limit reached",
    message: "No more AI generation attempts are available today. Continue with another creation method.",
    retryAllowed: false
  },
  request_timed_out: {
    title: "Generation timed out",
    message: "No plan was saved. You can try a new attempt or use another creation method.",
    retryAllowed: true
  },
  rate_limited: {
    title: "AI drafting is busy",
    message: "No plan was saved. Try again later or continue with another creation method.",
    retryAllowed: true
  },
  provider_unavailable: {
    title: "AI drafting is temporarily unavailable",
    message: "No plan was saved. Try again later or continue with another creation method.",
    retryAllowed: true
  },
  malformed_provider_output: {
    title: "The generated draft could not be used",
    message: "The response did not match the plan format. Start a new attempt or use another creation method.",
    retryAllowed: true
  },
  invalid_generated_plan: {
    title: "The generated draft did not pass validation",
    message: "Nothing was saved. Start a new attempt or use another creation method.",
    retryAllowed: true
  },
  orchestration_unavailable: {
    title: "AI drafting is temporarily unavailable",
    message: "Nothing was saved. Try again later or continue with another creation method.",
    retryAllowed: true
  },
  unknown: {
    title: "Unable to generate a draft",
    message: "Nothing was saved. Try again or continue with another creation method.",
    retryAllowed: true
  }
};

export function mapAiPlanGenerationError(code: unknown) {
  const safeCode = typeof code === "string" && Object.hasOwn(errorPresentations, code)
    ? (code as ClientPlanGenerationErrorCode)
    : "unknown";
  return { code: safeCode, ...errorPresentations[safeCode] };
}

export function validateAiGenerationSetup(setup: PlanSetupInput) {
  const errors: string[] = [];
  if (!isPlanSetupInput(setup)) {
    errors.push("Check the goal, schedule, session length, and plan details.");
  }
  if (setup.weeklySchedule.length !== setup.daysPerWeek) {
    errors.push(`Choose ${setup.daysPerWeek} training day${setup.daysPerWeek === 1 ? "" : "s"}.`);
  }
  return errors;
}

export class AiGenerationAttemptGuard {
  private active = false;
  private readonly createKey: () => string;

  constructor(createKey: () => string = () => globalThis.crypto.randomUUID()) {
    this.createKey = createKey;
  }

  begin() {
    if (this.active) return null;
    this.active = true;
    return this.createKey();
  }

  finish() {
    this.active = false;
  }
}

export type AiPlanDraftResponse = {
  ok: true;
  draft: NormalizedGeneratedPlanDraft;
  quotaDate: string;
};

export async function requestAiPlanDraft({
  setup,
  guard,
  fetcher = fetch
}: {
  setup: PlanSetupInput;
  guard: AiGenerationAttemptGuard;
  fetcher?: typeof fetch;
}): Promise<AiPlanDraftResponse | null> {
  const validationErrors = validateAiGenerationSetup(setup);
  if (validationErrors.length) {
    throw new Error(validationErrors.join(" "));
  }

  const idempotencyKey = guard.begin();
  if (!idempotencyKey) return null;

  try {
    const response = await fetcher("/api/ai/plan-drafts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey
      },
      body: JSON.stringify(setup)
    });
    const result = (await response.json()) as {
      ok?: boolean;
      draft?: NormalizedGeneratedPlanDraft;
      quotaDate?: string;
      error?: { code?: unknown };
    };

    if (!response.ok || !result.ok || !result.draft || !result.quotaDate) {
      const presentation = mapAiPlanGenerationError(result.error?.code);
      throw Object.assign(new Error(presentation.message), { presentation });
    }

    return {
      ok: true,
      draft: result.draft,
      quotaDate: result.quotaDate
    };
  } finally {
    guard.finish();
  }
}
