import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("components/workout-checklist.tsx", "utf8");

describe("active exercise details surface", () => {
  it("exposes a visible details action and defaults details to summary", () => {
    expect(source).toContain("Details");
    expect(source).toContain('setDetailsSection("summary")');
    expect(source).toContain(
      "aria-label={`View details for ${exercise.name}`}",
    );
  });

  it("moves guidance content out of the active card into Summary", () => {
    expect(source).not.toContain("ExerciseGuidancePanel");
    expect(source).toContain('SummaryBlock title="How to perform"');
    expect(source).toContain('SummaryBlock title="Safety and modifications"');
    expect(source).toContain("list-disc");
    expect(source).toContain(
      "No reviewed guidance is available for this exercise yet.",
    );
  });

  it("keeps a deliberate empty history state", () => {
    expect(source).toContain("No completed history for this exercise yet.");
  });

  it("uses real completed history and modal focus behavior instead of previous-set placeholders", () => {
    expect(source).toContain("completedHistory");
    expect(source).not.toContain("Most recent completed session");
    expect(source).toContain('event.key !== "Tab"');
    expect(source).toContain('event.key === "Escape"');
    expect(source).toContain('document.body.style.overflow = "hidden"');
  });

  it("uses reviewed demo labels and does not render video search metadata", () => {
    expect(source).toContain("Watch Demo on YouTube");
    expect(source).toContain("Watch Demo");
    expect(source).not.toContain("videoSearchQuery");
  });
});
