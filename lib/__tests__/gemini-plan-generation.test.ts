import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import fixture from "@/lib/__fixtures__/gemini-plan-response.json";
import { DEFAULT_GEMINI_MODEL, getAiGenerationConfiguration } from "@/lib/ai-generation/config";
import { PlanGenerationError } from "@/lib/ai-generation/errors";
import { generatePlanDraftForServer } from "@/lib/ai-generation/generate-plan";
import type { ProviderExerciseCandidate } from "@/lib/generated-plan-draft";

const env = {
  AI_GENERATION_ENABLED: "true", AI_GENERATION_PROVIDER: "gemini",
  GEMINI_API_KEY: "test-key", GEMINI_MODEL: "gemini-3.5-flash",
  GEMINI_TIMEOUT_MS: "20", GEMINI_MAX_INPUT_CHARS: "4000", GEMINI_MAX_OUTPUT_TOKENS: "1024",
};
const input = { setup: { goalType: "strength" as const, objectiveSummary: "Get stronger", daysPerWeek: 1, sessionMinutes: 45, weeklySchedule: ["mon" as const], preferredSplit: "full_body" as const, focusAreas: ["squat"], currentConstraints: [] } };
const exercise: ProviderExerciseCandidate = { name: "Custom prowler march", prescription: { sets: 3, reps: "30 sec", rest: "60 sec" }, trackingType: "duration", unilateralMode: "bilateral", supportedLoadUnits: [], supportedDistanceUnits: [], primaryValueLabel: "Duration", secondaryValueLabel: null, coachingNote: "Move smoothly.", videoUrl: "https://youtu.be/dQw4w9WgXcQ", videoSearchQuery: "custom prowler march exercise demo" };
const draft = (candidate = exercise) => ({ version: "generated-plan-draft-v1", name: "Strength", description: "Review me", weeklySchedule: ["mon"], phases: [{ goal: "Build", workouts: [{ name: "Day one", focus: "Strength", summary: "Full body", scheduledDays: ["mon"], exercises: [candidate] }] }] });
const responseFor = (value: unknown, status = 200) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(value) }] } }] }), { status, headers: { "content-type": "application/json" } });

describe("server-only Gemini plan adapter", () => {
  it("keeps the representative provider-response fixture structurally usable", async () => {
    const result = await generatePlanDraftForServer(input, { env, request: vi.fn().mockResolvedValue(responseFor(fixture)) });
    expect(result.exercises[0]).toMatchObject({ status: "matched", exercise: { sourceExerciseId: "romanian-deadlift" } });
  });

  it("uses bounded structured output then canonical normalization for a valid custom exercise", async () => {
    const request = vi.fn().mockResolvedValue(responseFor(draft()));
    const result = await generatePlanDraftForServer(input, { env, request });
    expect(result.exercises[0]).toMatchObject({ status: "custom" });
    const [, init] = request.mock.calls[0];
    expect(init.body).toContain("responseJsonSchema");
    expect(init.body).toContain("maxOutputTokens");
    expect(init.body).toContain("Get stronger");
  });

  it("keeps active environment examples off Gemini 2.5 Flash", () => {
    for (const file of [".env.example", "README.md"]) {
      const source = readFileSync(file, "utf8");
      expect(source).toContain("GEMINI_MODEL=gemini-3.5-flash");
      expect(source).not.toContain("GEMINI_MODEL=gemini-2.5-flash");
    }
  });

  it("defaults to Gemini 3.5 Flash and sends a canonical-compatible schema", async () => {
    expect(DEFAULT_GEMINI_MODEL).toBe("gemini-3.5-flash");
    expect(
      getAiGenerationConfiguration({ ...env, GEMINI_MODEL: undefined }),
    ).toMatchObject({ status: "ready", model: "gemini-3.5-flash" });

    const request = vi.fn().mockResolvedValue(responseFor(draft()));
    await generatePlanDraftForServer(input, { env, request });
    const [, init] = request.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    const schema = body.generationConfig.responseJsonSchema;
    const phaseSchema = schema.properties.phases;
    const workoutSchema = phaseSchema.items.properties.workouts;
    const exerciseSchema = workoutSchema.items.properties.exercises;
    const prescription = exerciseSchema.items.properties.prescription;

    expect(phaseSchema.minItems).toBe(1);
    expect(workoutSchema.minItems).toBe(1);
    expect(exerciseSchema.minItems).toBe(1);
    expect(prescription.properties.sets.minimum).toBe(1);
    expect(schema.properties.weeklySchedule.items.enum).toEqual([
      "sun", "mon", "tue", "wed", "thu", "fri", "sat",
    ]);
    expect(workoutSchema.items.properties.scheduledDays.items.enum).toEqual(
      schema.properties.weeklySchedule.items.enum,
    );
    expect(exerciseSchema.items.properties.videoUrl.type).toEqual([
      "string", "null",
    ]);

    const systemInstruction = body.systemInstruction.parts[0].text as string;
    expect(systemInstruction).toContain("Catalog-matched exercises receive catalog-owned");
    expect(systemInstruction).toContain("Set generated videoUrl to null");
    expect(systemInstruction).toContain("never invent a direct YouTube URL");
    expect(systemInstruction).not.toContain("needs a direct");
    expect(systemInstruction).not.toContain("provide a direct YouTube URL");
  });

  it("allows a null generated video URL to enter review without weakening save validation", async () => {
    const result = await generatePlanDraftForServer(input, {
      env,
      request: vi.fn().mockResolvedValue(responseFor(draft({ ...exercise, videoUrl: null }))),
    });
    expect(result.exercises[0]).toMatchObject({
      status: "needs_review",
      issues: [expect.objectContaining({ code: "invalid_custom_candidate", field: "videoUrl" })],
    });
  });

  it("sends the Gemini key only in the request header", async () => {
    const request = vi.fn().mockResolvedValue(responseFor(draft()));
    await generatePlanDraftForServer(input, { env, request });
    const [url, init] = request.mock.calls[0] as [string, RequestInit];
    expect(url).not.toContain(env.GEMINI_API_KEY);
    expect(url).not.toContain("?key=");
    expect(new Headers(init.headers).get("x-goog-api-key")).toBe(env.GEMINI_API_KEY);
  });

  it("preserves catalog metadata precedence and reviewed alias resolution", async () => {
    const catalog: ProviderExerciseCandidate = { ...exercise, name: "Barbell RDL", proposedCatalogId: "romanian-deadlift", videoUrl: "not a url", trackingType: "duration" };
    const result = await generatePlanDraftForServer(input, { env, request: vi.fn().mockResolvedValue(responseFor(draft(catalog))) });
    expect(result.exercises[0]).toMatchObject({ status: "matched", exercise: { sourceExerciseId: "romanian-deadlift", trackingType: "weight_reps", videoUrl: "https://www.youtube.com/watch?v=JCXUYuzwNrM" } });
  });

  it.each([
    ["disabled", { ...env, AI_GENERATION_ENABLED: "false" }, "generation_disabled"],
    ["missing key", { ...env, GEMINI_API_KEY: "" }, "missing_api_key"],
    ["invalid config", { ...env, GEMINI_TIMEOUT_MS: "no" }, "invalid_configuration"],
  ])("maps %s configuration without a provider call", async (_name, configuredEnv, code) => {
    const request = vi.fn();
    await expect(generatePlanDraftForServer(input, { env: configuredEnv, request })).rejects.toMatchObject({ code });
    expect(request).not.toHaveBeenCalled();
  });

  it("maps rate limit, malformed output, canonical failure, and unsafe input to stable safe errors", async () => {
    await expect(generatePlanDraftForServer(input, { env, request: vi.fn().mockResolvedValue(responseFor({}, 429)) })).rejects.toMatchObject({ code: "rate_limited" });
    await expect(generatePlanDraftForServer(input, { env, request: vi.fn().mockResolvedValue(responseFor({ no: "draft" })) })).rejects.toMatchObject({ code: "malformed_provider_output" });
    await expect(generatePlanDraftForServer(input, { env, request: vi.fn().mockResolvedValue(responseFor(draft({ ...exercise, prescription: { sets: 0, reps: "8", rest: "60 sec" } })) ) })).rejects.toMatchObject({ code: "invalid_generated_plan" });
    await expect(generatePlanDraftForServer({ setup: { ...input.setup, objectiveSummary: "x".repeat(241) } }, { env })).rejects.toMatchObject({ code: "unsafe_input" });
  });

  it("maps malformed exercise metadata to a typed invalid-generated-plan error", async () => {
    const malformedExercise = {
      ...exercise,
      trackingType: "weight_reps",
      loadUnit: "lb",
      supportedLoadUnits: {},
    };
    const diagnosticSink = vi.fn();
    const request = vi.fn().mockResolvedValue(responseFor(draft(malformedExercise as unknown as typeof exercise)));
    await expect(
      generatePlanDraftForServer(input, { env, request, diagnosticSink }),
    ).rejects.toMatchObject({ code: "invalid_generated_plan" });

    expect(diagnosticSink).toHaveBeenCalledOnce();
    expect(diagnosticSink).toHaveBeenCalledWith({
      model: "gemini-3.5-flash",
      stage: "canonical_validation",
      fatalValidationErrorCodes: ["unsupported_tracking_metadata"],
      reviewBlockingIssueCodes: [],
      normalizedFieldPaths: [
        "phases.0.workouts.0.exercises.0.supportedLoadUnits",
      ],
      counts: {
        fatalValidationErrors: 1,
        reviewBlockingIssues: 0,
        phases: 1,
        workouts: 1,
        exercises: 1,
      },
    });
    const serialized = JSON.stringify(diagnosticSink.mock.calls[0][0]);
    for (const sensitive of [exercise.name, exercise.coachingNote, input.setup.objectiveSummary, env.GEMINI_API_KEY]) {
      expect(serialized).not.toContain(sensitive);
    }
  });

  it("maps timeout and generic provider failures without exposing provider payloads", async () => {
    const timeoutRequest = vi.fn((_url: string, init: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => reject(new DOMException("provider detail", "AbortError")));
    }));
    await expect(generatePlanDraftForServer(input, { env, request: timeoutRequest })).rejects.toMatchObject({ code: "request_timed_out" });
    await expect(generatePlanDraftForServer(input, { env, request: vi.fn().mockRejectedValue(new Error("Gemini key=test-key raw response")) })).rejects.toMatchObject({ code: "provider_unavailable" });
  });

  it("never includes provider details in errors and disables incomplete configuration safely", () => {
    expect(getAiGenerationConfiguration({})).toEqual({ status: "disabled" });
    const error = new PlanGenerationError("provider_unavailable");
    expect(error.message).not.toContain("Gemini");
    expect(error.message).not.toContain("key");
  });
});
