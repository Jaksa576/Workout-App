import { describe, expect, it } from "vitest";
import { buildPrescribedSetRows, getDefaultTrackingMetadata } from "@/lib/execution-results";

describe("execution result metadata", () => {
  it("classifies catalog-backed weighted unilateral exercises without name inference", () => {
    expect(getDefaultTrackingMetadata("dumbbell-row")).toMatchObject({
      trackingType: "weight_reps",
      unilateralMode: "same_each_side",
      loadUnit: "lb"
    });
  });

  it("keeps unknown custom exercises on the explicit completion fallback", () => {
    expect(getDefaultTrackingMetadata(null)).toMatchObject({
      trackingType: "completion",
      unilateralMode: "bilateral",
      primaryValueLabel: "Completion"
    });
  });

  it("builds one deterministic prescribed set row per visible set", () => {
    expect(buildPrescribedSetRows("result-1", { sets: 2 }, true)).toEqual([
      expect.objectContaining({ exercise_result_id: "result-1", set_order: 0, prescribed_set_index: 0, set_kind: "prescribed", status: "completed" }),
      expect.objectContaining({ exercise_result_id: "result-1", set_order: 1, prescribed_set_index: 1, set_kind: "prescribed", status: "completed" })
    ]);
  });
});
