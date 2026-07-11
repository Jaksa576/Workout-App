import { describe, expect, it, vi } from "vitest";
import { shouldPersistActiveWorkoutDraft } from "@/lib/active-workout-lifecycle";
import {
  buildActiveWorkoutDraft,
  getActiveWorkoutDraftStorageKey,
  readActiveWorkoutDraft,
  writeActiveWorkoutDraft,
  type ActiveWorkoutDraft,
} from "@/lib/active-workout-draft";
import type { WorkoutPlan, WorkoutTemplate } from "@/lib/types";

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

function makeWorkout(): WorkoutTemplate {
  return {
    id: "workout-a",
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

function makeStaleDraft(lifecycle: ActiveWorkoutDraft["lifecycle"]) {
  return {
    ...buildActiveWorkoutDraft({
      userId: "user-a",
      workout: makeWorkout(),
      plan: makePlan(),
      draftId: "00000000-0000-4000-8000-000000000123",
      now: new Date("2026-07-01T00:00:00.000Z"),
    }),
    lifecycle,
    checkedExerciseIds: ["exercise-a"],
    checkIn: {
      completedOn: "2026-07-01",
      completed: true,
      painOccurred: false,
      perceivedDifficulty: "appropriate" as const,
      notes: "felt good",
    },
  };
}

describe("stale active workout recovery persistence", () => {
  it("does not refresh stale draft storage until explicit Resume", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-11T00:00:00.000Z"));

    try {
      const storage = new MemoryStorage();
      const storageKey = getActiveWorkoutDraftStorageKey("user-a");
      const staleDraft = makeStaleDraft("finishing");
      storage.setItem(storageKey, JSON.stringify(staleDraft));

      const pageLoad = readActiveWorkoutDraft(storage, "user-a", {
        now: new Date("2026-07-11T00:00:00.000Z"),
      });
      expect(pageLoad).toMatchObject({ status: "valid", stale: true });
      expect(
        shouldPersistActiveWorkoutDraft({
          hasActiveDraft: true,
          step: "idle",
          awaitingStaleRecoveryDecision: true,
        }),
      ).toBe(false);

      const afterIdleDecision = JSON.parse(storage.getItem(storageKey) ?? "{}");
      expect(afterIdleDecision.lastUpdatedAt).toBe(staleDraft.lastUpdatedAt);
      expect(afterIdleDecision.lifecycle).toBe("finishing");

      const refresh = readActiveWorkoutDraft(storage, "user-a", {
        now: new Date("2026-07-11T00:00:00.000Z"),
      });
      expect(refresh).toMatchObject({ status: "valid", stale: true });

      expect(
        shouldPersistActiveWorkoutDraft({
          hasActiveDraft: true,
          step: "check-in",
          awaitingStaleRecoveryDecision: false,
        }),
      ).toBe(true);
      const resumedDraft = writeActiveWorkoutDraft(storage, {
        ...staleDraft,
        lifecycle: "finishing",
      });

      expect(resumedDraft.lastUpdatedAt).toBe("2026-07-11T00:00:00.000Z");
      expect(resumedDraft.lifecycle).toBe("finishing");
      expect(resumedDraft.checkedExerciseIds).toEqual(["exercise-a"]);
      expect(resumedDraft.checkIn.notes).toBe("felt good");
    } finally {
      vi.useRealTimers();
    }
  });
});
