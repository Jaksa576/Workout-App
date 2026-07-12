import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("components/workout-checklist.tsx", "utf8");

describe("Issue #14 independent-side row rendering", () => {
  it("renders explicit left/right inputs for approved independent-side metrics", () => {
    expect(source).toContain('exercise.unilateralMode === "independent_sides"');
    for (const field of [
      "actualLeftLoad",
      "actualLeftReps",
      "actualLeftDurationSeconds",
      "actualLeftDistance",
      "actualRightLoad",
      "actualRightReps",
      "actualRightDurationSeconds",
      "actualRightDistance",
    ]) {
      expect(source).toContain(field);
    }
  });

  it("focuses the first missing side field instead of showing a page-level banner", () => {
    expect(source).toContain("getFirstMissingFieldKey");
    expect(source).toContain("inputRefs.current[firstInvalidKey]?.focus()");
    expect(source).toContain("aria-describedby");
  });
});
