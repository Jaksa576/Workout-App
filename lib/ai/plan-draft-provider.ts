import type { OnboardingInput, StructuredPlanInput } from "@/lib/types";

export type PlanDraftProvider = {
  isConfigured: () => boolean;
  createDraft: (input: OnboardingInput) => Promise<StructuredPlanInput>;
};

export function getPlanDraftProvider(): PlanDraftProvider {
  return {
    isConfigured: () => false,
    async createDraft() {
      throw new Error("AI draft unavailable. Use guided starter plan instead.");
    }
  };
}
