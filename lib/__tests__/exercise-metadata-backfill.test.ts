import { describe, expect, it } from "vitest";
import { findIssue14BackfillMapping } from "@/lib/exercise-metadata-backfill";

function map(input: { sourceExerciseId?: string | null; name: string; reps: string; currentTrackingType?: "completion" | "weight_reps" }) {
  return findIssue14BackfillMapping({ currentTrackingType: "completion", currentUnilateralMode: "bilateral", ...input });
}

describe("Issue #14 exercise metadata backfill mapping", () => {
  it("maps the four QA-reported stale completion exercises", () => {
    expect(map({ name: "Hamstring Bridge Hold", reps: "20 seconds" })).toMatchObject({ trackingType: "duration", unilateralMode: "bilateral" });
    expect(map({ name: "Lateral Band Walk", reps: "10 per side" })).toMatchObject({ trackingType: "reps_only", unilateralMode: "same_each_side" });
    expect(map({ name: "Half-Kneeling Hip Flexor Stretch", reps: "30 seconds per side" })).toMatchObject({ trackingType: "duration", unilateralMode: "same_each_side" });
    expect(map({ name: "Dead Bug", reps: "6 per side" })).toMatchObject({ trackingType: "reps_only", unilateralMode: "same_each_side" });
  });

  it("maps representative loaded strength to weight and reps", () => {
    expect(map({ sourceExerciseId: "romanian-deadlift", name: "Romanian deadlift", reps: "8" })).toMatchObject({ trackingType: "weight_reps", loadUnit: "lb", secondaryValueLabel: "Reps" });
  });

  it("maps representative bodyweight and core work to reps-only", () => {
    expect(map({ sourceExerciseId: "push-up", name: "Push-up", reps: "8-10" })).toMatchObject({ trackingType: "reps_only", unilateralMode: "bilateral" });
    expect(map({ sourceExerciseId: "bird-dog", name: "Bird dog", reps: "8 each side" })).toMatchObject({ trackingType: "reps_only", unilateralMode: "same_each_side" });
  });

  it("maps representative isometrics to duration", () => {
    expect(map({ sourceExerciseId: "side-plank", name: "Side plank", reps: "20 sec each side" })).toMatchObject({ trackingType: "duration", unilateralMode: "same_each_side" });
  });

  it("leaves true completion-only or unknown exercises unchanged", () => {
    expect(map({ name: "Breathing reset", reps: "complete" })).toBeNull();
  });

  it("does not force ambiguous distance-only entries into distance_duration", () => {
    expect(map({ name: "Cone Carry", reps: "20 m" })).toBeNull();
  });

  it("does not alter already-correct metadata on rerun", () => {
    expect(findIssue14BackfillMapping({ sourceExerciseId: "romanian-deadlift", name: "Romanian deadlift", reps: "8", currentTrackingType: "weight_reps", currentUnilateralMode: "bilateral" })).toBeNull();
  });
});
