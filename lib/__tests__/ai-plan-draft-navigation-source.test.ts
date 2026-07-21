import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("components/ai-plan-draft-wizard.tsx", "utf8");

describe("AI plan draft wizard navigation attention", () => {
  it("uses the shared reduced-motion-aware step contract instead of raw smooth scrolling", () => {
    expect(source).toContain("directNavigationAttention(stepHeadingRef.current");
    expect(source).not.toContain('scrollIntoView({ block: "start", behavior: "smooth" })');
    expect(source).toContain("tabIndex={-1}");
  });
});
