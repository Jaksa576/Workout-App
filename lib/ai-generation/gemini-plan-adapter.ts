import type { GeneratedPlanDraft } from "@/lib/generated-plan-draft";
import { PlanGenerationError } from "@/lib/ai-generation/errors";
import type { AiGenerationConfiguration } from "@/lib/ai-generation/config";

export type GeminiRequest = (url: string, init: RequestInit) => Promise<Response>;

const weekdays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

const exerciseSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "name",
    "prescription",
    "trackingType",
    "unilateralMode",
    "loadUnit",
    "supportedLoadUnits",
    "distanceUnit",
    "supportedDistanceUnits",
    "primaryValueLabel",
    "secondaryValueLabel",
    "coachingNote",
    "videoUrl",
    "videoSearchQuery",
  ],
  properties: {
    proposedCatalogId: {
      type: ["string", "null"],
      minLength: 1,
      description: "Use only a known exact catalog ID; otherwise null.",
    },
    name: { type: "string", minLength: 1 },
    prescription: {
      type: "object",
      additionalProperties: false,
      required: ["sets", "reps", "rest"],
      properties: {
        sets: { type: "integer", minimum: 1 },
        reps: { type: "string", minLength: 1 },
        rest: { type: "string", minLength: 1 },
        tempo: { type: ["string", "null"], minLength: 1 },
      },
    },
    trackingType: {
      type: "string",
      enum: ["weight_reps", "reps_only", "duration", "distance", "distance_duration", "completion"],
      description: "Choose the metric shape actually prescribed for each set.",
    },
    unilateralMode: {
      type: "string",
      enum: ["bilateral", "same_each_side", "independent_sides"],
      description: "bilateral is one shared result; same_each_side repeats one target per side; independent_sides records each side separately.",
    },
    loadUnit: {
      type: ["string", "null"],
      enum: ["lb", "kg", null],
      description: "Required only for weight_reps and must appear in supportedLoadUnits.",
    },
    supportedLoadUnits: {
      type: "array",
      items: { type: "string", enum: ["lb", "kg"] },
      description: "Use compatible load units for weight_reps; otherwise use an empty array.",
    },
    distanceUnit: {
      type: ["string", "null"],
      enum: ["mi", "km", "m", null],
      description: "Required only for distance or distance_duration and must appear in supportedDistanceUnits.",
    },
    supportedDistanceUnits: {
      type: "array",
      items: { type: "string", enum: ["mi", "km", "m"] },
      description: "Use compatible distance units for distance tracking; otherwise use an empty array.",
    },
    primaryValueLabel: {
      type: ["string", "null"],
      minLength: 1,
      description: "Short label for the primary metric, compatible with trackingType.",
    },
    secondaryValueLabel: {
      type: ["string", "null"],
      minLength: 1,
      description: "Required for weight_reps and distance_duration; otherwise null when unused.",
    },
    coachingNote: { type: "string", minLength: 1 },
    safetyNotes: { type: ["string", "null"], minLength: 1 },
    videoUrl: {
      type: ["string", "null"],
      description: "Use null. Reviewed catalog metadata or later user review owns direct video URLs.",
    },
    videoSearchQuery: {
      type: "string",
      minLength: 1,
      description: "Precise movement, equipment, stance, and variation search query.",
    },
  },
} as const;

const workoutSchema = {
  type: "object",
  additionalProperties: false,
  required: ["name", "focus", "summary", "scheduledDays", "exercises"],
  properties: {
    name: { type: "string", minLength: 1 },
    focus: { type: "string", minLength: 1 },
    summary: { type: "string", minLength: 1 },
    scheduledDays: {
      type: "array",
      minItems: 1,
      items: { type: "string", enum: weekdays },
    },
    exercises: { type: "array", minItems: 1, items: exerciseSchema },
  },
} as const;

const generatedPlanSchema = {
  type: "object",
  additionalProperties: false,
  required: ["version", "name", "description", "weeklySchedule", "phases"],
  properties: {
    version: { type: "string", enum: ["generated-plan-draft-v1"] },
    name: { type: "string", minLength: 1 },
    description: { type: "string", minLength: 1 },
    weeklySchedule: {
      type: "array",
      minItems: 1,
      items: { type: "string", enum: weekdays },
    },
    phases: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["goal", "workouts"],
        properties: {
          goal: { type: "string", minLength: 1 },
          workouts: { type: "array", minItems: 1, items: workoutSchema },
        },
      },
    },
  },
} as const;

const SYSTEM_INSTRUCTION = `Return JSON only for generated-plan-draft-v1. Build at least one phase, workout, and exercise, with valid weekday values and positive prescription sets. Tracking types, units, display labels, and unilateral modes must be mutually compatible. Do not provide progression presets or settings; the application owns deterministic progression. Use proposedCatalogId only when confident it is an exact known catalog identity; otherwise use null. Catalog-matched exercises receive catalog-owned reviewed metadata and video. Set generated videoUrl to null and provide a precise videoSearchQuery instead; never invent a direct YouTube URL. Custom or unmatched exercises may require user review, and no generated exercise bypasses canonical validation or review-before-save. Use no markdown.`;

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
