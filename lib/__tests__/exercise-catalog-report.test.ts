import { describe, expect, it } from "vitest";
import { exerciseCatalog } from "@/lib/exercise-library";
import { normalizeExerciseLookupKey, resolveExerciseIdentityByCanonicalId, reviewedSystemAliases } from "@/lib/exercise-identity";
import { buildExerciseCatalogInventoryReport, renderExerciseCatalogInventoryMarkdown } from "@/lib/exercise-catalog-report";
import { resolveGeneratedExercise, validateReviewedAliasIntegrity } from "@/lib/generated-plan-draft";
import { normalizeExerciseVideoUrl } from "@/lib/validation";

const base = (name: string, proposedCatalogId?: string) => ({
  name,
  proposedCatalogId,
  prescription: { sets: 3, reps: "8", rest: "60 sec" },
  coachingNote: "Use controlled form.",
  videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  videoSearchQuery: `${name} exercise demo`,
  trackingType: "reps_only" as const,
  unilateralMode: "bilateral" as const,
  primaryValueLabel: "Reps"
});

describe("Issue #69 catalog readiness", () => {
  it("keeps reviewed aliases deterministic and collision-free", () => {
    expect(() => validateReviewedAliasIntegrity()).not.toThrow();
    const report = buildExerciseCatalogInventoryReport();
    expect(report.normalizedCanonicalNameCollisions).toEqual([]);
    expect(report.aliasToAliasCollisions).toEqual([]);
    expect(report.aliasToCanonicalCollisions).toEqual([]);
    expect(report.blankAliases).toEqual([]);
    expect(report.missingAliasTargets).toEqual([]);
    expect(report.duplicateAliases).toEqual([]);
  });

  it("resolves canonical names and reviewed aliases without changing matcher order", () => {
    expect(resolveGeneratedExercise(base("Dumbbell bench press"))).toMatchObject({ status: "matched", provenance: { kind: "canonical_name", catalogId: "dumbbell-bench-press" } });
    expect(resolveGeneratedExercise(base("DB Bench Press"))).toMatchObject({ status: "matched", provenance: { kind: "reviewed_alias", catalogId: "dumbbell-bench-press" } });
    expect(resolveGeneratedExercise(base("Dumbbell Bench"))).toMatchObject({ status: "matched", provenance: { kind: "reviewed_alias", catalogId: "dumbbell-bench-press" } });
    expect(resolveGeneratedExercise(base("Romanian Deadlifts"))).toMatchObject({ status: "matched", provenance: { kind: "reviewed_alias", catalogId: "romanian-deadlift" } });
    expect(resolveGeneratedExercise(base("RDL"))).toMatchObject({ status: "matched", provenance: { kind: "reviewed_alias", catalogId: "romanian-deadlift" } });
    expect(resolveGeneratedExercise(base("DB RDL"))).toMatchObject({ status: "matched", provenance: { kind: "reviewed_alias", catalogId: "dumbbell-romanian-deadlift" } });
  });

  it("keeps generic names review-blocking while exact valid catalog IDs retain precedence", () => {
    for (const genericName of ["Row", "Press", "Shoulder Press", "Curl", "Lunge", "Leg Curl", "Squat", "Deadlift"]) {
      expect(resolveGeneratedExercise(base(genericName))).toMatchObject({ status: "needs_review", provenance: { kind: "ambiguous" } });
    }
    expect(resolveGeneratedExercise(base("Row", "dumbbell-row"))).toMatchObject({ status: "matched", provenance: { kind: "catalog_id", catalogId: "dumbbell-row" } });
  });

  it("preserves unknown custom fallback and needs_review validation", () => {
    expect(resolveGeneratedExercise(base("Prowler March"))).toMatchObject({ status: "custom", provenance: { kind: "custom_candidate" } });
    expect(resolveGeneratedExercise({ ...base("Unverified Custom"), videoUrl: "https://youtube.com/results?search_query=row" })).toMatchObject({ status: "needs_review" });
  });

  it("validates catalog metadata and reviewed YouTube URL formats", () => {
    for (const exercise of exerciseCatalog) {
      expect(exercise.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(normalizeExerciseLookupKey(exercise.name)).not.toBe("");
      expect(exercise.coachingNote.trim()).not.toBe("");
      expect(exercise.primaryValueLabel).toBeTruthy();
      if (exercise.trackingType === "weight_reps") {
        expect(exercise.loadUnit).toBeTruthy();
        expect(exercise.supportedLoadUnits).toContain(exercise.loadUnit);
        expect(exercise.secondaryValueLabel).toBeTruthy();
      }
      if (exercise.trackingType === "distance" || exercise.trackingType === "distance_duration") {
        expect(exercise.distanceUnit).toBeTruthy();
        expect(exercise.supportedDistanceUnits).toContain(exercise.distanceUnit);
      }
      if (!["weight_reps", "distance", "distance_duration"].includes(exercise.trackingType)) {
        expect(exercise.loadUnit).toBeNull();
      }
      if (exercise.videoUrl) expect(normalizeExerciseVideoUrl(exercise.videoUrl)).toBeTruthy();
    }
    expect(normalizeExerciseVideoUrl("https://www.youtube.com/playlist?list=abc")).toBeNull();
  });

  it("renders a deterministic inventory report with before/after-relevant counts", () => {
    const first = renderExerciseCatalogInventoryMarkdown();
    const second = renderExerciseCatalogInventoryMarkdown();
    expect(first).toBe(second);
    const report = buildExerciseCatalogInventoryReport();
    expect(report.totals.activeCatalogExercises).toBeGreaterThanOrEqual(70);
    expect(report.totals.reviewedAliases).toBeGreaterThanOrEqual(50);
    expect(report.byTrackingType.weight_reps).toBeGreaterThan(20);
    expect(report.intentionallyAmbiguousGenericNames).toEqual(["curl", "deadlift", "leg curl", "lunge", "press", "row", "shoulder press", "squat"]);
  });
});
