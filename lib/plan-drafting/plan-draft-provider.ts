import { createGuidedStarterPlan } from "@/lib/starter-plan-generator";
import type {
  PlanDraftInput,
  PlanDraftResult,
  PlanDraftStrategy,
  ProgressionMode,
  StructuredPlanInput
} from "@/lib/types";
import { selectDefaultProgressionMode } from "@/lib/progression-mode";

export type PlanDraftProvider = {
  strategy: PlanDraftStrategy;
  isConfigured: () => boolean;
  createDraft: (input: PlanDraftInput) => Promise<PlanDraftResult>;
};

function withDraftMetadata({
  input,
  plan
}: {
  input: PlanDraftInput;
  plan: StructuredPlanInput;
}): StructuredPlanInput {
  const goalType = input.setup.goalType;
  const hasPlanConstraints = input.setup.currentConstraints.length > 0;
  const hasProfileConstraints = Boolean(
    input.profile?.limitationsDetail?.trim() ||
      input.profile?.injuries.some((injury) => injury !== "None right now")
  );
  const defaultProgressionMode =
    (goalType === "strength" || goalType === "hypertrophy") &&
    (hasPlanConstraints || hasProfileConstraints)
      ? "hybrid"
      : selectDefaultProgressionMode(goalType);
  const progressionMode: ProgressionMode | null =
    input.setup.progressionModeOverride ?? defaultProgressionMode;

  return {
    ...plan,
    goalType,
    progressionMode,
    creationSource: "guided_template"
  };
}

function getTemplateDraftProvider(): PlanDraftProvider {
  return {
    strategy: "template",
    isConfigured: () => true,
    async createDraft(input) {
      return {
        plan: withDraftMetadata({
          input,
          plan: createGuidedStarterPlan(input)
        }),
        source: "guided_template",
        strategy: "template"
      };
    }
  };
}

function getLlmDraftProvider(): PlanDraftProvider {
  return {
    strategy: "llm",
    isConfigured: () => false,
    async createDraft() {
      throw new Error("LLM draft unavailable. Use guided starter plan instead.");
    }
  };
}

export function getPlanDraftProvider(
  strategy: PlanDraftStrategy = "llm"
): PlanDraftProvider {
  return strategy === "template" ? getTemplateDraftProvider() : getLlmDraftProvider();
}
