export type PlanGenerationErrorCode =
  | "generation_disabled"
  | "missing_api_key"
  | "invalid_configuration"
  | "request_timed_out"
  | "rate_limited"
  | "provider_unavailable"
  | "unsafe_input"
  | "malformed_provider_output"
  | "invalid_generated_plan";

const messages: Record<PlanGenerationErrorCode, string> = {
  generation_disabled: "AI plan generation is not available.",
  missing_api_key: "AI plan generation is not available.",
  invalid_configuration: "AI plan generation is not available.",
  request_timed_out: "AI plan generation timed out. Please try again later.",
  rate_limited: "AI plan generation is temporarily busy. Please try again later.",
  provider_unavailable: "AI plan generation is temporarily unavailable.",
  unsafe_input: "The plan setup input cannot be used for AI generation.",
  malformed_provider_output: "AI plan generation returned an invalid draft.",
  invalid_generated_plan: "AI plan generation returned a draft that needs to be regenerated.",
};

/** A deliberately provider-neutral, client-safe generation failure. */
export class PlanGenerationError extends Error {
  readonly code: PlanGenerationErrorCode;

  constructor(code: PlanGenerationErrorCode) {
    super(messages[code]);
    this.name = "PlanGenerationError";
    this.code = code;
  }
}
