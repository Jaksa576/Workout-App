import { describe, expect, it } from "vitest";
import {
  reviewGeneratedExerciseAsCustom,
  reviewGeneratedExerciseWithCatalog,
  resolveGeneratedExercise,
  type NormalizedGeneratedExercise,
  type ProviderExerciseCandidate
} from "@/lib/generated-plan-draft";
import {
  buildGeneratedExerciseReviewByPath,
  countGeneratedReviewBlockers,
  getGeneratedReviewKey,
  remapGeneratedReviewAfterDelete,
  setGeneratedReviewOutcome
} from "@/lib/generated-plan-review-state";
import type { StructuredExerciseInput, StructuredPlanInput } from "@/lib/types";

const candidate = (
  overrides: Partial<ProviderExerciseCandidate> = {}
): ProviderExerciseCandidate => ({
  name: "Row",
  prescription: { sets: 3, reps: "8", rest: "60 sec" },
  trackingType: "weight_reps",
  unilateralMode: "bilateral",
  loadUnit: "lb",
  supportedLoadUnits: ["lb"],
  supportedDistanceUnits: [],
  primaryValueLabel: "Load",
  secondaryValueLabel: "Reps",
  coachingNote: "Keep the torso steady.",
  videoUrl: null,
  videoSearchQuery: null,
  ...overrides
});

function needsReview(overrides: Partial<ProviderExerciseCandidate> = {}) {
  const outcome = resolveGeneratedExercise(candidate(overrides));
  if (outcome.status !== "needs_review") throw new Error("Expected a review outcome.");
  return outcome;
}

const exercise = (name: string): StructuredExerciseInput => ({
  name,
  sets: 3,
  reps: "8",
  rest: "60 sec",
  coachingNote: "Keep the torso steady.",
  sourceExerciseId: null,
  trackingType: "weight_reps",
  unilateralMode: "bilateral",
  loadUnit: "lb",
  distanceUnit: null,
  primaryValueLabel: "Load",
  secondaryValueLabel: "Reps"
});

const plan: StructuredPlanInput = {
  version: "structured-v1",
  name: "Review plan",
  description: "Review state",
  creationSource: "llm_draft",
  weeklySchedule: ["mon", "wed"],
  phases: [
    {
      goal: "First",
      advancementPreset: "clean_sessions_in_window",
      advancementSettings: { sessions: 4, weeks: 2 },
      deloadPreset: "pain_flags_in_window",
      deloadSettings: { painFlags: 2, days: 7 },
      workouts: [
        {
          name: "A",
          focus: "A",
          summary: "A",
          scheduledDays: ["mon"],
          exercises: [exercise("A1"), exercise("A2")]
        },
        {
          name: "B",
          focus: "B",
          summary: "B",
          scheduledDays: ["wed"],
          exercises: [exercise("B1")]
        }
      ]
    },
    {
      goal: "Second",
      advancementPreset: "clean_sessions_in_window",
      advancementSettings: { sessions: 4, weeks: 2 },
      deloadPreset: "pain_flags_in_window",
      deloadSettings: { painFlags: 2, days: 7 },
      workouts: [
        {
          name: "C",
          focus: "C",
          summary: "C",
          scheduledDays: ["mon"],
          exercises: [exercise("C1")]
        }
      ]
    }
  ]
};

describe("generated exercise review state", () => {
  it("blocks save until catalog, custom, or removal resolves every issue", () => {
    const first = needsReview();
    const second = needsReview({ name: "Squat" });
    let state = buildGeneratedExerciseReviewByPath(plan, [first, second]);
    expect(countGeneratedReviewBlockers(state)).toBe(2);

    const catalog = reviewGeneratedExerciseWithCatalog(first, "dumbbell-row", exercise("Row"));
    expect(catalog).not.toBeNull();
    state = setGeneratedReviewOutcome(
      state,
      { phaseIndex: 0, workoutIndex: 0, exerciseIndex: 0 },
      catalog!
    );
    expect(countGeneratedReviewBlockers(state)).toBe(1);
    expect(state[getGeneratedReviewKey({ phaseIndex: 0, workoutIndex: 0, exerciseIndex: 1 })])
      .toBe(second);

    const custom = reviewGeneratedExerciseAsCustom(second, exercise("Belt squat to box"));
    expect(custom.ok).toBe(true);
    if (!custom.ok) return;
    expect(custom.outcome).toMatchObject({
      status: "custom",
      exercise: { sourceExerciseId: null }
    });
    expect(custom.outcome.exercise.videoUrl).toBeUndefined();
    state = setGeneratedReviewOutcome(
      state,
      { phaseIndex: 0, workoutIndex: 0, exerciseIndex: 1 },
      custom.outcome
    );
    expect(countGeneratedReviewBlockers(state)).toBe(0);
  });

  it("keeps invalid and unsafe custom candidates blocked", () => {
    const invalid = needsReview({ coachingNote: "", guidance: undefined });
    const invalidResult = reviewGeneratedExerciseAsCustom(invalid, {
      ...exercise("Custom row"),
      coachingNote: ""
    });
    expect(invalidResult).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([
        expect.objectContaining({ field: "coachingNote" })
      ])
    });

    const conflict = needsReview({
      proposedCatalogId: "push-up",
      name: "Barbell Romanian deadlift"
    });
    expect(reviewGeneratedExerciseAsCustom(conflict, exercise("Custom hinge")))
      .toMatchObject({ ok: false, allowedResolution: "catalog_or_remove" });

    expect(reviewGeneratedExerciseAsCustom(needsReview(), exercise("Dumbbell Row")))
      .toMatchObject({
        ok: false,
        issues: expect.arrayContaining([
          expect.objectContaining({ field: "name" })
        ])
      });
  });

  it("remaps blockers after deleting earlier exercises, workouts, and phases", () => {
    const outcomes: NormalizedGeneratedExercise[] = [
      needsReview(),
      needsReview({ name: "Squat" }),
      needsReview({ name: "Press" }),
      needsReview({ name: "Lunge" })
    ];
    const initial = buildGeneratedExerciseReviewByPath(plan, outcomes);

    const afterExercise = remapGeneratedReviewAfterDelete(initial, {
      phaseIndex: 0,
      workoutIndex: 0,
      exerciseIndex: 0
    });
    expect(afterExercise[getGeneratedReviewKey({ phaseIndex: 0, workoutIndex: 0, exerciseIndex: 0 })])
      .toBe(outcomes[1]);
    expect(afterExercise[getGeneratedReviewKey({ phaseIndex: 0, workoutIndex: 1, exerciseIndex: 0 })])
      .toBe(outcomes[2]);

    const afterWorkout = remapGeneratedReviewAfterDelete(initial, {
      phaseIndex: 0,
      workoutIndex: 0
    });
    expect(afterWorkout[getGeneratedReviewKey({ phaseIndex: 0, workoutIndex: 0, exerciseIndex: 0 })])
      .toBe(outcomes[2]);
    expect(countGeneratedReviewBlockers(afterWorkout)).toBe(2);

    const afterPhase = remapGeneratedReviewAfterDelete(initial, { phaseIndex: 0 });
    expect(afterPhase[getGeneratedReviewKey({ phaseIndex: 0, workoutIndex: 0, exerciseIndex: 0 })])
      .toBe(outcomes[3]);
    expect(countGeneratedReviewBlockers(afterPhase)).toBe(1);
  });

  it("removing a flagged exercise removes only its blocker", () => {
    const outcomes = [needsReview(), needsReview({ name: "Squat" })];
    const initial = buildGeneratedExerciseReviewByPath(plan, outcomes);
    const next = remapGeneratedReviewAfterDelete(initial, {
      phaseIndex: 0,
      workoutIndex: 0,
      exerciseIndex: 1
    });
    expect(countGeneratedReviewBlockers(next)).toBe(1);
    expect(next[getGeneratedReviewKey({ phaseIndex: 0, workoutIndex: 0, exerciseIndex: 0 })])
      .toBe(outcomes[0]);
  });
});
