import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("components/workout-checklist.tsx", "utf8");

describe("active exercise details surface", () => {
  it("exposes a visible details action and defaults details to summary", () => {
    expect(source).toContain(">\n                      Details\n");
    expect(source).toContain('setDetailsSection("summary")');
    expect(source).toContain('aria-label={`View details for ${exercise.name}`}');
  });

  it("moves guidance content out of the active card into Summary", () => {
    expect(source).not.toContain("ExerciseGuidancePanel");
    expect(source).toContain('SummaryBlock title="Setup"');
    expect(source).toContain('SummaryList title="Cues"');
    expect(source).toContain('SummaryBlock title="Safety"');
    expect(source).toContain('SummaryList title="Modifications"');
    expect(source).toContain('SummaryList title="Common mistakes"');
  });

  it("keeps a deliberate empty history state", () => {
    expect(source).toContain("No completed history for this exercise yet.");
  });
});
