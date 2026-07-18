import { describe, expect, it } from "vitest";
import {
  normalizeExerciseLookupKey,
  resolveExerciseIdentityByCanonicalId,
  resolveExerciseIdentityByReviewedName,
  resolveSystemExerciseIdentity,
} from "@/lib/exercise-identity";

describe("exercise identity resolution", () => {
  it("normalizes punctuation and case without making the key an identity", () => {
    expect(normalizeExerciseLookupKey(" Push-Up ")).toBe("push up");
    expect(normalizeExerciseLookupKey("RDL")).toBe("rdl");
  });

  it("resolves exact canonical ids first", () => {
    expect(resolveExerciseIdentityByCanonicalId("push-up")).toMatchObject({
      status: "resolved",
      candidate: { canonicalId: "push-up" },
    });
  });

  it("resolves reviewed punctuation aliases to one canonical exercise", () => {
    expect(resolveExerciseIdentityByReviewedName("Push Up")).toMatchObject({
      status: "resolved",
      candidate: { canonicalId: "push-up" },
    });
  });

  it("blocks generic abbreviations unless an explicit equipment variant is approved", () => {
    expect(resolveExerciseIdentityByReviewedName("RDL")).toMatchObject({
      status: "unresolved",
    });
    expect(resolveExerciseIdentityByReviewedName("Barbell RDL")).toMatchObject({
      status: "resolved",
      candidate: { canonicalId: "romanian-deadlift" },
    });
  });

  it("keeps materially different equipment variants separate", () => {
    const bodyweight =
      resolveExerciseIdentityByReviewedName("Bodyweight squat");
    const box = resolveExerciseIdentityByReviewedName("Box squat");

    expect(bodyweight).toMatchObject({
      status: "resolved",
      candidate: { canonicalId: "bodyweight-squat" },
    });
    expect(box).toMatchObject({
      status: "resolved",
      candidate: { canonicalId: "box-squat" },
    });
  });

  it("leaves unreviewed custom names unresolved", () => {
    expect(
      resolveSystemExerciseIdentity({ displayName: "Custom rehab wall squat" }),
    ).toMatchObject({
      status: "unresolved",
    });
  });
});
