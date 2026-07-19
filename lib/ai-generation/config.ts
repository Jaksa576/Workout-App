export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";
export const DEFAULT_DAILY_SUCCESS_LIMIT = 1;
export const DEFAULT_DAILY_ATTEMPT_LIMIT = 3;

export type AiGenerationConfiguration =
  | { status: "disabled" }
  | { status: "missing_key" }
  | { status: "invalid" }
  | {
      status: "ready";
      provider: "gemini";
      model: string;
      apiKey: string;
      timeoutMs: number;
      maxInputChars: number;
      maxOutputTokens: number;
      dailySuccessLimit: number;
      dailyAttemptLimit: number;
    };

export type EnvironmentValues = Readonly<Record<string, string | undefined>>;

function boundedPositiveInteger(value: string | undefined, fallback: number, max: number) {
  if (value === undefined || value === "") return fallback;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= max ? parsed : null;
}

/**
 * Reads server environment exactly once per generation attempt. No secret is
 * exported to client modules, route modules, or provider-neutral draft types.
 */
export function getAiGenerationConfiguration(
  env: EnvironmentValues = process.env,
): AiGenerationConfiguration {
  if (env.AI_GENERATION_ENABLED !== "true") return { status: "disabled" };
  if (env.AI_GENERATION_PROVIDER !== "gemini") return { status: "invalid" };

  const model = (env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL).trim();
  const timeoutMs = boundedPositiveInteger(env.GEMINI_TIMEOUT_MS, 12_000, 60_000);
  const maxInputChars = boundedPositiveInteger(env.GEMINI_MAX_INPUT_CHARS, 4_000, 12_000);
  const maxOutputTokens = boundedPositiveInteger(env.GEMINI_MAX_OUTPUT_TOKENS, 4_096, 8_192);
  const dailySuccessLimit = boundedPositiveInteger(
    env.AI_GENERATION_DAILY_SUCCESS_LIMIT,
    DEFAULT_DAILY_SUCCESS_LIMIT,
    10,
  );
  const dailyAttemptLimit = boundedPositiveInteger(
    env.AI_GENERATION_DAILY_ATTEMPT_LIMIT,
    DEFAULT_DAILY_ATTEMPT_LIMIT,
    100,
  );
  if (
    !model ||
    !timeoutMs ||
    !maxInputChars ||
    !maxOutputTokens ||
    !dailySuccessLimit ||
    !dailyAttemptLimit ||
    dailySuccessLimit > dailyAttemptLimit
  ) {
    return { status: "invalid" };
  }

  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) return { status: "missing_key" };
  return {
    status: "ready",
    provider: "gemini",
    model,
    apiKey,
    timeoutMs,
    maxInputChars,
    maxOutputTokens,
    dailySuccessLimit,
    dailyAttemptLimit,
  };
}
