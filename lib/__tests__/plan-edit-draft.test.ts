import { describe, expect, it } from "vitest";
import { savedPlanToStructuredPlanInput } from "@/lib/plan-edit-draft";
import type { WorkoutPlan } from "@/lib/types";

const plan: WorkoutPlan = {
  id: "plan-1",
  name: "Strength Plan",
  description: "A saved plan.",
  goalType: "strength",
  progressionMode: "performance_based",
  creationSource: "guided_template",
  setupContext: {
    goalType: "strength",
    objectiveSummary: "Build strength without losing consistency.",
    daysPerWeek: 3,
    sessionMinutes: 45,
    weeklySchedule: ["mon", "wed", "fri"],
    preferredSplit: "full_body",
    focusAreas: ["legs"],
    currentConstraints: ["Keep shoulders calm"],
    progressionModeOverride: "performance_based"
  },
  isActive: true,
  scheduleSummary: "Mon / Wed / Fri",
  weeklySchedule: ["mon", "wed", "fri"],
  completedAt: null,
  archivedAt: null,
  currentPhase: {
    id: "phase-1",
    phaseNumber: 1,
    goal: "Build strength.",
    advanceCriteria: "Complete clean sessions.",
    deloadCriteria: "Review when pain increases.",
    advancementPreset: "clean_sessions_in_window",
    advancementSettings: { sessions: 4, weeks: 2 },
    deloadPreset: "pain_flags_in_window",
    deloadSettings: { painFlags: 2, days: 7 }
  },
  phases: [
    {
      id: "phase-1",
      phaseNumber: 1,
      goal: "Build strength.",
      advanceCriteria: "Complete clean sessions.",
      deloadCriteria: "Review when pain increases.",
      advancementPreset: "clean_sessions_in_window",
      advancementSettings: { sessions: 4, weeks: 2 },
      deloadPreset: "pain_flags_in_window",
      deloadSettings: { painFlags: 2, days: 7 }
    },
    {
      id: "phase-2",
      phaseNumber: 2,
      goal: "Progress strength.",
      advanceCriteria: "Hit clean volume.",
      deloadCriteria: "Review when pain increases.",
      advancementPreset: "clean_sessions_streak",
      advancementSettings: { sessions: 3 },
      deloadPreset: "too_hard_streak",
      deloadSettings: { sessions: 2 }
    }
  ],
  workouts: [
    {
      id: "workout-1",
      phaseId: "phase-1",
      name: "Workout A",
      focus: "Strength",
      summary: "Main strength work.",
      readiness: "Ready",
      scheduledDays: ["mon"],
      exercises: [
        {
          id: "exercise-1",
          name: "Goblet squat",
          sets: 3,
          reps: "8",
          rest: "90 sec",
          coachingNote: "Move with control.",
          sourceExerciseId: "goblet-squat"
        },
        {
          id: "exercise-2",
          name: "Row",
          sets: 3,
          reps: "10",
          rest: "60 sec",
          coachingNote: "Stay smooth."
        }
      ]
    },
    {
      id: "workout-2",
      phaseId: "phase-2",
      name: "Workout B",
      focus: "Progression",
      summary: "Progress the plan.",
      readiness: "Ready",
      scheduledDays: ["wed"],
      exercises: [
        {
          id: "exercise-3",
          name: "Deadlift",
          sets: 4,
          reps: "5",
          rest: "120 sec",
          coachingNote: "Brace first.",
          sourceExerciseId: "deadlift"
        }
      ]
    }
  ]
};

describe("saved plan edit draft", () => {
  it("maps a saved plan into a structured editable draft", () => {
    const result = savedPlanToStructuredPlanInput(plan);

    expect(result).toEqual({
      version: "structured-v1",
      name: "Strength Plan",
      description: "A saved plan.",
      goalType: "strength",
      progressionMode: "performance_based",
      creationSource: "guided_template",
      weeklySchedule: ["mon", "wed", "fri"],
      phases: [
        {
          goal: "Build strength.",
          advancementPreset: "clean_sessions_in_window",
          advancementSettings: { sessions: 4, weeks: 2 },
          deloadPreset: "pain_flags_in_window",
          deloadSettings: { painFlags: 2, days: 7 },
          workouts: [
            {
              name: "Workout A",
              focus: "Strength",
              summary: "Main strength work.",
              scheduledDays: ["mon"],
              exercises: [
                {
                  name: "Goblet squat",
                  sets: 3,
                  reps: "8",
                  rest: "90 sec",
                  coachingNote: "Move with control.",
                  videoUrl: undefined,
                  sourceExerciseId: "goblet-squat"
                },
                {
                  name: "Row",
                  sets: 3,
                  reps: "10",
                  rest: "60 sec",
                  coachingNote: "Stay smooth.",
                  videoUrl: undefined,
                  sourceExerciseId: null
                }
              ]
            }
          ]
        },
        {
          goal: "Progress strength.",
          advancementPreset: "clean_sessions_streak",
          advancementSettings: { sessions: 3 },
          deloadPreset: "too_hard_streak",
          deloadSettings: { sessions: 2 },
          workouts: [
            {
              name: "Workout B",
              focus: "Progression",
              summary: "Progress the plan.",
              scheduledDays: ["wed"],
              exercises: [
                {
                  name: "Deadlift",
                  sets: 4,
                  reps: "5",
                  rest: "120 sec",
                  coachingNote: "Brace first.",
                  videoUrl: undefined,
                  sourceExerciseId: "deadlift"
                }
              ]
            }
          ]
        }
      ]
    });
  });
});
