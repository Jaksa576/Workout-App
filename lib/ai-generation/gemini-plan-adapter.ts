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
    name: { type: "string" },
    prescription: {
      type: "object",
      additionalProperties: false,
      required: ["sets", "reps", "rest"],
      properties: {
        sets: { type: "integer", minimum: 1 },
        reps: { type: "string" },
        rest: { type: "string" },
        tempo: { type: ["string", "null"] },
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
      description: "Short label for the primary metric, compatible with trackingType.",
    },
    secondaryValueLabel: {
      type: ["string", "null"],
      description: "Required for weight_reps and distance_duration; otherwise null when unused.",
    },
    coachingNote: { type: "string" },
    safetyNotes: { type: ["string", "null"] },
    videoUrl: {
      type: "null",
      description: "Always null. The application owns reviewed direct video URLs.",
    },
    videoSearchQuery: {
      type: "string",
      description: "Precise movement, equipment, stance, and variation search query.",
    },
  },
} as const;

const workoutSchema = {
  type: "object",
  additionalProperties: false,
  required: ["name", "focus", "summary", "scheduledDays", "exercises"],
  properties: {
    name: { type: "string" },
    focus: { type: "string" },
    summary: { type: "string" },
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
    name: { type: "string" },
    description: { type: "string" },
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
          goal: { type: "string" },
          workouts: { type: "array", minItems: 1, items: workoutSchema },
        },
      },
    },
  },
} as const;

const SYSTEM_INSTRUCTION = `You are an expert evidence-informed training-program designer with deep experience in strength and conditioning, hypertrophy, general fitness, rehabilitation-informed exercise selection, and return-to-sport programming.

Create a coherent, practical, individualized training-plan draft using only the validated user context provided by the application. Use all provided context together, including the goal, objective, schedule, session duration, preferred split, focus areas, and constraints. Avoid a generic plan. Create complete workouts that are realistic within the available session time. Balance useful repetition with purposeful variation.

Determine whether the user’s goal and context are best served by one phase or multiple phases. When multiple phases are warranted, give each phase a distinct, progressive purpose. Do not default to one phase when the objective clearly implies staged development, return to sport, rebuilding capacity, or meaningful progression over time. Do not add phases merely for complexity. Do not provide application progression presets, advancement rules, deload rules, or readiness algorithms. The application owns deterministic progression and readiness-based adaptation.

Select exercises using common names with enough specificity to identify the intended equipment, stance, position, direction, and variation. For every exercise, provide a valid prescription, tracking type, unilateral mode, compatible units, concise coaching guidance, safety notes when useful,  and a precise video search query. Do not provide or invent direct video URLs. Keep all tracking metadata mutually consistent with the prescribed work.

Return JSON only for generated-plan-draft-v1. Include a useful plan name and description, the weekly schedule, one or more meaningful phases, a clear goal for each phase, workouts assigned to valid scheduled days, and complete exercise prescriptions. Do not produce placeholder, minimal, or repetitive content merely to satisfy the schema. Use no markdown or commentary outside the JSON. `;

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
        if (
          !isRecord(exercise) ||
          "proposedCatalogId" in exercise ||
          typeof exercise.name !== "string" ||
          !isRecord(exercise.prescription) ||
          exercise.videoUrl !== null ||
          typeof exercise.videoSearchQuery !== "string" ||
          !exercise.videoSearchQuery.trim()
        )
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
