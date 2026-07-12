import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("set logging card density source checks", () => {
  const checklist = readFileSync("components/workout-checklist.tsx", "utf8");

  it("does not render the redundant prescription banner", () => {
    expect(checklist).not.toContain("sets ·");
  });

  it("does not render completion instruction copy under metric rows", () => {
    expect(checklist).not.toContain("Enter weight and whole-number reps");
    expect(checklist).not.toContain("Enter whole-number reps to complete this set");
  });

  it("does not render an exercise-level Completed badge for metric exercises", () => {
    expect(checklist).not.toContain(">Completed<");
  });
});
