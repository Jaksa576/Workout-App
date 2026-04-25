import type { DashboardData, Profile, WorkoutPlan } from "@/lib/types";

export const profile: Profile = {
  id: "profile-1",
  goal: "Move better, build strength, and stay consistent without aggravating pain.",
  injuries: ["Monitor right shoulder discomfort during overhead work"],
  equipment: ["Adjustable dumbbells", "Bench", "Bands", "Bodyweight"],
  daysPerWeek: 4,
  sessionMinutes: 50,
  onboardingCompletedAt: "2026-04-12T00:00:00.000Z"
};

const foundationPhase = {
  id: "phase-1",
  phaseNumber: 1,
  goal: "Rebuild movement quality and repeatable strength patterns.",
  advanceCriteria:
    "Complete all planned sessions for 2 weeks with no pain and rate effort as appropriate or easier.",
  deloadCriteria:
    "Two pain flags in one week or repeated too hard ratings on the same movement pattern.",
  advancementPreset: "clean_sessions_in_window" as const,
  advancementSettings: { sessions: 4, weeks: 2 },
  deloadPreset: "pain_flags_in_window" as const,
  deloadSettings: { painFlags: 2, days: 7 }
};

const buildPhase = {
  id: "phase-2",
  phaseNumber: 2,
  goal: "Increase load gradually while preserving technique and recovery.",
  advanceCriteria:
    "Hit top rep targets for 2 consecutive weeks without pain or technique breakdown.",
  deloadCriteria:
    "Pain flag, missed reps across 2 sessions, or persistent recovery issues.",
  advancementPreset: "clean_sessions_streak" as const,
  advancementSettings: { sessions: 4 },
  deloadPreset: "too_hard_streak" as const,
  deloadSettings: { sessions: 2 }
};

export const workoutPlans: WorkoutPlan[] = [
  {
    id: "plan-1",
    name: "Base Strength Reset",
    description:
      "A beginner-friendly plan for returning to structured training, built around simple movement patterns and clear progression rules.",
    isActive: true,
    scheduleSummary: "Mon / Tue / Thu / Sat with 1 active recovery day",
    weeklySchedule: ["mon", "tue", "thu", "sat"],
    completedAt: null,
    archivedAt: null,
    currentPhase: foundationPhase,
    phases: [foundationPhase, buildPhase],
    workouts: [
      {
        id: "workout-1",
        phaseId: "phase-1",
        name: "Lower Body + Core",
        focus: "Strength foundation",
        summary:
          "Move with control first, then add reps or light load only when the work feels stable and pain-free.",
        readiness: "Ready",
        scheduledDays: ["mon", "thu"],
        exercises: [
          {
            id: "exercise-1",
            name: "Goblet squat",
            sets: 3,
            reps: "8-10 reps",
            rest: "90 sec",
            coachingNote:
              "Keep ribs stacked over hips and stop the set if depth changes your balance.",
            videoUrl: "https://www.youtube.com/watch?v=MeIiIdhvXT4"
          },
          {
            id: "exercise-2",
            name: "Romanian deadlift",
            sets: 3,
            reps: "8 reps",
            rest: "90 sec",
            coachingNote:
              "Push hips back, keep dumbbells close, and keep the hamstrings loaded without lumbar rounding.",
            videoUrl: "https://www.youtube.com/watch?v=2SHsk9AzdjA"
          },
          {
            id: "exercise-3",
            name: "Split squat",
            sets: 2,
            reps: "8 reps / side",
            rest: "75 sec",
            coachingNote:
              "Own the bottom position and use support if balance becomes the limiting factor."
          },
          {
            id: "exercise-4",
            name: "Dead bug",
            sets: 3,
            reps: "6 reps / side",
            rest: "45 sec",
            coachingNote:
              "Flatten the low back into the floor and slow the exhale to lock in trunk position."
          }
        ]
      },
      {
        id: "workout-2",
        phaseId: "phase-1",
        name: "Upper Body + Pull",
        focus: "Shoulder-friendly volume",
        summary:
          "Build pressing and pulling capacity while watching pain and keeping the shoulder moving cleanly.",
        readiness: "Monitor",
        scheduledDays: ["tue"],
        exercises: [
          {
            id: "exercise-5",
            name: "Incline push-up",
            sets: 3,
            reps: "8-12 reps",
            rest: "75 sec",
            coachingNote:
              "Keep elbows at a comfortable angle and adjust the incline to keep all reps smooth."
          },
          {
            id: "exercise-6",
            name: "One-arm dumbbell row",
            sets: 3,
            reps: "10 reps / side",
            rest: "75 sec",
            coachingNote:
              "Drive the elbow back toward the hip and avoid shrugging the shoulder at the top."
          }
        ]
      }
    ]
  }
];

export const dashboardData: DashboardData = {
  activePlan: workoutPlans[0],
  todayWorkout: workoutPlans[0].workouts[0],
  phaseProgress: {
    decision: "repeat",
    recommendation: "Keep going with this phase",
    reason: "3 of 4 clean sessions complete.",
    canAdvance: false,
    canComplete: false,
    criteriaMet: false,
    currentPhaseId: "phase-1",
    nextPhaseId: "phase-2",
    previousPhaseId: null,
    cleanSessions: 3,
    requiredCleanSessions: 4,
    painFlags: 0,
    completionPercent: 75
  },
  weekPreview: [
    {
      key: "2026-04-20",
      weekday: "mon",
      weekdayLabel: "Mon",
      dateLabel: "Apr 20",
      isToday: true,
      workoutId: "workout-1",
      workoutName: "Lower Body + Core",
      detail: "Strength foundation",
      tone: "workout"
    }
  ],
  activitySummary: {
    completedThisWeek: 3,
    streakLabel: "3 workouts logged",
    days: [
      {
        key: "2026-04-20",
        weekdayLabel: "Mon",
        isToday: true,
        completed: true,
        painFlagged: false
      }
    ]
  },
  progressionPrompt: {
    tone: "steady",
    eyebrow: "Keep the streak going",
    title: "Complete 1 more workout before progressing.",
    detail: "3 of 4 clean sessions logged for Phase 1.",
    actionLabel: null,
    actionHref: null
  },
  painTrend: {
    label: "Stable",
    detail: "No recent pain flags.",
    painFlags: 0,
    tone: "stable"
  },
  metrics: [
    {
      label: "Weekly streak",
      value: "3 workouts",
      detail: "You are on track for a full week if you complete today and Saturday."
    },
    {
      label: "Pain status",
      value: "Stable",
      detail: "No pain flags in the last 5 logged sessions."
    },
    {
      label: "Next decision",
      value: "Repeat phase",
      detail: "You need one more solid week before phase 2 becomes available."
    }
  ]
};
