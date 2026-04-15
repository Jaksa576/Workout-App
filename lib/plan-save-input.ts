import type {
  PlanSetupInput,
  StructuredPlanInput,
  StructuredPlanSaveInput
} from "@/lib/types";
import { legacyPlanToStructured } from "@/lib/plan-write";
import {
  isLegacyPlanFormInput,
  isStructuredPlanInput,
  isStructuredPlanSaveInput,
  normalizeWeekdays
} from "@/lib/validation";

type ParsedPlanSaveInput = {
  input: StructuredPlanInput;
  setupContext: PlanSetupInput | null;
};

function normalizeSetupContext(
  setupContext: StructuredPlanSaveInput["setupContext"]
): PlanSetupInput | null {
  if (!setupContext) {
    return null;
  }

  return {
    ...setupContext,
    weeklySchedule: normalizeWeekdays(setupContext.weeklySchedule)
  };
}

function normalizeStructuredPlanInput(input: StructuredPlanInput): StructuredPlanInput {
  return {
    ...input,
    weeklySchedule: normalizeWeekdays(input.weeklySchedule)
  };
}

export function parsePlanSaveInput(body: unknown): ParsedPlanSaveInput | null {
  if (isStructuredPlanSaveInput(body)) {
    return {
      input: normalizeStructuredPlanInput(body.plan),
      setupContext: normalizeSetupContext(body.setupContext)
    };
  }

  if (isStructuredPlanInput(body)) {
    return {
      input: normalizeStructuredPlanInput(body),
      setupContext: null
    };
  }

  if (isLegacyPlanFormInput(body)) {
    return {
      input: legacyPlanToStructured(body),
      setupContext: null
    };
  }

  return null;
}
