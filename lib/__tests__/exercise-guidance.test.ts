import { describe, expect, it } from "vitest";
import {
  formatExerciseGuidanceNote,
  parseExerciseGuidanceNote
} from "@/lib/exercise-guidance";
import { normalizeExerciseVideoUrl } from "@/lib/validation";

describe("exercise guidance", () => {
  it("serializes and parses reviewed exercise guidance through coaching notes", () => {
    const serialized = formatExerciseGuidanceNote({
      coachingNote: "Controlled tempo.",
      guidance: {
        setup: "Hold the dumbbell at chest height.",
        executionCues: ["Keep ribs stacked", "Drive through the full foot"],
        commonMistakes: ["Knees collapsing inward"],
        modifications: ["Use a box target"],
        safetyNotes: "Stop if sharp pain changes your movement.",
        videoSearchQuery: "goblet squat form demo"
      }
    });

    expect(serialized).toContain("Setup: Hold the dumbbell at chest height.");
    expect(serialized).toContain("Cues: Keep ribs stacked; Drive through the full foot");

    const parsed = parseExerciseGuidanceNote(serialized);

    expect(parsed.coachingNote).toBe("Controlled tempo.");
    expect(parsed.guidance?.setup).toBe("Hold the dumbbell at chest height.");
    expect(parsed.guidance?.executionCues).toEqual([
      "Keep ribs stacked",
      "Drive through the full foot"
    ]);
    expect(parsed.guidance?.safetyNotes).toBe(
      "Stop if sharp pain changes your movement."
    );
  });

  it("normalizes only safe YouTube video URL formats", () => {
    expect(normalizeExerciseVideoUrl("http://youtube.com/watch?v=abc123&t=10")).toBe(
      "https://www.youtube.com/watch?v=abc123"
    );
    expect(normalizeExerciseVideoUrl("https://youtu.be/abc123?si=test")).toBe(
      "https://youtu.be/abc123"
    );
    expect(normalizeExerciseVideoUrl("https://www.youtube.com/shorts/abc123")).toBe(
      "https://www.youtube.com/shorts/abc123"
    );
    expect(normalizeExerciseVideoUrl("https://www.youtube.com/embed/abc123")).toBeNull();
    expect(normalizeExerciseVideoUrl("https://example.com/watch?v=abc123")).toBeNull();
  });
});
