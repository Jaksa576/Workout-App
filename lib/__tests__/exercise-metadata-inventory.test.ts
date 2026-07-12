import { describe, expect, it } from "vitest";
import { exerciseCatalog } from "@/lib/exercise-library";
import { exerciseMetadataInventory, findInventoryItemsByNormalizedName, getInventoryTotals } from "@/lib/exercise-metadata-inventory";

describe("exercise metadata inventory", () => {
  it("covers every catalog exercise exactly once", () => {
    expect(exerciseMetadataInventory).toHaveLength(exerciseCatalog.length);
    expect(new Set(exerciseMetadataInventory.map((item) => item.inventoryKey)).size).toBe(exerciseMetadataInventory.length);
    expect(exerciseMetadataInventory.map((item) => item.inventoryKey).sort()).toEqual(exerciseCatalog.map((item) => item.id).sort());
  });

  it("keeps registry metadata synchronized with the runtime catalog", () => {
    for (const catalogItem of exerciseCatalog) {
      const item = exerciseMetadataInventory.find((entry) => entry.inventoryKey === catalogItem.id);
      expect(item).toMatchObject({
        normalizedName: catalogItem.name.toLowerCase(),
        trackingType: catalogItem.trackingType,
        unilateralMode: catalogItem.unilateralMode,
        loadUnit: catalogItem.loadUnit,
        distanceUnit: catalogItem.distanceUnit,
        primaryValueLabel: catalogItem.primaryValueLabel,
        secondaryValueLabel: catalogItem.secondaryValueLabel
      });
    }
  });

  it("documents intentional completion reasons", () => {
    for (const item of exerciseMetadataInventory.filter((entry) => entry.trackingType === "completion")) {
      expect(item.intentionalCompletionReason).toEqual(expect.any(String));
      expect(item.intentionalCompletionReason?.length).toBeGreaterThan(10);
    }
  });

  it("supports deterministic normalized-name lookup without fuzzy inference", () => {
    expect(findInventoryItemsByNormalizedName("  Goblet   Squat ")).toEqual([
      expect.objectContaining({ inventoryKey: "goblet-squat", trackingType: "weight_reps" })
    ]);
    expect(findInventoryItemsByNormalizedName("goblet squat jump")).toEqual([]);
  });

  it("summarizes inventory totals by tracking type", () => {
    expect(getInventoryTotals()).toMatchObject({
      weight_reps: expect.objectContaining({ names: expect.any(Number) }),
      reps_only: expect.objectContaining({ names: expect.any(Number) }),
      duration: expect.objectContaining({ names: expect.any(Number) }),
      distance_duration: expect.objectContaining({ names: expect.any(Number) })
    });
  });
});
