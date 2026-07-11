import { beforeEach, describe, expect, it, vi } from "vitest";

const user = { id: "user-1" };
const workout = {
  id: "00000000-0000-4000-8000-000000000111",
  name: "Workout A",
  phase_id: "phase-1",
};
const exercise = {
  id: "exercise-1",
  name: "Squat",
  sets: 3,
  reps: "8",
  sort_order: 0,
  source_exercise_id: "bodyweight_squat",
  tracking_type: null,
  unilateral_mode: null,
  load_unit: null,
  distance_unit: null,
  primary_value_label: null,
  secondary_value_label: null,
};
const savedSession = {
  id: "00000000-0000-4000-8000-000000000123",
  workout_template_id: workout.id,
  workout_name_snapshot: workout.name,
  created_at: "2026-07-11T00:00:00Z",
  completed_on: "2026-07-11",
  completed: true,
  pain_occurred: false,
  perceived_difficulty: "appropriate",
  notes: "",
  recommendation: "Keep going",
  phase_id_at_completion: "phase-1",
  progression_decision: null,
  progression_reason: null,
};

let existingSession: typeof savedSession | null = null;
let rpcCalls = 0;
let progressionCalls = 0;
let lastRpcPayload: any = null;

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn(async () => user) }));
vi.mock("@/lib/server-time-zone", () => ({
  getServerTimeZone: vi.fn(async () => "UTC"),
}));
vi.mock("@/lib/data", () => ({
  getPlans: vi.fn(async () => [
    {
      id: "plan-1",
      currentPhase: { id: "phase-1", phaseNumber: 1, goal: "Base" },
      workouts: [{ id: workout.id }],
    },
  ]),
}));
vi.mock("@/lib/progression", () => ({
  evaluatePhaseProgression: vi.fn(() => {
    progressionCalls += 1;
    return { decision: null, recommendation: "Keep going", reason: null };
  }),
}));
vi.mock("@/lib/supabase-server", () => ({
  getSupabaseServerClient: vi.fn(async () => createSupabase()),
}));

function createBuilder(table: string) {
  const builder: any = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    order: vi.fn(() => builder),
    update: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => {
      if (table === "workout_templates") return { data: workout, error: null };
      if (table === "workout_sessions")
        return { data: existingSession, error: null };
      return { data: null, error: null };
    }),
    then: (resolve: any) => {
      if (table === "exercise_entries")
        return resolve({ data: [exercise], error: null });
      if (table === "workout_sessions")
        return resolve({ data: [savedSession], error: null });
      return resolve({ data: null, error: null });
    },
  };
  return builder;
}

function createSupabase() {
  return {
    from: vi.fn((table: string) => createBuilder(table)),
    rpc: vi.fn((_name: string, payload: any) => {
      rpcCalls += 1;
      lastRpcPayload = payload;
      existingSession = savedSession;
      return {
        single: vi.fn(async () => ({ data: savedSession, error: null })),
      };
    }),
  };
}

async function post(body: Record<string, unknown>) {
  const { POST } = await import("@/app/api/sessions/route");
  return POST(
    new Request("http://test.local/api/sessions", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
}

const body = {
  workoutTemplateId: workout.id,
  completedOn: "2026-07-11",
  completed: true,
  painOccurred: false,
  perceivedDifficulty: "appropriate",
  notes: "",
  completedExerciseIds: [exercise.id],
  clientSessionId: savedSession.id,
  startedAt: "2026-07-11T00:00:00.000Z",
  elapsedSeconds: 300,
};

describe("active workout session route lifecycle", () => {
  beforeEach(() => {
    existingSession = null;
    rpcCalls = 0;
    progressionCalls = 0;
    lastRpcPayload = null;
    vi.resetModules();
  });

  it("uses client_timer for draft-backed saves", async () => {
    const response = await post(body);

    expect(response.status).toBe(200);
    expect(lastRpcPayload.p_session.elapsed_source).toBe("client_timer");
  });

  it("rejects invalid clientSessionId before database casts", async () => {
    const response = await post({ ...body, clientSessionId: "not-a-uuid" });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toMatch(/valid UUID/);
    expect(rpcCalls).toBe(0);
  });

  it("returns an existing owned session on uncertain-response retry without rerunning progression", async () => {
    const first = await post(body);
    expect(first.status).toBe(200);
    expect(rpcCalls).toBe(1);
    expect(progressionCalls).toBe(1);

    const retry = await post(body);
    const payload = await retry.json();

    expect(retry.status).toBe(200);
    expect(payload.session.id).toBe(savedSession.id);
    expect(rpcCalls).toBe(1);
    expect(progressionCalls).toBe(1);
  });

  it("rejects an existing same-id session for a different workout", async () => {
    existingSession = {
      ...savedSession,
      workout_template_id: "00000000-0000-4000-8000-000000000999",
    };

    const response = await post(body);

    expect(response.status).toBe(409);
    expect(rpcCalls).toBe(0);
  });
});
