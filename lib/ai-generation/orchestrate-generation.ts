import {
  getAiGenerationConfiguration,
  type EnvironmentValues,
} from "@/lib/ai-generation/config";
import {
  PlanGenerationError,
  type PlanGenerationErrorCode,
} from "@/lib/ai-generation/errors";
import {
  generatePlanDraftForServer,
  validatePlanDraftInputForGeneration,
} from "@/lib/ai-generation/generate-plan";
import {
  completeAiGenerationAttempt,
  reserveAiGenerationAttempt,
  type AiGenerationAttemptOutcome,
  type AiGenerationReservation,
} from "@/lib/ai-generation/quota-repository";
import type { NormalizedGeneratedPlanDraft } from "@/lib/generated-plan-draft";
import type { PlanDraftInput } from "@/lib/types";

export type AiGenerationOrchestrationResult =
  | {
      ok: true;
      draft: NormalizedGeneratedPlanDraft;
      quotaDate: string;
    }
  | {
      ok: false;
      error: PlanGenerationError;
      quotaDate?: string;
    };

type Dependencies = {
  env?: EnvironmentValues;
  reserveAttempt?: (input: {
    userId: string;
    successLimit: number;
    attemptLimit: number;
    requestIdentifier: string | null;
  }) => Promise<AiGenerationReservation>;
  completeAttempt?: (input: {
    userId: string;
    attemptId: string;
    outcome: AiGenerationAttemptOutcome;
  }) => Promise<void>;
  generate?: (
    input: PlanDraftInput,
    dependencies: { env?: EnvironmentValues },
  ) => Promise<NormalizedGeneratedPlanDraft>;
};

function configurationErrorCode(
  status: "disabled" | "missing_key" | "invalid",
): PlanGenerationErrorCode {
  if (status === "disabled") return "generation_disabled";
  if (status === "missing_key") return "missing_api_key";
  return "invalid_configuration";
}

function safeGenerationError(error: unknown) {
  return error instanceof PlanGenerationError
    ? error
    : new PlanGenerationError("provider_unavailable");
}

function outcomeFor(error: PlanGenerationError): AiGenerationAttemptOutcome {
  if (error.code === "request_timed_out") return "timeout";
  if (error.code === "rate_limited") return "rate_limited";
  if (
    error.code === "malformed_provider_output" ||
    error.code === "invalid_generated_plan"
  ) {
    return "invalid_output";
  }
  if (error.code === "unsafe_input") return "unsafe_input";
  return "provider_failure";
}

export async function orchestrateAuthenticatedPlanGeneration(
  input: {
    userId: string;
    draftInput: PlanDraftInput;
    requestIdentifier: string | null;
  },
  dependencies: Dependencies = {},
): Promise<AiGenerationOrchestrationResult> {
  const configuration = getAiGenerationConfiguration(dependencies.env);
  if (configuration.status !== "ready") {
    return {
      ok: false,
      error: new PlanGenerationError(configurationErrorCode(configuration.status)),
    };
  }

  try {
    validatePlanDraftInputForGeneration(input.draftInput, configuration.maxInputChars);
  } catch (error) {
    return { ok: false, error: safeGenerationError(error) };
  }

  const reserve = dependencies.reserveAttempt ?? reserveAiGenerationAttempt;
  const complete = dependencies.completeAttempt ?? completeAiGenerationAttempt;
  const generate = dependencies.generate ?? generatePlanDraftForServer;

  let reservation: AiGenerationReservation;
  try {
    reservation = await reserve({
      userId: input.userId,
      successLimit: configuration.dailySuccessLimit,
      attemptLimit: configuration.dailyAttemptLimit,
      requestIdentifier: input.requestIdentifier,
    });
  } catch {
    return {
      ok: false,
      error: new PlanGenerationError("orchestration_unavailable"),
    };
  }

  if (reservation.decision !== "reserved" || !reservation.attemptId) {
    return {
      ok: false,
      error: new PlanGenerationError(
        reservation.decision === "reserved"
          ? "orchestration_unavailable"
          : reservation.decision,
      ),
      quotaDate: reservation.quotaDate,
    };
  }

  try {
    const draft = await generate(input.draftInput, { env: dependencies.env });
    await complete({
      userId: input.userId,
      attemptId: reservation.attemptId,
      outcome: "succeeded",
    });
    return { ok: true, draft, quotaDate: reservation.quotaDate };
  } catch (error) {
    const safeError = safeGenerationError(error);
    try {
      await complete({
        userId: input.userId,
        attemptId: reservation.attemptId,
        outcome: outcomeFor(safeError),
      });
    } catch {
      return {
        ok: false,
        error: new PlanGenerationError("orchestration_unavailable"),
        quotaDate: reservation.quotaDate,
      };
    }
    return { ok: false, error: safeError, quotaDate: reservation.quotaDate };
  }
}
