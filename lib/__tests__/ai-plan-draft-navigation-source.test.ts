import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("components/ai-plan-draft-wizard.tsx", "utf8");

describe("AI plan draft wizard navigation attention", () => {
  it("uses the shared reduced-motion-aware step contract instead of raw smooth scrolling", () => {
    expect(source).toContain("directNavigationAttention(stepHeadingRef.current");
    expect(source).not.toContain('scrollIntoView({ block: "start", behavior: "smooth" })');
  });

  it("gives each rendered wizard step exactly one non-input heading attention target", () => {
    const expectedSteps = ["goal", "schedule", "context", "optional", "prompt", "import", "review"];

    expect(source).toContain(
      'type AiWizardStep = "goal" | "schedule" | "context" | "optional" | "prompt" | "import" | "review"',
    );

    for (const step of expectedSteps) {
      const renderedStep = source.match(
        new RegExp(`\\{step\\.id === "${step}" \\? \\(([\\s\\S]*?)\\n      \\) : null\\}`),
      )?.[1];

      expect(renderedStep, `${step} step should be rendered`).toBeDefined();
      expect(renderedStep?.match(/ref=\{stepHeadingRef\}/g)).toHaveLength(1);
      expect(renderedStep).toMatch(/<h2[\s\S]*?tabIndex=\{-1\}[\s\S]*?scroll-mt-6/);
    }

    expect(source).toMatch(
      /step\.id === "import"[\s\S]*?<h2[\s\S]*?ref=\{stepHeadingRef\}[\s\S]*?Paste the transfer block/,
    );
    expect(source).toMatch(
      /step\.id === "review"[\s\S]*?<h2[\s\S]*?ref=\{stepHeadingRef\}[\s\S]*?Review and edit before saving/,
    );
  });
});
