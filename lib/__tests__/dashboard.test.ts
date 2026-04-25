import { describe, expect, it } from "vitest";
import {
  buildDashboardProgressionPrompt,
  buildWeeklyWorkoutPreview
} from "@/lib/dashboard";
import { calculatePhaseProgress } from "@/lib/progression";
import type { PlanPhase, WorkoutPlan, WorkoutSession } from "@/lib/types";

const phaseOne: PlanPhase = {
  id: "phase-1",
  phaseNumber: 1,
  goal: "Build a base.",
  advanceCriteria: "Complete four clean sessions.",
  deloadCriteria: "Review pain or repeated tough sessions.",
  advancementPreset: "clean_sessions_in_window",
  advancementSettings: { sessions: 4, weeks: 2 },
  deloadPreset: "pain_flags_in_window",
  deloadSettings: { painFlags: 2, days: 7 }
};

const phaseTwo: PlanPhase = {
  id: "phase-2",
  phaseNumber: 2,
  goal: "Progress the work.",
  advanceCriteria: "Complete four more clean sessions.",
  deloadCriteria: "Review pain or repeated tough sessions.",
  advancementPreset: "clean_sessions_in_window",
  advancementSettings: { sessions: 4, weeks: 2 },
  deloadPreset: "pain_flags_in_window",
  deloadSettings: { painFlags: 2, days: 7 }
};

const plan: WorkoutPlan = {
  id: "plan-1",
  name: "Base Plan",
  description: "A test plan.",
  goalType: "strength",
  progressionMode: "performance_based",
  creationSource: "guided_template",
  setupContext: null,
  isActive: true,
  scheduleSummary: "Mon / Wed / Fri",
  weeklySchedule: ["mon", "wed", "fri"],
  completedAt: null,
  archivedAt: null,
  currentPhase: phaseOne,
  phases: [phaseOne, phaseTwo],
  workouts: [
    {
      id: "workout-1",
      phaseId: "phase-1",
      name: "Lower Strength",
      focus: "Lower body",
      summary: "Squat and hinge.",
      readiness: "Ready",
      scheduledDays: ["mon", "fri"],
      exercises: []
    },
    {
      id: "workout-2",
      phaseId: "phase-1",
      name: "Upper Strength",
      focus: "Upper body",
      summary: "Push and pull.",
      readiness: "Ready",
      scheduledDays: ["wed"],
      exercises: []
    },
    {
      id: "workout-3",
      phaseId: "phase-2",
      name: "Future Workout",
      focus: "Progression",
      summary: "Later phase work.",
      readiness: "Ready",
      scheduledDays: ["tue"],
      exercises: []
    }
  ]
};

function daysAgo(days: number) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function makeSession(
  id: string,
  phaseId: string,
  overrides: Partial<WorkoutSession> = {}
): WorkoutSession {
  return {
    id,
    workoutTemplateId: phaseId === "phase-1" ? "workout-1" : "workout-3",
    workoutNameSnapshot: "Workout",
    createdAt: `${daysAgo(0)}T12:00:00.000Z`,
    completedOn: daysAgo(0),
    completed: true,
    painOccurred: false,
    perceivedDifficulty: "appropriate",
    notes: "",
    recommendation: "Keep going",
    phaseIdAtCompletion: phaseId,
    progressionDecision: null,
    progressionReason: null,
    ...overrides
  };
}

describe("dashboard display helpers", () => {
  it("does not show ready-to-progress copy from sessions outside the active phase", () => {
    const progress = calculatePhaseProgress({
      plan,
      currentPhase: plan.currentPhase,
      sessions: [
        makeSession("s-1", "phase-2"),
        makeSession("s-2", "phase-2", { completedOn: daysAgo(1) }),
        makeSession("s-3", "phase-2", { completedOn: daysAgo(2) }),
        makeSession("s-4", "phase-2", { completedOn: daysAgo(3) })
      ]
    });
    const prompt = buildDashboardProgressionPrompt(plan, progress);

    expect(progress.completionPercent).toBe(0);
    expect(prompt?.tone).toBe("steady");
    expect(prompt?.title).toBe("Complete 4 more workouts before progressing.");
    expect(prompt?.actionHref).toBeNull();
  });

  it("shows an action-oriented progression prompt when the active phase qualifies", () => {
    const progress = calculatePhaseProgress({
      plan,
      currentPhase: plan.currentPhase,
      sessions: [
        makeSession("s-1", "phase-1"),
        makeSession("s-2", "phase-1", { completedOn: daysAgo(1) }),
        makeSession("s-3", "phase-1", { completedOn: daysAgo(2) }),
        makeSession("s-4", "phase-1", { completedOn: daysAgo(3) })
      ]
    });
    const prompt = buildDashboardProgressionPrompt(plan, progress);

    expect(progress.canAdvance).toBe(true);
    expect(prompt).toMatchObject({
      tone: "ready",
      title: "You're ready to progress.",
      actionLabel: "Review & progress",
      actionHref: "/plans/plan-1"
    });
  });

  it("shows concise remaining-work copy when the phase is not complete", () => {
    const progress = calculatePhaseProgress({
      plan,
      currentPhase: plan.currentPhase,
      sessions: [
        makeSession("s-1", "phase-1"),
        makeSession("s-2", "phase-1", { completedOn: daysAgo(1) }),
        makeSession("s-3", "phase-1", { completedOn: daysAgo(2) })
      ]
    });
    const prompt = buildDashboardProgressionPrompt(plan, progress);

    expect(progress.canAdvance).toBe(false);
    expect(prompt?.title).toBe("Complete 1 more workout before progressing.");
    expect(prompt?.actionLabel).toBeNull();
  });

  it("keeps caution copy visible when recent signals say to pause", () => {
    const progress = calculatePhaseProgress({
      plan,
      currentPhase: plan.currentPhase,
      sessions: [
        makeSession("s-1", "phase-1", { painOccurred: true }),
        makeSession("s-2", "phase-1", { painOccurred: true, completedOn: daysAgo(1) })
      ]
    });
    const prompt = buildDashboardProgressionPrompt(plan, progress);

    expect(progress.decision).toBe("deload");
    expect(prompt).toMatchObject({
      tone: "caution",
      eyebrow: "Take it easier today",
      actionLabel: "Review progress"
    });
  });

  it("keeps caution copy visible after a too-hard workout", () => {
    const progress = calculatePhaseProgress({
      plan,
      currentPhase: plan.currentPhase,
      sessions: [
        makeSession("s-1", "phase-1", { perceivedDifficulty: "too_hard" })
      ]
    });
    const prompt = buildDashboardProgressionPrompt(plan, progress);

    expect(progress.decision).toBe("repeat");
    expect(prompt).toMatchObject({
      tone: "caution",
      eyebrow: "Take it easier today",
      title: "Repeat this phase before progressing."
    });
  });

  it("builds a 7-day preview from scheduled active-phase workouts", () => {
    const preview = buildWeeklyWorkoutPreview(plan, new Date("2026-04-20T12:00:00.000Z"));

    expect(preview).toHaveLength(7);
    expect(preview[0]).toMatchObject({
      weekday: "mon",
      isToday: true,
      workoutName: "Lower Strength",
      tone: "workout"
    });
    expect(preview[1]).toMatchObject({
      weekday: "tue",
      workoutName: "Open day",
      tone: "rest"
    });
    expect(preview[2]).toMatchObject({
      weekday: "wed",
      workoutName: "Upper Strength",
      tone: "workout"
    });
  });

  it("uses a safe weekly fallback when workout-specific schedules are missing", () => {
    const unscheduledPlan: WorkoutPlan = {
      ...plan,
      workouts: plan.workouts.map((workout) => ({ ...workout, scheduledDays: [] }))
    };
    const preview = buildWeeklyWorkoutPreview(
      unscheduledPlan,
      new Date("2026-04-20T12:00:00.000Z")
    );

    expect(preview[0]).toMatchObject({
      weekday: "mon",
      workoutName: "Workout day",
      detail: "Choose a workout from this phase.",
      tone: "fallback"
    });
    expect(preview[1]).toMatchObject({
      weekday: "tue",
      workoutName: "Open day",
      tone: "rest"
    });
  });
});
