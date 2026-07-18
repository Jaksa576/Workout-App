import type { GeneratedPlanDraft } from "@/lib/generated-plan-draft";
import { PlanGenerationError } from "@/lib/ai-generation/errors";
import type { AiGenerationConfiguration } from "@/lib/ai-generation/config";

export type GeminiRequest = (url: string, init: RequestInit) => Promise<Response>;

const exerciseSchema = {
  type: "object", required: ["name", "prescription", "trackingType", "unilateralMode", "supportedLoadUnits", "supportedDistanceUnits", "primaryValueLabel", "secondaryValueLabel", "coachingNote", "videoUrl", "videoSearchQuery"],
  properties: {
    proposedCatalogId: { type: ["string", "null"] }, name: { type: "string" },
    prescription: { type: "object", required: ["sets", "reps", "rest"], properties: { sets: { type: "integer" }, reps: { type: "string" }, rest: { type: "string" }, tempo: { type: ["string", "null"] } } },
    trackingType: { type: "string", enum: ["weight_reps", "reps_only", "duration", "distance", "distance_duration", "completion"] },
    unilateralMode: { type: "string", enum: ["bilateral", "same_each_side", "independent_sides"] },
    loadUnit: { type: ["string", "null"], enum: ["lb", "kg", null] }, supportedLoadUnits: { type: "array", items: { type: "string", enum: ["lb", "kg"] } },
    distanceUnit: { type: ["string", "null"], enum: ["mi", "km", "m", null] }, supportedDistanceUnits: { type: "array", items: { type: "string", enum: ["mi", "km", "m"] } },
    primaryValueLabel: { type: ["string", "null"] }, secondaryValueLabel: { type: ["string", "null"] }, coachingNote: { type: "string" }, safetyNotes: { type: ["string", "null"] },
    videoUrl: { type: ["string", "null"] }, videoSearchQuery: { type: ["string", "null"] },
  },
} as const;

const generatedPlanSchema = {
  type: "object",
  required: ["version", "name", "description", "weeklySchedule", "phases"],
  properties: {
    version: { type: "string", enum: ["generated-plan-draft-v1"] },
    name: { type: "string" }, description: { type: "string" },
    weeklySchedule: { type: "array", items: { type: "string" } },
    phases: { type: "array", items: { type: "object", required: ["goal", "workouts"], properties: { goal: { type: "string" }, workouts: { type: "array", items: { type: "object", required: ["name", "focus", "summary", "scheduledDays", "exercises"], properties: { name: { type: "string" }, focus: { type: "string" }, summary: { type: "string" }, scheduledDays: { type: "array", items: { type: "string" } }, exercises: { type: "array", items: exerciseSchema } } } } } } },
  },
} as const;

const SYSTEM_INSTRUCTION = `Return JSON only. Create a generated-plan-draft-v1 plan. Every exercise needs name, prescription (positive integer sets, reps, rest), trackingType, unilateralMode, supported units and display labels, coachingNote or structured guidance, a precise YouTube search query, and a direct youtube.com or youtu.be video URL. proposedCatalogId is optional: include it only when certain; never invent it. Use no markdown.`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Reject malformed envelopes before they reach the canonical normalizer. */
export function parseGeminiPlanDraft(value: unknown): GeneratedPlanDraft {
  if (!isRecord(value) || !Array.isArray(value.phases) || !Array.isArray(value.weeklySchedule) ||
    typeof value.version !== "string" || typeof value.name !== "string" || typeof value.description !== "string")
    throw new PlanGenerationError("malformed_provider_output");
  for (const phase of value.phases) {
    if (!isRecord(phase) || !Array.isArray(phase.workouts)) throw new PlanGenerationError("malformed_provider_output");
    for (const workout of phase.workouts) {
      if (!isRecord(workout) || !Array.isArray(workout.exercises)) throw new PlanGenerationError("malformed_provider_output");
      for (const exercise of workout.exercises)
        if (!isRecord(exercise) || typeof exercise.name !== "string" || !isRecord(exercise.prescription))
          throw new PlanGenerationError("malformed_provider_output");
    }
  }
  return value as unknown as GeneratedPlanDraft;
}

export async function generateGeminiPlanDraft({
  configuration, prompt, request = fetch,
}: {
  configuration: Extract<AiGenerationConfiguration, { status: "ready" }>;
  prompt: string;
  request?: GeminiRequest;
}): Promise<GeneratedPlanDraft> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), configuration.timeoutMs);
  try {
    const response = await request(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(configuration.model)}:generateContent`,
      {
        method: "POST", signal: controller.signal,
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": configuration.apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0, maxOutputTokens: configuration.maxOutputTokens, responseMimeType: "application/json", responseJsonSchema: generatedPlanSchema },
        }),
      },
    );
    if (response.status === 429) throw new PlanGenerationError("rate_limited");
    if (!response.ok) throw new PlanGenerationError("provider_unavailable");
    let body: unknown;
    try { body = await response.json(); } catch { throw new PlanGenerationError("malformed_provider_output"); }
    const text = isRecord(body) && Array.isArray(body.candidates) && isRecord(body.candidates[0]) &&
      isRecord(body.candidates[0].content) && Array.isArray(body.candidates[0].content.parts) &&
      isRecord(body.candidates[0].content.parts[0]) ? body.candidates[0].content.parts[0].text : undefined;
    if (typeof text !== "string") throw new PlanGenerationError("malformed_provider_output");
    try { return parseGeminiPlanDraft(JSON.parse(text)); }
    catch (error) { if (error instanceof PlanGenerationError) throw error; throw new PlanGenerationError("malformed_provider_output"); }
  } catch (error) {
    if (error instanceof PlanGenerationError) throw error;
    if (controller.signal.aborted || (error instanceof Error && error.name === "AbortError")) throw new PlanGenerationError("request_timed_out");
    throw new PlanGenerationError("provider_unavailable");
  } finally { clearTimeout(timeout); }
}
