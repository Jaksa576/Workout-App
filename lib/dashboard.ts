import { formatPhaseLabel } from "@/lib/plan-labels";
import type {
  DashboardActivitySummary,
  DashboardMetric,
  DashboardPainTrend,
  DashboardProgressionPrompt,
  DashboardWeekPreviewItem,
  PhaseProgressSummary,
  Weekday,
  WorkoutPlan,
  WorkoutSession,
  WorkoutTemplate
} from "@/lib/types";

const weekdayOrder: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const weekdayLabels: Record<Weekday, string> = {
  sun: "Sun",
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat"
};

function startOfUtcDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setUTCHours(0, 0, 0, 0);
  return nextDate;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addUtcDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function getWeekday(date: Date) {
  return weekdayOrder[date.getUTCDay()];
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  });
}

function getActivePhaseWorkouts(plan: WorkoutPlan | null) {
  if (!plan) {
    return [];
  }

  return plan.workouts.filter((workout) => workout.phaseId === plan.currentPhase.id);
}

function summarizeWorkoutNames(workouts: WorkoutTemplate[]) {
  if (workouts.length === 0) {
    return null;
  }

  if (workouts.length === 1) {
    return workouts[0].name;
  }

  return `${workouts[0].name} + ${workouts.length - 1} more`;
}

export function buildWeeklyWorkoutPreview(
  plan: WorkoutPlan | null,
  today = new Date()
): DashboardWeekPreviewItem[] {
  const start = startOfUtcDay(today);
  const activePhaseWorkouts = getActivePhaseWorkouts(plan);
  const hasWorkoutSchedule = activePhaseWorkouts.some(
    (workout) => workout.scheduledDays.length > 0
  );
  const planSchedule = plan?.weeklySchedule ?? [];

  return Array.from({ length: 7 }, (_, index) => {
    const date = addUtcDays(start, index);
    const weekday = getWeekday(date);
    const scheduledWorkouts = hasWorkoutSchedule
      ? activePhaseWorkouts.filter((workout) => workout.scheduledDays.includes(weekday))
      : [];
    const scheduledName = summarizeWorkoutNames(scheduledWorkouts);
    const isPlanWorkoutDay = !hasWorkoutSchedule && planSchedule.includes(weekday);

    if (scheduledName) {
      return {
        key: toDateKey(date),
        weekday,
        weekdayLabel: weekdayLabels[weekday],
        dateLabel: formatDateLabel(date),
        isToday: index === 0,
        workoutId: scheduledWorkouts[0].id,
        workoutName: scheduledName,
        detail: scheduledWorkouts[0].focus,
        tone: "workout"
      };
    }

    if (isPlanWorkoutDay) {
      return {
        key: toDateKey(date),
        weekday,
        weekdayLabel: weekdayLabels[weekday],
        dateLabel: formatDateLabel(date),
        isToday: index === 0,
        workoutId: activePhaseWorkouts[0]?.id ?? null,
        workoutName: "Workout day",
        detail: "Choose a workout from this phase.",
        tone: "fallback"
      };
    }

    return {
      key: toDateKey(date),
      weekday,
      weekdayLabel: weekdayLabels[weekday],
      dateLabel: formatDateLabel(date),
      isToday: index === 0,
      workoutId: null,
      workoutName: "Open day",
      detail: plan ? "No workout scheduled." : "Create a plan to fill the week.",
      tone: "rest"
    };
  });
}

export function buildDashboardActivitySummary(
  sessions: WorkoutSession[],
  today = new Date()
): DashboardActivitySummary {
  const start = startOfUtcDay(today);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addUtcDays(start, index - 6);
    const key = toDateKey(date);
    const sessionsForDay = sessions.filter((session) => session.completedOn === key);

    return {
      key,
      weekdayLabel: weekdayLabels[getWeekday(date)],
      isToday: index === 6,
      completed: sessionsForDay.some((session) => session.completed),
      painFlagged: sessionsForDay.some((session) => session.painOccurred)
    };
  });
  const completedThisWeek = days.filter((day) => day.completed).length;

  return {
    completedThisWeek,
    days,
    streakLabel:
      completedThisWeek === 1
        ? "1 workout logged"
        : `${completedThisWeek} workouts logged`
  };
}

export function buildDashboardProgressionPrompt(
  plan: WorkoutPlan | null,
  progress: PhaseProgressSummary | null
): DashboardProgressionPrompt | null {
  if (!plan || !progress) {
    return null;
  }

  if (progress.decision === "deload" || progress.decision === "review") {
    return {
      tone: "caution",
      eyebrow: "Take it easier today",
      title: progress.decision === "deload" ? "Repeat this phase" : "Review before progressing",
      detail: progress.reason,
      actionLabel: "Review progress",
      actionHref: `/plans/${plan.id}`
    };
  }

  if (progress.canAdvance) {
    return {
      tone: "ready",
      eyebrow: "Ready to progress",
      title: "You're ready to progress.",
      detail: "Review the next phase before moving forward.",
      actionLabel: "Review & progress",
      actionHref: `/plans/${plan.id}`
    };
  }

  if (progress.canComplete) {
    return {
      tone: "complete",
      eyebrow: "Phase complete",
      title: "Ready to complete this plan.",
      detail: "Review your progress before marking the plan complete.",
      actionLabel: "Review & complete",
      actionHref: `/plans/${plan.id}`
    };
  }

  const remaining = Math.max(
    0,
    progress.requiredCleanSessions - progress.cleanSessions
  );
  const shouldUseCautionCopy =
    progress.decision === "repeat" &&
    (progress.reason.toLowerCase().includes("too hard") ||
      progress.recommendation.toLowerCase().includes("tough"));

  return {
    tone: progress.decision === "repeat" && !shouldUseCautionCopy ? "steady" : "caution",
    eyebrow: shouldUseCautionCopy
      ? "Take it easier today"
      : progress.decision === "repeat"
        ? "Keep the streak going"
        : "Up next",
    title:
      shouldUseCautionCopy
        ? "Repeat this phase before progressing."
        : remaining === 1
        ? "Complete 1 more workout before progressing."
        : `Complete ${remaining} more workouts before progressing.`,
    detail:
      progress.decision === "repeat"
        ? `${progress.cleanSessions} of ${progress.requiredCleanSessions} clean sessions logged for ${formatPhaseLabel(plan.currentPhase.phaseNumber)}.`
        : progress.reason,
    actionLabel: null,
    actionHref: null
  };
}

export function buildDashboardPainTrend(
  plan: WorkoutPlan | null,
  sessions: WorkoutSession[],
  progress: PhaseProgressSummary | null
): DashboardPainTrend | null {
  const hasRecoveryContext =
    plan?.goalType === "recovery" ||
    plan?.progressionMode === "symptom_based" ||
    plan?.progressionMode === "hybrid";
  const painFlags = progress?.painFlags ?? sessions.filter((session) => session.painOccurred).length;

  if (!hasRecoveryContext && painFlags === 0) {
    return null;
  }

  if (sessions.length === 0 && painFlags === 0) {
    return null;
  }

  return {
    label: painFlags === 0 ? "Stable" : painFlags === 1 ? "1 flag" : `${painFlags} flags`,
    detail:
      painFlags === 0
        ? "No recent pain flags."
        : "Recent pain flags are a reason to stay cautious.",
    painFlags,
    tone: painFlags === 0 ? "stable" : "caution"
  };
}

export function buildDashboardMetrics(
  plan: WorkoutPlan | null,
  activity: DashboardActivitySummary,
  progress: PhaseProgressSummary | null,
  painTrend: DashboardPainTrend | null
): DashboardMetric[] {
  if (!plan || !progress) {
    return [
      {
        label: "This week",
        value: "No plan yet",
        detail: "Create a plan to start tracking workouts."
      }
    ];
  }

  return [
    {
      label: "This week",
      value: activity.streakLabel,
      detail: "Logged workouts over the last 7 days."
    },
    {
      label: "Phase progress",
      value: `${progress.completionPercent}%`,
      detail: `${progress.cleanSessions} of ${progress.requiredCleanSessions} clean sessions.`
    },
    {
      label: "Symptom trend",
      value: painTrend?.label ?? "No flags",
      detail: painTrend?.detail ?? "No recent pain flags."
    }
  ];
}
