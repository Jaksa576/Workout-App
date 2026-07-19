import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

async function source(path: string) {
  return readFile(path, "utf8");
}

describe("Issue #65 plan creation integration", () => {
  it("recommends direct AI only when server configuration is operational", async () => {
    const page = await source("app/plans/new/page.tsx");
    expect(page).toContain('getAiGenerationConfiguration().status === "ready"');
    expect(page).toContain('aiGenerationOperational\n            ? "direct-ai"\n            : "guided"');
    expect(page).toContain("external AI import remain available");
  });

  it("routes successful canonical drafts and exercise states into the existing editor", async () => {
    const wizard = await source("components/plan-setup-wizard.tsx");
    expect(wizard).toContain("requestAiPlanDraft");
    expect(wizard).toContain("setDraft(applySetupMetadataToAiDraft(result.draft.plan, setup))");
    expect(wizard).toContain("setGeneratedExercises(result.draft.exercises)");
    expect(wizard).toContain("generatedExerciseReview={isDirectAi ? generatedExercises : undefined}");
    expect(wizard).toContain("AI-generated draft");
  });

  it("keeps loading accessible and every creation fallback visible", async () => {
    const wizard = await source("components/plan-setup-wizard.tsx");
    expect(wizard).toContain("getPlanCreationModeTransition");
    expect(wizard).toContain("isPlanDraftGenerationDisabled");
    expect(wizard).toContain('fetch("/api/plan-drafts"');
    expect(wizard).toContain('role="status" aria-live="polite"');
    expect(wizard).toContain("Guided Setup");
    expect(wizard).toContain("Manual Builder");
    expect(wizard).toContain("External AI Import");
    expect(wizard).toContain("AiPlanDraftWizard");
  });

  it("blocks review issues and saves explicitly through the structured plan endpoint", async () => {
    const builder = await source("components/plan-builder-form.tsx");
    expect(builder).toContain("countGeneratedReviewBlockers");
    expect(builder).toContain("disabled={saving || reviewBlockingCount > 0}");
    expect(builder).toContain("disabled={workoutHasReviewBlock}");
    expect(builder).toMatch(/return;\r?\n\s+}\r?\n\r?\n\s+setSaving\(true\)/);
    expect(builder).toContain('const endpoint = planId ? `/api/plans/${planId}` : "/api/plans"');
    expect(builder).toContain("onClick={handleSubmit}");
    expect(builder).not.toContain("/api/ai/plan-drafts");
  });

  it("keeps generation, back, and cancellation outside persistence", async () => {
    const wizard = await source("components/plan-setup-wizard.tsx");
    const client = await source("lib/ai-generation/client.ts");
    expect(client).toContain('fetcher("/api/ai/plan-drafts"');
    expect(client).not.toContain("/api/plans");
    expect(wizard).toContain("onClick={() => setStepIndex((index) => Math.max(0, index - 1))}");
    expect(wizard).not.toContain("createStructuredPlanForUser");
  });
});
