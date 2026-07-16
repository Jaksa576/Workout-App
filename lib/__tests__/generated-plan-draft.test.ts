import { describe, expect, it } from "vitest";
import { normalizeGeneratedPlanDraft, resolveGeneratedExercise, validateReviewedAliasIntegrity, canSaveNormalizedGeneratedDraft, type GeneratedPlanDraft, type ProviderExerciseCandidate } from "@/lib/generated-plan-draft";

const base = (overrides: Partial<ProviderExerciseCandidate> = {}): ProviderExerciseCandidate => ({
  name: "Custom prowler march",
  prescription: { sets: 3, reps: "30 sec", rest: "60 sec" },
  trackingType: "duration",
  unilateralMode: "bilateral",
  supportedLoadUnits: [],
  supportedDistanceUnits: [],
  primaryValueLabel: "Duration",
  secondaryValueLabel: null,
  coachingNote: "Move smoothly without pain.",
  videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  videoSearchQuery: "custom prowler march exercise demo",
  ...overrides
});

const draft = (exercise: ProviderExerciseCandidate): GeneratedPlanDraft => ({
  version: "generated-plan-draft-v1",
  name: "Generated plan",
  description: "Reviewable draft",
  weeklySchedule: ["mon"],
  phases: [{ goal: "Build", workouts: [{ name: "Day 1", focus: "Strength", summary: "Work", scheduledDays: ["mon"], exercises: [exercise] }] }]
});

describe("generated plan draft matching", () => {
  it("matches exact catalog IDs with catalog metadata precedence", () => {
    const result = resolveGeneratedExercise(base({ proposedCatalogId: "romanian-deadlift", name: "Romanian Deadlift", trackingType: "duration", videoUrl: "https://www.youtube.com/watch?v=provider" }));
    expect(result.status).toBe("matched");
    if (result.status === "matched") {
      expect(result.provenance).toMatchObject({ kind: "catalog_id" });
      expect(result.exercise.sourceExerciseId).toBe("romanian-deadlift");
      expect(result.exercise.trackingType).toBe("weight_reps");
      expect(result.exercise.videoUrl).not.toBe("https://www.youtube.com/watch?v=provider");
    }
  });

  it("matches canonical names and reviewed aliases including RDL plural", () => {
    expect(resolveGeneratedExercise(base({ name: "Romanian Deadlift" }))).toMatchObject({ status: "matched", provenance: { kind: "canonical_name" } });
    expect(resolveGeneratedExercise(base({ name: "RDL" }))).toMatchObject({ status: "matched", provenance: { kind: "reviewed_alias", catalogId: "romanian-deadlift" } });
    expect(resolveGeneratedExercise(base({ name: "Romanian Deadlifts" }))).toMatchObject({ status: "matched", provenance: { kind: "reviewed_alias", catalogId: "romanian-deadlift" } });
  });

  it("records invalid ID followed by unique name match and ID/name conflicts", () => {
    expect(resolveGeneratedExercise(base({ proposedCatalogId: "missing", name: "RDL" }))).toMatchObject({ status: "matched", provenance: { kind: "invalid_id_name_match" } });
    expect(resolveGeneratedExercise(base({ proposedCatalogId: "push-up", name: "RDL" }))).toMatchObject({ status: "needs_review", provenance: { kind: "id_name_conflict" } });
  });

  it("keeps complete unmatched exercises as custom and incomplete custom/video issues blocking review save", () => {
    expect(resolveGeneratedExercise(base())).toMatchObject({ status: "custom" });
    expect(resolveGeneratedExercise(base({ videoUrl: "https://example.com/video" }))).toMatchObject({ status: "needs_review", issues: [{ code: "invalid_custom_candidate", field: "videoUrl" }] });
  });

  it("leaves generic Row ambiguous and save-blocking while still reviewable", () => {
    const normalized = normalizeGeneratedPlanDraft(draft(base({ name: "Row" })));
    expect("fatalErrors" in normalized).toBe(false);
    if (!("fatalErrors" in normalized)) {
      expect(normalized.exercises[0]).toMatchObject({ status: "needs_review" });
      expect(canSaveNormalizedGeneratedDraft(normalized)).toBe(false);
    }
  });

  it("fails duplicate or colliding reviewed alias validation", () => {
    validateReviewedAliasIntegrity();
    expect(() => validateReviewedAliasIntegrity({ "push-up": ["press"], "dumbbell-shoulder-press": ["press"] })).toThrow(/collision/);
  });

  it("keeps catalog guidance separate from generated plan-specific coaching", () => {
    const result = resolveGeneratedExercise(base({ proposedCatalogId: "push-up", name: "Push-up", coachingNote: "Plan-specific effort cue." }));
    expect(result).toMatchObject({ status: "matched", planSpecificCoaching: "Plan-specific effort cue." });
  });

  it("returns fatal errors for missing prescriptions and structurally invalid plans", () => {
    expect(normalizeGeneratedPlanDraft({ ...draft(base()), phases: [] })).toMatchObject({ fatalErrors: [{ code: "invalid_plan_hierarchy" }] });
    expect(normalizeGeneratedPlanDraft(draft({ ...base(), prescription: { sets: 0 as never, reps: "", rest: "" } }))).toMatchObject({ fatalErrors: [{ code: "missing_required_prescription" }] });
  });

  it("performs no persistence during normalization", () => {
    const normalized = normalizeGeneratedPlanDraft(draft(base({ name: "RDL" })));
    expect("fatalErrors" in normalized).toBe(false);
    expect(JSON.stringify(normalized)).not.toContain("insert");
  });
});
