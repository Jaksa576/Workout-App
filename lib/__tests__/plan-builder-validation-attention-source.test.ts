import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("components/plan-builder-form.tsx", "utf8");

describe("manual plan builder validation attention wiring", () => {
  it("positions and focuses only a rendered invalid-submit summary through the shared contract", () => {
    expect(source).toContain("directNavigationAttention(validationSummaryRef.current, { focus: true })");
    expect(source).toContain('tabIndex={-1}');
    expect(source).toContain('scroll-mt-6');
    expect(source).toContain('id="plan-builder-validation-summary"');
    expect(source).toContain('if (nextValidationItems.length > 0)');
  });

  it("does not introduce input focus or smooth scrolling and keeps valid saves on the existing request path", () => {
    expect(source).not.toContain("validationSummaryRef.current.focus");
    expect(source).not.toContain('behavior: "smooth"');
    expect(source).toContain('const response = await fetch(endpoint');
  });

  it("leaves the existing generated-exercise inline review alert in place", () => {
    expect(source).toContain('generatedReview?.status === "needs_review"');
    expect(source).toContain('role="alert"');
    expect(source).toContain("generated-review-blocking");
  });
});
