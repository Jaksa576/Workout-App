import { describe, expect, it, vi } from "vitest";
import fixture from "@/lib/__fixtures__/gemini-plan-response.json";
import { getAiGenerationConfiguration } from "@/lib/ai-generation/config";
import { PlanGenerationError } from "@/lib/ai-generation/errors";
import { generatePlanDraftForServer } from "@/lib/ai-generation/generate-plan";

const env = {
  AI_GENERATION_ENABLED: "true", AI_GENERATION_PROVIDER: "gemini",
  GEMINI_API_KEY: "test-key", GEMINI_MODEL: "gemini-2.5-flash",
  GEMINI_TIMEOUT_MS: "20", GEMINI_MAX_INPUT_CHARS: "4000", GEMINI_MAX_OUTPUT_TOKENS: "1024",
};
const input = { setup: { goalType: "strength" as const, objectiveSummary: "Get stronger", daysPerWeek: 1, sessionMinutes: 45, weeklySchedule: ["mon" as const], preferredSplit: "full_body" as const, focusAreas: ["squat"], currentConstraints: [] } };
const exercise = { name: "Custom prowler march", prescription: { sets: 3, reps: "30 sec", rest: "60 sec" }, trackingType: "duration", unilateralMode: "bilateral", supportedLoadUnits: [], supportedDistanceUnits: [], primaryValueLabel: "Duration", secondaryValueLabel: null, coachingNote: "Move smoothly.", videoUrl: "https://youtu.be/dQw4w9WgXcQ", videoSearchQuery: "custom prowler march exercise demo" };
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

  it("preserves catalog metadata precedence and reviewed alias resolution", async () => {
    const catalog = { ...exercise, name: "Barbell RDL", proposedCatalogId: "romanian-deadlift", videoUrl: "not a url", trackingType: "duration" };
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
