import { describe, expect, it } from "vitest";
import {
  buildAiPlanPrompt,
  convertAiImportToStructuredPlan,
  parseAiPlanImport
} from "@/lib/plan-drafting/ai-draft-import";
import type { AiPlanPromptInput } from "@/lib/types";

const basePromptInput: AiPlanPromptInput = {
  goalTrack: "strength",
  daysPerWeek: 3,
  sessionDurationMin: 45,
  weeklySchedule: ["mon", "wed", "fri"],
  equipmentAccess: "Bodyweight, Dumbbells",
  experienceLevel: "intermediate",
  limitations: "mild shoulder irritation",
  primaryFocus: "build strength while keeping overhead work comfortable",
  progressionMode: null,
  trainingEnvironment: null,
  preferences: [],
  dislikes: [],
  sportsInterests: [],
  freeformContext: ""
};

function makeImportedMarkdown() {
  return `PLAN
title: Strength Builder
goal_track: strength
progression_mode: performance_based
days_per_week: 3
session_duration_min: 45
summary: Three-day strength split

PHASE 1
name: Foundation
duration_weeks: 4
objective: Build confidence with the main lifts

WORKOUT
name: Lower A
focus: Squat and hinge emphasis

EXERCISE
name: Goblet Squat
sets: 3
reps: 8
rest_seconds: 90
notes: Controlled tempo

EXERCISE
name: Romanian Deadlift
sets: 3
reps: 8
rest_seconds: 90
notes: Stop with 2 reps in reserve

WORKOUT
name: Upper A
focus: Horizontal push and pull

EXERCISE
name: Dumbbell Bench Press
sets: 3
reps: 8
rest_seconds: 90
notes: Keep shoulders packed

PHASE 2
name: Build
duration_weeks: 4
objective: Add load gradually while keeping technique clean

WORKOUT
name: Full Body B
focus: Repeatable full-body strength

EXERCISE
name: Split Squat
sets: 3
reps: 10
rest_seconds:
notes:

EXERCISE
name: One-Arm Row
sets: 3
reps: 10
rest_seconds: 60
notes: Smooth reps`;
}

describe("ai draft import", () => {
  it("generates deterministic prompts with blank optional fields", () => {
    const prompt = buildAiPlanPrompt(basePromptInput);

    expect(prompt).toContain("goal_track: strength");
    expect(prompt).toContain("progression_mode: ");
    expect(prompt).toContain("training_environment: ");
    expect(prompt).toContain("preferences: ");
    expect(prompt).toContain("dislikes: ");
    expect(prompt).toContain("sports_interests: ");
    expect(prompt).toContain("freeform_context: ");
    expect(prompt).toContain("Return the plan in exactly this format:");
  });

  it("parses a valid multi-phase import with multiple workouts per phase", () => {
    const result = parseAiPlanImport(makeImportedMarkdown());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data.goalTrack).toBe("strength");
    expect(result.data.phases).toHaveLength(2);
    expect(result.data.phases[0].workouts).toHaveLength(2);
    expect(result.data.phases[1].workouts[0].exercises).toHaveLength(2);
    expect(result.data.phases[1].workouts[0].exercises[0].restSeconds).toBeNull();
  });

  it("rejects duplicate fields within a section", () => {
    const input = `PLAN
title: Strength Builder
title: Duplicate
goal_track: strength
progression_mode:
days_per_week: 3
session_duration_min: 45
summary: Three-day strength split

PHASE 1
name: Foundation
duration_weeks: 4
objective: Build confidence

WORKOUT
name: Lower A
focus: Squat emphasis

EXERCISE
name: Goblet Squat
sets: 3
reps: 8
rest_seconds: 90
notes: Controlled tempo`;

    const result = parseAiPlanImport(input);

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.errors[0]).toMatch(/duplicate field `title`|out-of-order field `title`/);
  });

  it("normalizes line endings and trailing whitespace without relaxing the contract", () => {
    const input = `\r\n  PLAN  \r\n title: Strength Builder   \r\n goal_track: strength \r\n progression_mode:  \r\n days_per_week: 3   \r\n session_duration_min: 45 \r\n summary: Three-day strength split  \r\n \r\n PHASE 1 \r\n name: Foundation  \r\n duration_weeks: 4 \r\n objective: Build confidence \r\n \r\n WORKOUT \r\n name: Lower A \r\n focus: Squat emphasis \r\n \r\n EXERCISE \r\n name: Goblet Squat \r\n sets: 3 \r\n reps: 8 \r\n rest_seconds: 90 \r\n notes: Controlled tempo \r\n`;
    const result = parseAiPlanImport(input);

    expect(result.ok).toBe(true);
  });

  it("converts imported plans into the existing structured plan shape", () => {
    const parsed = parseAiPlanImport(makeImportedMarkdown());

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    const plan = convertAiImportToStructuredPlan({
      importedPlan: parsed.data,
      promptInput: {
        ...basePromptInput,
        weeklySchedule: ["tue", "thu", "sat"]
      }
    });

    expect(plan.creationSource).toBe("ai_import");
    expect(plan.weeklySchedule).toEqual(["tue", "thu", "sat"]);
    expect(plan.goalType).toBe("strength");
    expect(plan.progressionMode).toBe("performance_based");
    expect(plan.phases[0].goal).toBe("Foundation (4 weeks): Build confidence with the main lifts");
    expect(plan.phases[0].workouts[0].summary).toBe("Focus on Squat and hinge emphasis.");
    expect(plan.phases[1].workouts[0].exercises[0].rest).toBe("");
  });
});
