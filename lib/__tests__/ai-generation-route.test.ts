import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: { id: "user-1", email: null } as { id: string; email: null } | null,
  orchestrate: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn(async () => mocks.user) }));
vi.mock("@/lib/ai-generation/orchestrate-generation", () => ({
  orchestrateAuthenticatedPlanGeneration: mocks.orchestrate,
}));

const setup = {
  goalType: "strength",
  objectiveSummary: "Get stronger",
  daysPerWeek: 1,
  sessionMinutes: 45,
  weeklySchedule: ["mon"],
  preferredSplit: "full_body",
  focusAreas: ["squat"],
  currentConstraints: [],
};

async function post(body: unknown, headers?: HeadersInit) {
  const { POST } = await import("@/app/api/ai/plan-drafts/route");
  return POST(new Request("http://test.local/api/ai/plan-drafts", {
    method: "POST",
    body: JSON.stringify(body),
    headers,
  }));
}

describe("authenticated AI plan draft route", () => {
  beforeEach(() => {
    mocks.user = { id: "user-1", email: null };
    mocks.orchestrate.mockReset();
    vi.resetModules();
  });

  it("rejects unauthenticated requests before orchestration", async () => {
    mocks.user = null;
    const response = await post(setup);
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ ok: false, error: { code: "unauthenticated" } });
    expect(mocks.orchestrate).not.toHaveBeenCalled();
  });

  it("rejects invalid setup and invalid idempotency keys before orchestration", async () => {
    expect((await post({ daysPerWeek: 99 })).status).toBe(400);
    expect((await post(setup, { "idempotency-key": "raw prompt is not an id" })).status).toBe(400);
    expect(mocks.orchestrate).not.toHaveBeenCalled();
  });

  it("returns only the canonical draft and safe quota metadata", async () => {
    const draft = { plan: { version: "structured-v1" }, exercises: [], reviewBlockingIssues: [] };
    mocks.orchestrate.mockResolvedValue({ ok: true, draft, quotaDate: "2026-07-18" });
    const response = await post(setup, { "idempotency-key": "request-123" });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true, draft, quotaDate: "2026-07-18" });
    expect(mocks.orchestrate).toHaveBeenCalledWith(expect.objectContaining({
      userId: "user-1",
      requestIdentifier: expect.stringMatching(/^[a-f0-9]{64}$/),
    }));
    expect(mocks.orchestrate.mock.calls[0][0].requestIdentifier).not.toContain("request-123");
  });

  it("maps typed failures without provider-controlled details", async () => {
    mocks.orchestrate.mockResolvedValue({
      ok: false,
      error: { code: "provider_unavailable", message: "AI plan generation is temporarily unavailable." },
      quotaDate: "2026-07-18",
    });
    const response = await post(setup);
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload).toEqual({
      ok: false,
      error: { code: "provider_unavailable", message: "AI plan generation is temporarily unavailable." },
      quotaDate: "2026-07-18",
    });
  });

  it("never exposes internal invalid-draft diagnostics", async () => {
    mocks.orchestrate.mockResolvedValue({
      ok: false,
      error: {
        code: "orchestration_unavailable",
        message: "AI plan generation is temporarily unavailable.",
        diagnostic: {
          model: "gemini-3.5-flash",
          fatalValidationErrorCodes: ["invalid_plan_hierarchy"],
        },
      },
      quotaDate: "2026-07-19",
    });
    const response = await post(setup);
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload).toEqual({
      ok: false,
      error: { code: "orchestration_unavailable", message: "AI plan generation is temporarily unavailable." },
      quotaDate: "2026-07-19",
    });
    expect(JSON.stringify(payload)).not.toContain("diagnostic");
  });
});
