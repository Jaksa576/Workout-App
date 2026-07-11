import { describe, expect, it } from "vitest";
import { buildEffectiveTrackingMetadata, buildPrescribedSetRows, getDefaultTrackingMetadata } from "@/lib/execution-results";
import { getExerciseTrackingMetadataBySourceId } from "@/lib/exercise-library";
import type { ExerciseTrackingType } from "@/lib/types";

describe("execution result metadata", () => {
  it("derives catalog-backed weighted unilateral exercises from the catalog", () => {
    expect(getExerciseTrackingMetadataBySourceId("dumbbell-row")).toMatchObject({
      trackingType: "weight_reps",
      unilateralMode: "same_each_side",
      loadUnit: "lb"
    });
    expect(getDefaultTrackingMetadata("dumbbell-row")).toMatchObject({
      trackingType: "weight_reps",
      unilateralMode: "same_each_side",
      loadUnit: "lb"
    });
  });

  it("keeps unknown source IDs on the explicit completion fallback", () => {
    expect(getDefaultTrackingMetadata("unknown-but-non-null")).toMatchObject({
      trackingType: "completion",
      unilateralMode: "bilateral",
      primaryValueLabel: "Completion"
    });
  });

  it("snapshots explicit overrides when present", () => {
    expect(
      buildEffectiveTrackingMetadata({
        sourceExerciseId: "custom-loaded",
        trackingType: "weight_reps",
        unilateralMode: "bilateral",
        loadUnit: "kg",
        distanceUnit: null,
        primaryValueLabel: "Weight",
        secondaryValueLabel: "Reps"
      })
    ).toEqual({
      trackingType: "weight_reps",
      unilateralMode: "bilateral",
      loadUnit: "kg",
      distanceUnit: null,
      primaryValueLabel: "Weight",
      secondaryValueLabel: "Reps"
    });
  });

  it.each<ExerciseTrackingType>(["weight_reps", "reps_only", "duration", "distance_duration"])(
    "keeps checked %s prescribed rows incomplete because the checklist has no actual metrics",
    (trackingType) => {
      expect(buildPrescribedSetRows("result-1", { sets: 2 }, true, trackingType)).toEqual([
        expect.objectContaining({ status: "incomplete", completed_at: null, prescribed_set_index: 0 }),
        expect.objectContaining({ status: "incomplete", completed_at: null, prescribed_set_index: 1 })
      ]);
    }
  );

  it("allows checked completion-only prescribed rows to be completed", () => {
    const rows = buildPrescribedSetRows("result-1", { sets: 1 }, true, "completion");
    expect(rows[0]).toMatchObject({ status: "completed", prescribed_set_index: 0 });
    expect(rows[0].completed_at).toEqual(expect.any(String));
  });

  it("keeps unchecked exercises incomplete", () => {
    expect(buildPrescribedSetRows("result-1", { sets: 1 }, false, "completion")).toEqual([
      expect.objectContaining({ status: "incomplete", completed_at: null })
    ]);
  });
});
