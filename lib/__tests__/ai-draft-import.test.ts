import { describe, expect, it } from "vitest";
import {
  buildAiPlanPrompt,
  buildAiPlanPromptInput,
  convertAiImportToStructuredPlan,
  parseAiPlanImport
} from "@/lib/plan-drafting/ai-draft-import";
import type { AiPlanPromptInput, PlanSetupInput, Profile } from "@/lib/types";

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

function makeFencedImportedMarkdown() {
  return `Here is the transfer block:

\`\`\`adaptive-training-plan
${makeImportedMarkdown()}
\`\`\``;
}

function makeZeroRestImportedMarkdown() {
  return `PLAN
title: Running Builder
goal_track: running
progression_mode: adherence_based
days_per_week: 3
session_duration_min: 45
summary: Simple running-supportive structure

PHASE 1
name: Build
duration_weeks: 4
objective: Build repeatable running tolerance

WORKOUT
name: Run Intervals
focus: Easy intervals

EXERCISE
name: Run/walk intervals
sets: 1
reps: 20 min
rest_seconds: 0
notes: Keep the pace conversational`;
}

describe("ai draft import", () => {
  it("generates deterministic prompts with blank optional fields", () => {
    const prompt = buildAiPlanPrompt(basePromptInput);

    expect(prompt).not.toContain("Match your coaching voice to the user's goal:");
    expect(prompt).toContain(
      "Use a practical coaching voice focused on progressive training structure for this strength plan."
    );
    expect(prompt).toContain("goal_track: strength");
    expect(prompt).toContain("assigned_days: mon, wed, fri");
    expect(prompt).toContain("progression_mode: ");
    expect(prompt).toContain("training_environment: ");
    expect(prompt).toContain("preferences: ");
    expect(prompt).toContain("dislikes: ");
    expect(prompt).toContain("sports_interests: ");
    expect(prompt).toContain("freeform_context: ");
    expect(prompt).toContain("Return ONLY one fenced markdown transfer block.");
    expect(prompt).toContain("```adaptive-training-plan");
    expect(prompt).toContain("Return the plan in exactly this fenced transfer block:");
  });

  it.each([
    {
      goalTrack: "recovery" as const,
      ownRole: "Use a rehab-informed, symptom-aware planning voice for this recovery plan.",
      ownGuidance:
        "Build a progression-based recovery plan with multiple phases when the training goal calls for progression over time.",
      excluded: [
        "Use a practical coaching voice focused on progressive training structure for this strength plan.",
        "Use a practical coaching voice focused on progressive training structure for this hypertrophy plan.",
        "Use a concise coaching voice matched to running without adding extra format variation.",
        "Emphasize repeatable volume and muscle-group coverage.",
        "Keep running sessions simple and structured."
      ]
    },
    {
      goalTrack: "strength" as const,
      ownRole:
        "Use a practical coaching voice focused on progressive training structure for this strength plan.",
      ownGuidance: "Organize training around a few clear movement priorities.",
      excluded: [
        "Use a rehab-informed, symptom-aware planning voice for this recovery plan.",
        "Use a practical coaching voice focused on progressive training structure for this hypertrophy plan.",
        "Use a concise coaching voice matched to running without adding extra format variation.",
        "Build a progression-based recovery plan with multiple phases when the training goal calls for progression over time.",
        "Emphasize repeatable volume and muscle-group coverage."
      ]
    },
    {
      goalTrack: "running" as const,
      ownRole:
        "Use a concise coaching voice matched to running without adding extra format variation.",
      ownGuidance: "Keep running sessions simple and structured.",
      excluded: [
        "Use a rehab-informed, symptom-aware planning voice for this recovery plan.",
        "Use a practical coaching voice focused on progressive training structure for this strength plan.",
        "Use a practical coaching voice focused on progressive training structure for this hypertrophy plan.",
        "Build a progression-based recovery plan with multiple phases when the training goal calls for progression over time.",
        "Organize training around a few clear movement priorities."
      ]
    }
  ])(
    "includes only selected-goal prompt guidance for $goalTrack",
    ({ goalTrack, ownRole, ownGuidance, excluded }) => {
      const prompt = buildAiPlanPrompt({
        ...basePromptInput,
        goalTrack
      });

      expect(prompt).not.toContain("Match your coaching voice to the user's goal:");
      expect(prompt).toContain(ownRole);
      expect(prompt).toContain(ownGuidance);

      for (const disallowedText of excluded) {
        expect(prompt).not.toContain(disallowedText);
      }
    }
  );

  it("deduplicates limitations when profile defaults are already seeded into setup context", () => {
    const profile: Profile = {
      id: "profile-1",
      goal: "Get back to training",
      injuries: ["Knee sensitivity"],
      limitationsDetail: "No jumping right now",
      equipment: ["Bodyweight"],
      daysPerWeek: 3,
      sessionMinutes: 45,
      onboardingCompletedAt: "2026-04-24T00:00:00.000Z"
    };
    const setup: PlanSetupInput = {
      goalType: "recovery",
      objectiveSummary: "",
      daysPerWeek: 3,
      sessionMinutes: 45,
      weeklySchedule: ["mon", "wed", "fri"],
      preferredSplit: "mobility_strength",
      focusAreas: [],
      currentConstraints: ["Knee sensitivity", "No jumping right now"],
      progressionModeOverride: null
    };

    const promptInput = buildAiPlanPromptInput({ profile, setup });

    expect(promptInput.limitations).toBe("Knee sensitivity, No jumping right now");
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

  it("parses a valid fenced transfer block without relaxing the plan contract", () => {
    const result = parseAiPlanImport(makeFencedImportedMarkdown());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data.title).toBe("Strength Builder");
    expect(result.data.phases).toHaveLength(2);
    expect(result.data.phases[0].workouts[0].exercises[0].name).toBe("Goblet Squat");
  });

  it("rejects invalid content inside a fenced transfer block", () => {
    const input = `\`\`\`adaptive-training-plan
PLAN
title: Strength Builder
goal_track: strength
days_per_week: 3
progression_mode: performance_based
session_duration_min: 45
summary: Three-day strength split
\`\`\``;

    const result = parseAiPlanImport(input);

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.errors[0]).toMatch(/out-of-order field `days_per_week`/);
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

  it("accepts rest_seconds set to 0", () => {
    const result = parseAiPlanImport(makeZeroRestImportedMarkdown());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data.phases[0].workouts[0].exercises[0].restSeconds).toBe(0);
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
    expect(plan.phases[0].workouts[0].scheduledDays).toEqual(["tue"]);
    expect(plan.phases[0].workouts[1].scheduledDays).toEqual(["thu"]);
    expect(plan.phases[1].workouts[0].scheduledDays).toEqual(["tue"]);
    expect(plan.phases[1].workouts[0].exercises[0].rest).toBe("");
  });

  it("preserves zero-second rest when converting imported plans", () => {
    const parsed = parseAiPlanImport(makeZeroRestImportedMarkdown());

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    const plan = convertAiImportToStructuredPlan({
      importedPlan: parsed.data,
      promptInput: {
        ...basePromptInput,
        goalTrack: "running"
      }
    });

    expect(plan.phases[0].workouts[0].exercises[0].rest).toBe("0 sec");
    expect(plan.phases[0].workouts[0].scheduledDays).toEqual(["mon"]);
  });
});
