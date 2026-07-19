import { getAiGenerationConfiguration, type EnvironmentValues } from "@/lib/ai-generation/config";
import { PlanGenerationError } from "@/lib/ai-generation/errors";
import { emitInvalidDraftDiagnostic, type InvalidDraftDiagnosticSink } from "@/lib/ai-generation/diagnostics";
import { generateGeminiPlanDraft, type GeminiRequest } from "@/lib/ai-generation/gemini-plan-adapter";
import { normalizeGeneratedPlanDraft, type FatalGeneratedDraftError, type GeneratedPlanDraft, type NormalizedGeneratedPlanDraft } from "@/lib/generated-plan-draft";
import { isPlanSetupInput } from "@/lib/validation";
import type { PlanDraftInput } from "@/lib/types";

function safeText(value: unknown, max = 240) {
  if (typeof value !== "string" || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))
    throw new PlanGenerationError("unsafe_input");
  return value.trim();
}

function buildBoundedPrompt(input: PlanDraftInput, maxInputChars: number) {
  if (!isPlanSetupInput(input.setup)) throw new PlanGenerationError("unsafe_input");
  const setup = input.setup;
  const context = {
    goalType: setup.goalType, objectiveSummary: safeText(setup.objectiveSummary ?? ""),
    daysPerWeek: setup.daysPerWeek, sessionMinutes: setup.sessionMinutes,
    weeklySchedule: setup.weeklySchedule, preferredSplit: setup.preferredSplit,
    focusAreas: setup.focusAreas.slice(0, 8).map((item) => safeText(item, 120)),
    currentConstraints: setup.currentConstraints.slice(0, 8).map((item) => safeText(item, 160)),
    progressionModeOverride: setup.progressionModeOverride ?? null,
  };
  const prompt = `Create a conservative, reviewable training-plan draft using only this validated setup context:\n${JSON.stringify(context)}`;
  if (prompt.length > maxInputChars) throw new PlanGenerationError("unsafe_input");
  return prompt;
}

export function validatePlanDraftInputForGeneration(
  input: PlanDraftInput,
  maxInputChars: number,
) {
  buildBoundedPrompt(input, maxInputChars);
}
function invalidDraftDiagnostic(draft: GeneratedPlanDraft, model: string, fatalErrors: Array<Pick<FatalGeneratedDraftError, "code" | "path"> | { code: "normalization_exception"; path: null }>) {
  const phases = Array.isArray(draft.phases) ? draft.phases : [];
  let workouts = 0;
  let exercises = 0;
  for (const phase of phases) {
    const phaseWorkouts = Array.isArray(phase?.workouts) ? phase.workouts : [];
    workouts += phaseWorkouts.length;
    for (const workout of phaseWorkouts) {
      exercises += Array.isArray(workout?.exercises) ? workout.exercises.length : 0;
    }
  }
  return {
    model,
    stage: "canonical_validation" as const,
    fatalValidationErrorCodes: [...new Set(fatalErrors.map((error) => error.code))],
    reviewBlockingIssueCodes: [],
    normalizedFieldPaths: fatalErrors.flatMap((error) => error.path === null ? [] : [error.path]),
    counts: { fatalValidationErrors: fatalErrors.length, reviewBlockingIssues: 0, phases: phases.length, workouts, exercises },
  };
}


export async function generatePlanDraftForServer(
  input: PlanDraftInput,
  dependencies: { env?: EnvironmentValues; request?: GeminiRequest; diagnosticSink?: InvalidDraftDiagnosticSink } = {},
): Promise<NormalizedGeneratedPlanDraft> {
  const configuration = getAiGenerationConfiguration(dependencies.env);
  if (configuration.status === "disabled") throw new PlanGenerationError("generation_disabled");
  if (configuration.status === "missing_key") throw new PlanGenerationError("missing_api_key");
  if (configuration.status === "invalid") throw new PlanGenerationError("invalid_configuration");
  const draft = await generateGeminiPlanDraft({ configuration, prompt: buildBoundedPrompt(input, configuration.maxInputChars), request: dependencies.request });
  let normalized: ReturnType<typeof normalizeGeneratedPlanDraft>;
  try {
    normalized = normalizeGeneratedPlanDraft(draft);
  } catch {
    emitInvalidDraftDiagnostic(invalidDraftDiagnostic(draft, configuration.model, [{ code: "normalization_exception", path: null }]), dependencies.diagnosticSink);
    throw new PlanGenerationError("invalid_generated_plan");
  }
  if ("fatalErrors" in normalized) {
    emitInvalidDraftDiagnostic(invalidDraftDiagnostic(draft, configuration.model, normalized.fatalErrors), dependencies.diagnosticSink);
    throw new PlanGenerationError("invalid_generated_plan");
  }
  return normalized;
}
