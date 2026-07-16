import { describe, expect, it, vi } from "vitest";
import { normalizeGeneratedPlanDraft, resolveGeneratedExercise, validateReviewedAliasIntegrity, canSaveNormalizedGeneratedDraft, type GeneratedPlanDraft, type ProviderExerciseCandidate } from "@/lib/generated-plan-draft";

const base = (overrides: Partial<ProviderExerciseCandidate> = {}): ProviderExerciseCandidate => ({
  name: "Custom prowler march",
  prescription: { sets: 3, reps: "30 sec", rest: "60 sec", tempo: "2-0-2" },
  trackingType: "duration",
  unilateralMode: "bilateral",
  supportedLoadUnits: [],
  supportedDistanceUnits: [],
  primaryValueLabel: "Duration",
  secondaryValueLabel: null,
  coachingNote: "Move smoothly without pain.",
  safetyNotes: "Stop if pain increases.",
  videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=5s",
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
      expect(result.tempo).toBe("2-0-2");
      expect(result.safetyNotes).toBe("Stop if pain increases.");
    }
  });

  it("preserves exact catalog ID precedence over generic names", () => {
    expect(resolveGeneratedExercise(base({ proposedCatalogId: "dumbbell-row", name: "Row" }))).toMatchObject({ status: "matched", provenance: { kind: "catalog_id", catalogId: "dumbbell-row" } });
    expect(resolveGeneratedExercise(base({ proposedCatalogId: "push-up", name: "Push up" }))).toMatchObject({ status: "matched", provenance: { kind: "catalog_id", catalogId: "push-up" } });
    expect(resolveGeneratedExercise(base({ proposedCatalogId: "push-up", name: "Romanian Deadlift" }))).toMatchObject({ status: "needs_review", provenance: { kind: "id_name_conflict" } });
    expect(resolveGeneratedExercise(base({ proposedCatalogId: "missing", name: "RDL" }))).toMatchObject({ status: "matched", provenance: { kind: "invalid_id_name_match" } });
    expect(resolveGeneratedExercise(base({ name: "Row" }))).toMatchObject({ status: "needs_review", provenance: { kind: "ambiguous" } });
  });

  it("matches canonical names and reviewed aliases including RDL plural", () => {
    expect(resolveGeneratedExercise(base({ name: "Romanian Deadlift" }))).toMatchObject({ status: "matched", provenance: { kind: "canonical_name" } });
    expect(resolveGeneratedExercise(base({ name: "RDL" }))).toMatchObject({ status: "matched", provenance: { kind: "reviewed_alias", catalogId: "romanian-deadlift" } });
    expect(resolveGeneratedExercise(base({ name: "Romanian Deadlifts" }))).toMatchObject({ status: "matched", provenance: { kind: "reviewed_alias", catalogId: "romanian-deadlift" } });
  });

  it("validates custom metadata, units, labels, and canonical YouTube URLs", () => {
    const custom = resolveGeneratedExercise(base());
    expect(custom).toMatchObject({ status: "custom" });
    if (custom.status === "custom") expect(custom.exercise.videoUrl).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(resolveGeneratedExercise(base({ trackingType: "weight_reps", loadUnit: null, supportedLoadUnits: ["lb"], secondaryValueLabel: "Reps" }))).toMatchObject({ status: "needs_review", issues: expect.arrayContaining([expect.objectContaining({ field: "units" })]) });
    expect(resolveGeneratedExercise(base({ trackingType: "distance", distanceUnit: "km", supportedDistanceUnits: ["mi"], primaryValueLabel: "Distance" }))).toMatchObject({ status: "needs_review", issues: expect.arrayContaining([expect.objectContaining({ field: "units" })]) });
    expect(resolveGeneratedExercise(base({ trackingType: "completion", loadUnit: "lb", supportedLoadUnits: ["lb"] }))).toMatchObject({ status: "needs_review", issues: expect.arrayContaining([expect.objectContaining({ field: "units" })]) });
    for (const videoUrl of ["https://youtube.com", "https://www.youtube.com/results?search_query=row", "https://www.youtube.com/playlist?list=abc", "ftp://youtu.be/dQw4w9WgXcQ", "not a url"]) {
      expect(resolveGeneratedExercise(base({ videoUrl }))).toMatchObject({ status: "needs_review", issues: expect.arrayContaining([expect.objectContaining({ field: "videoUrl" })]) });
    }
    expect(resolveGeneratedExercise(base({ videoUrl: "https://youtu.be/dQw4w9WgXcQ?si=abc" }))).toMatchObject({ status: "custom" });
    expect(resolveGeneratedExercise(base({ videoUrl: "https://www.youtube.com/shorts/abc123" }))).toMatchObject({ status: "custom" });
  });

  it("returns stable fatal errors for missing and malformed prescriptions without resolving", () => {
    const malformed: GeneratedPlanDraft = { ...draft(base()), phases: [{ goal: "Build", workouts: [{ name: "Day", focus: "", summary: "", scheduledDays: ["mon"], exercises: [base({ prescription: undefined }), base({ prescription: { sets: 1.5, reps: "8", rest: "60 sec" } }), base({ prescription: { sets: 0, reps: "8", rest: "60 sec" } }), base({ prescription: { sets: 3, reps: "", rest: "60 sec" } }), base({ prescription: { sets: 3, reps: "8", rest: "" } })] }] }] };
    expect(() => normalizeGeneratedPlanDraft(malformed)).not.toThrow();
    const result = normalizeGeneratedPlanDraft(malformed);
    expect(result).toMatchObject({ fatalErrors: expect.any(Array) });
    if ("fatalErrors" in result) expect(result.fatalErrors.map((e) => e.path)).toEqual([
      "phases.0.workouts.0.exercises.0.prescription",
      "phases.0.workouts.0.exercises.1.prescription",
      "phases.0.workouts.0.exercises.2.prescription",
      "phases.0.workouts.0.exercises.3.prescription",
      "phases.0.workouts.0.exercises.4.prescription"
    ]);
  });

  it("rejects every empty hierarchy level and required field before save", () => {
    const cases: GeneratedPlanDraft[] = [
      { ...draft(base()), name: "" },
      { ...draft(base()), weeklySchedule: [] },
      { ...draft(base()), phases: [] },
      { ...draft(base()), phases: [{ goal: "", workouts: draft(base()).phases[0].workouts }] },
      { ...draft(base()), phases: [{ goal: "Build", workouts: [] }] },
      { ...draft(base()), phases: [{ goal: "Build", workouts: [{ ...draft(base()).phases[0].workouts[0], name: "" }] }] },
      { ...draft(base()), phases: [{ goal: "Build", workouts: [{ ...draft(base()).phases[0].workouts[0], scheduledDays: [] }] }] },
      { ...draft(base()), phases: [{ goal: "Build", workouts: [{ ...draft(base()).phases[0].workouts[0], exercises: [] }] }] }
    ];
    for (const value of cases) expect(normalizeGeneratedPlanDraft(value)).toHaveProperty("fatalErrors");
    const valid = normalizeGeneratedPlanDraft(draft(base({ name: "RDL" })));
    expect("fatalErrors" in valid).toBe(false);
    if (!("fatalErrors" in valid)) expect(canSaveNormalizedGeneratedDraft(valid)).toBe(true);
  });

  it("leaves generic Row ambiguous and save-blocking while still reviewable", () => {
    const normalized = normalizeGeneratedPlanDraft(draft(base({ name: "Row" })));
    expect("fatalErrors" in normalized).toBe(false);
    if (!("fatalErrors" in normalized)) {
      expect(normalized.exercises[0]).toMatchObject({ status: "needs_review" });
      expect(canSaveNormalizedGeneratedDraft(normalized)).toBe(false);
    }
  });

  it("validates one canonical-name and alias namespace", () => {
    validateReviewedAliasIntegrity();
    expect(() => validateReviewedAliasIntegrity({ "push-up": ["press"], "dumbbell-shoulder-press": ["press"] })).toThrow(/collision/);
    expect(() => validateReviewedAliasIntegrity({ "push-up": ["Dumbbell shoulder press"] })).toThrow(/collision/);
    expect(() => validateReviewedAliasIntegrity({ "push-up": ["push-up"], "romanian-deadlift": ["Push up"] })).toThrow(/collision/);
    expect(() => validateReviewedAliasIntegrity({ "push-up": ["!!!"] })).toThrow(/blank/);
    expect(() => validateReviewedAliasIntegrity({ "missing": ["thing"] })).toThrow(/does not exist/);
    expect(() => validateReviewedAliasIntegrity({ "push-up": ["push up", "Push-up"] })).toThrow(/Duplicate/);
    expect(() => validateReviewedAliasIntegrity({ "romanian-deadlift": ["RDL", "Romanian Deadlifts"] })).not.toThrow();
  });

  it("keeps normalization in memory without persistence dependencies", async () => {
    const write = vi.fn();
    const normalized = normalizeGeneratedPlanDraft(draft(base({ name: "RDL" })));
    expect("fatalErrors" in normalized).toBe(false);
    expect(write).not.toHaveBeenCalled();
    const moduleSource = await import("node:fs/promises").then((fs) => fs.readFile("lib/generated-plan-draft.ts", "utf8"));
    expect(moduleSource).not.toMatch(/from "@\/lib\/plan-write"|supabase|createStructuredPlanForUser|updateStructuredPlanForUser/);
  });
});
