import { describe, expect, it } from "vitest";
import {
  activeWorkoutDraftVersion,
  buildActiveWorkoutDraft,
  getActiveWorkoutDraftStorageKey,
  getElapsedSeconds,
  readActiveWorkoutDraft,
  validateActiveWorkoutDraft,
} from "@/lib/active-workout-draft";
import type { WorkoutPlan, WorkoutTemplate } from "@/lib/types";

function makeWorkout(id = "workout-a"): WorkoutTemplate {
  return {
    id,
    phaseId: "phase-a",
    name: "Lower Strength",
    focus: "Strength",
    summary: "Squat and hinge.",
    readiness: "Ready",
    scheduledDays: ["mon"],
    exercises: [
      {
        id: "exercise-a",
        name: "Squat",
        sets: 3,
        reps: "5",
        rest: "2 min",
        coachingNote: "Brace.",
      },
    ],
  };
}

function makePlan(): WorkoutPlan {
  return {
    id: "plan-a",
    name: "Plan",
    description: "Plan",
    isActive: true,
    scheduleSummary: "3 days",
    weeklySchedule: ["mon"],
    completedAt: null,
    archivedAt: null,
    currentPhase: {
      id: "phase-a",
      phaseNumber: 1,
      goal: "Build",
      advanceCriteria: "Clean sessions",
      deloadCriteria: "Pain",
      advancementPreset: "clean_sessions_in_window",
      advancementSettings: { sessions: 4, weeks: 2 },
      deloadPreset: "pain_flags_in_window",
      deloadSettings: { painFlags: 2, days: 7 },
    },
    phases: [],
    workouts: [makeWorkout()],
  };
}

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  clear() {
    this.values.clear();
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("active workout draft lifecycle helpers", () => {
  it("builds a stable user-scoped draft identity for recommended or alternate workouts", () => {
    const draft = buildActiveWorkoutDraft({
      userId: "user-a",
      workout: makeWorkout("alternate-workout"),
      plan: makePlan(),
      draftId: "draft-a",
      now: new Date("2026-07-11T12:00:00.000Z"),
    });

    expect(draft).toMatchObject({
      version: activeWorkoutDraftVersion,
      lifecycle: "active",
      userId: "user-a",
      draftId: "draft-a",
      workoutTemplateId: "alternate-workout",
      planId: "plan-a",
      phaseId: "phase-a",
      workoutNameSnapshot: "Lower Strength",
      checkedExerciseIds: [],
    });
  });

  it("isolates persisted drafts by authenticated user", () => {
    const storage = new MemoryStorage();
    const draft = buildActiveWorkoutDraft({
      userId: "user-a",
      workout: makeWorkout(),
      plan: makePlan(),
      draftId: "draft-a",
    });
    storage.setItem(
      getActiveWorkoutDraftStorageKey("user-a"),
      JSON.stringify(draft),
    );

    expect(readActiveWorkoutDraft(storage, "user-a")).toMatchObject({
      status: "valid",
    });
    expect(readActiveWorkoutDraft(storage, "user-b")).toEqual({
      status: "empty",
    });
  });

  it("detects malformed JSON, unsupported versions, and stale drafts deterministically", () => {
    const storage = new MemoryStorage();
    storage.setItem(getActiveWorkoutDraftStorageKey("user-a"), "not-json");
    expect(readActiveWorkoutDraft(storage, "user-a")).toMatchObject({
      status: "invalid",
      reason: "Workout recovery data is malformed.",
    });

    expect(
      validateActiveWorkoutDraft({ version: 999 }, "user-a"),
    ).toMatchObject({
      status: "invalid",
      reason: "Draft version is no longer supported.",
    });

    const staleDraft = buildActiveWorkoutDraft({
      userId: "user-a",
      workout: makeWorkout(),
      plan: makePlan(),
      now: new Date("2026-07-01T00:00:00.000Z"),
    });
    expect(
      validateActiveWorkoutDraft(staleDraft, "user-a", {
        now: new Date("2026-07-11T00:00:00.000Z"),
      }),
    ).toMatchObject({ status: "valid", stale: true, ageDays: 10 });
  });

  it("persists the per-workout automatic rest preference with a backward-compatible default", () => {
    const draft = buildActiveWorkoutDraft({
      userId: "user-a",
      workout: makeWorkout(),
      plan: makePlan(),
      draftId: "draft-a",
    });

    expect(draft.autoStartRest).toBe(true);
    expect(draft.timerSoundEnabled).toBe(true);
    expect(draft.workoutRestOverrideEnabled).toBe(false);
    expect(draft.workoutDefaultRestSeconds).toBe(90);

    const disabledResult = validateActiveWorkoutDraft(
      { ...draft, autoStartRest: false, timerSoundEnabled: false, workoutRestOverrideEnabled: true, workoutDefaultRestSeconds: 120 },
      "user-a",
    );
    expect(disabledResult).toMatchObject({
      status: "valid",
      draft: { autoStartRest: false, timerSoundEnabled: false, workoutRestOverrideEnabled: true, workoutDefaultRestSeconds: 120 },
    });

    const legacyDraft = { ...draft } as Record<string, unknown>;
    delete legacyDraft.autoStartRest;
    expect(validateActiveWorkoutDraft(legacyDraft, "user-a")).toMatchObject({
      status: "valid",
      draft: { autoStartRest: true },
    });
  });

  it("migrates legacy nullable workout rest overrides into explicit state", () => {
    const draft = buildActiveWorkoutDraft({
      userId: "user-a",
      workout: makeWorkout(),
      plan: makePlan(),
      draftId: "draft-a",
    });

    const legacyNull = { ...draft, workoutDefaultRestSeconds: null } as Record<string, unknown>;
    delete legacyNull.workoutRestOverrideEnabled;
    expect(validateActiveWorkoutDraft(legacyNull, "user-a")).toMatchObject({
      status: "valid",
      draft: { workoutRestOverrideEnabled: false, workoutDefaultRestSeconds: 90 },
    });

    const legacyNumeric = { ...draft, workoutDefaultRestSeconds: 120 } as Record<string, unknown>;
    delete legacyNumeric.workoutRestOverrideEnabled;
    expect(validateActiveWorkoutDraft(legacyNumeric, "user-a")).toMatchObject({
      status: "valid",
      draft: { workoutRestOverrideEnabled: true, workoutDefaultRestSeconds: 120 },
    });
  });

  it("reconstructs elapsed time from durable timestamps instead of a counter", () => {
    const draft = buildActiveWorkoutDraft({
      userId: "user-a",
      workout: makeWorkout(),
      plan: makePlan(),
      now: new Date("2026-07-11T12:00:00.000Z"),
    });

    expect(getElapsedSeconds(draft, new Date("2026-07-11T12:05:30.000Z"))).toBe(
      330,
    );
  });
});
