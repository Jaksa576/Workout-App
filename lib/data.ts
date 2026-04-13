import { getCurrentUser } from "@/lib/auth";
import {
  type DashboardData,
  type DashboardMetric,
  type ExerciseEntry,
  type PhaseProgressSummary,
  type ProgressionDecision,
  type ProgressionSettings,
  type PlanPhase,
  type Profile,
  type Weekday,
  type WorkoutPageData,
  type WorkoutPlan,
  type WorkoutProgressSummary,
  type WorkoutSession,
  type WorkoutTemplate
} from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { calculatePhaseProgress } from "@/lib/progression";

type PlanRow = {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  schedule_summary: string;
  weekly_schedule: Weekday[] | null;
  current_phase_id: string | null;
  completed_at: string | null;
  archived_at: string | null;
};

type PhaseRow = {
  id: string;
  plan_id: string;
  phase_number: number;
  goal: string;
  advance_criteria: string;
  deload_criteria: string;
  advancement_preset: PlanPhase["advancementPreset"] | null;
  advancement_settings: ProgressionSettings | null;
  deload_preset: PlanPhase["deloadPreset"] | null;
  deload_settings: ProgressionSettings | null;
};

type WorkoutRow = {
  id: string;
  phase_id: string;
  name: string;
  focus: string;
  summary: string;
  day_order: number;
  scheduled_days: Weekday[] | null;
};

type ExerciseRow = {
  id: string;
  workout_template_id: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
  coaching_note: string;
  video_url: string | null;
  sort_order: number;
};

type SessionRow = {
  id: string;
  workout_template_id: string | null;
  workout_name_snapshot: string;
  created_at: string;
  completed_on: string;
  completed: boolean;
  pain_occurred: boolean;
  perceived_difficulty: "too_easy" | "appropriate" | "too_hard";
  notes: string;
  recommendation: string;
  phase_id_at_completion: string | null;
  progression_decision: ProgressionDecision | null;
  progression_reason: string | null;
};

const progressHistoryDays = 90;
const weekdayByIndex: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function mapPhase(row: PhaseRow): PlanPhase {
  return {
    id: row.id,
    phaseNumber: row.phase_number,
    goal: row.goal,
    advanceCriteria: row.advance_criteria,
    deloadCriteria: row.deload_criteria,
    advancementPreset: row.advancement_preset ?? "clean_sessions_in_window",
    advancementSettings: row.advancement_settings ?? { sessions: 4, weeks: 2 },
    deloadPreset: row.deload_preset ?? "pain_flags_in_window",
    deloadSettings: row.deload_settings ?? { painFlags: 2, days: 7 }
  };
}

function mapExercise(row: ExerciseRow): ExerciseEntry {
  return {
    id: row.id,
    name: row.name,
    sets: row.sets,
    reps: row.reps,
    rest: row.rest,
    coachingNote: row.coaching_note,
    videoUrl: row.video_url ?? undefined
  };
}

function deriveReadiness(session?: SessionRow) {
  if (!session) {
    return "Ready";
  }

  if (session.pain_occurred) {
    return "Review";
  }

  if (session.perceived_difficulty === "too_hard") {
    return "Monitor";
  }

  if (session.perceived_difficulty === "too_easy") {
    return "Advance soon";
  }

  return "Ready";
}

function mapSession(row: SessionRow): WorkoutSession {
  return {
    id: row.id,
    workoutTemplateId: row.workout_template_id,
    workoutNameSnapshot: row.workout_name_snapshot,
    createdAt: row.created_at,
    completedOn: row.completed_on,
    completed: row.completed,
    painOccurred: row.pain_occurred,
    perceivedDifficulty: row.perceived_difficulty,
    notes: row.notes,
    recommendation: row.recommendation,
    phaseIdAtCompletion: row.phase_id_at_completion,
    progressionDecision: row.progression_decision,
    progressionReason: row.progression_reason
  };
}

function sortSessionsByLatest(a: SessionRow, b: SessionRow) {
  const dateComparison = b.completed_on.localeCompare(a.completed_on);

  if (dateComparison !== 0) {
    return dateComparison;
  }

  return b.created_at.localeCompare(a.created_at);
}

function mapWorkout(
  workout: WorkoutRow,
  exercises: ExerciseRow[],
  latestSession?: SessionRow
): WorkoutTemplate {
  return {
    id: workout.id,
    phaseId: workout.phase_id,
    name: workout.name,
    focus: workout.focus,
    summary: workout.summary,
    readiness: deriveReadiness(latestSession),
    scheduledDays: workout.scheduled_days ?? [],
    exercises: exercises
      .filter((exercise) => exercise.workout_template_id === workout.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(mapExercise)
  };
}

async function getPlanBundle(userId: string, sessionSince?: string) {
  const supabase = await getSupabaseServerClient();

  const { data: plansData, error: plansError } = await supabase
    .from("workout_plans")
    .select(
      "id, name, description, is_active, schedule_summary, weekly_schedule, current_phase_id, completed_at, archived_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (plansError) {
    throw new Error(plansError.message);
  }

  const planIds = (plansData ?? []).map((plan) => plan.id);

  if (planIds.length === 0) {
    return {
      plans: [] as PlanRow[],
      phases: [] as PhaseRow[],
      workouts: [] as WorkoutRow[],
      exercises: [] as ExerciseRow[],
      sessions: [] as SessionRow[]
    };
  }

  const { data: phasesData, error: phasesError } = await supabase
    .from("plan_phases")
    .select("id, plan_id, phase_number, goal, advance_criteria, deload_criteria, advancement_preset, advancement_settings, deload_preset, deload_settings")
    .in("plan_id", planIds)
    .order("phase_number", { ascending: true });

  if (phasesError) {
    throw new Error(phasesError.message);
  }

  const phaseIds = (phasesData ?? []).map((phase) => phase.id);

  const workoutQuery = phaseIds.length
    ? supabase
        .from("workout_templates")
        .select("id, phase_id, name, focus, summary, day_order, scheduled_days")
        .in("phase_id", phaseIds)
        .order("day_order", { ascending: true })
    : Promise.resolve({ data: [], error: null });

  const [workoutsResult] = await Promise.all([workoutQuery]);

  if (workoutsResult.error) {
    throw new Error(workoutsResult.error.message);
  }

  const workoutIds = (workoutsResult.data ?? []).map((workout) => workout.id);

  const exercisesQuery = workoutIds.length
    ? supabase
        .from("exercise_entries")
        .select(
          "id, workout_template_id, name, sets, reps, rest, coaching_note, video_url, sort_order"
        )
        .in("workout_template_id", workoutIds)
        .order("sort_order", { ascending: true })
    : Promise.resolve({ data: [], error: null });

  const sessionsQuery = workoutIds.length
    ? (() => {
        let query = supabase
          .from("workout_sessions")
          .select(
            "id, workout_template_id, workout_name_snapshot, created_at, completed_on, completed, pain_occurred, perceived_difficulty, notes, recommendation, phase_id_at_completion, progression_decision, progression_reason"
          )
          .eq("user_id", userId)
          .in("workout_template_id", workoutIds)
          .order("completed_on", { ascending: false })
          .order("created_at", { ascending: false });

        if (sessionSince) {
          query = query.gte("completed_on", sessionSince);
        }

        return query;
      })()
    : Promise.resolve({ data: [], error: null });

  const [exercisesResult, sessionsResult] = await Promise.all([
    exercisesQuery,
    sessionsQuery
  ]);

  if (exercisesResult.error) {
    throw new Error(exercisesResult.error.message);
  }

  if (sessionsResult.error) {
    throw new Error(sessionsResult.error.message);
  }

  return {
    plans: ((plansData ?? []) as PlanRow[]).filter((plan) => !plan.archived_at),
    phases: (phasesData ?? []) as PhaseRow[],
    workouts: (workoutsResult.data ?? []) as WorkoutRow[],
    exercises: (exercisesResult.data ?? []) as ExerciseRow[],
    sessions: ((sessionsResult.data ?? []) as SessionRow[]).sort(sortSessionsByLatest)
  };
}

function mapPlanFromBundle(
  plan: PlanRow,
  phases: PhaseRow[],
  workouts: WorkoutRow[],
  exercises: ExerciseRow[],
  sessions: SessionRow[]
): WorkoutPlan {
  const planPhases = phases
    .filter((phase) => phase.plan_id === plan.id)
    .sort((a, b) => a.phase_number - b.phase_number);

  const fallbackPhase: PlanPhase = {
    id: "missing-phase",
    phaseNumber: 1,
    goal: "Create your first phase goal.",
    advanceCriteria: "Add advance criteria to begin progression tracking.",
    deloadCriteria: "Add deload criteria to guide pain or fatigue decisions.",
    advancementPreset: "clean_sessions_in_window",
    advancementSettings: { sessions: 4, weeks: 2 },
    deloadPreset: "pain_flags_in_window",
    deloadSettings: { painFlags: 2, days: 7 }
  };

  const currentPhaseRow =
    planPhases.find((phase) => phase.id === plan.current_phase_id) ?? planPhases[0];

  const currentPhase = currentPhaseRow ? mapPhase(currentPhaseRow) : fallbackPhase;
  const workoutsForPlan = workouts.filter((workout) =>
    planPhases.some((phase) => phase.id === workout.phase_id)
  );

  const mappedWorkouts = workoutsForPlan.map((workout) =>
    mapWorkout(
      workout,
      exercises,
      sessions.find((session) => session.workout_template_id === workout.id)
    )
  );

  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    isActive: plan.is_active,
    scheduleSummary: plan.schedule_summary,
    weeklySchedule: plan.weekly_schedule ?? [],
    completedAt: plan.completed_at,
    archivedAt: plan.archived_at,
    currentPhase,
    phases: planPhases.length ? planPhases.map(mapPhase) : [fallbackPhase],
    workouts: mappedWorkouts
  };
}

function computeMetrics(
  plan: WorkoutPlan | null,
  sessions: SessionRow[]
): DashboardMetric[] {
  if (!plan) {
    return [
      {
        label: "Weekly streak",
        value: "0 workouts",
        detail: "Create your first plan to begin tracking completed sessions."
      },
      {
        label: "Pain status",
        value: "No data",
        detail: "Once you log sessions, pain flags will show here."
      },
      {
        label: "Next decision",
        value: "Build first plan",
        detail: "Start with one clear phase and one repeatable workout."
      }
    ];
  }

  const lastSevenDays = new Date();
  lastSevenDays.setDate(lastSevenDays.getDate() - 7);

  const recentSessions = sessions.filter(
    (session) => new Date(session.completed_on) >= lastSevenDays
  );
  const painCount = recentSessions.filter((session) => session.pain_occurred).length;
  const painFlagLabel = painCount === 1 ? "1 pain flag" : `${painCount} pain flags`;
  const advanceReady = recentSessions.filter(
    (session) =>
      session.completed &&
      !session.pain_occurred &&
      session.perceived_difficulty !== "too_hard"
  ).length;

  return [
    {
      label: "Weekly streak",
      value: `${recentSessions.length} workouts`,
      detail: "This counts completed sessions in the last 7 days."
    },
    {
      label: "Pain status",
      value: painCount === 0 ? "Stable" : painFlagLabel,
      detail:
        painCount === 0
          ? "No recent pain flags detected."
          : "Review exercise selection or consider a deload before progressing."
    },
    {
      label: "Next decision",
      value: advanceReady >= 2 ? "Progress check" : "Repeat phase",
      detail:
        advanceReady >= 2
          ? "You have enough clean sessions to consider moving forward."
          : "Stay in the current phase until more consistent successful sessions are logged."
    }
  ];
}

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDaysAgoDateString(daysAgo: number) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return toDateString(date);
}

function getMondayStart(date: Date) {
  const nextDate = new Date(date);
  nextDate.setUTCHours(0, 0, 0, 0);
  const day = nextDate.getUTCDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  nextDate.setUTCDate(nextDate.getUTCDate() - daysFromMonday);
  return nextDate;
}

function formatWeekLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  });
}

function computeProgressSummary(
  sessions: SessionRow[],
  weeklyTarget = 3
): WorkoutProgressSummary {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const currentWeekStart = getMondayStart(today);
  const weekStarts = [3, 2, 1, 0].map((weeksAgo) => {
    const date = new Date(currentWeekStart);
    date.setUTCDate(date.getUTCDate() - weeksAgo * 7);
    return date;
  });

  const completedSessions = sessions.filter((session) => session.completed);
  const completedThisWeek = completedSessions.filter(
    (session) => new Date(`${session.completed_on}T00:00:00.000Z`) >= currentWeekStart
  ).length;
  const cleanSessions = sessions.filter(
    (session) =>
      session.completed &&
      !session.pain_occurred &&
      session.perceived_difficulty !== "too_hard"
  ).length;
  const painFlags = sessions.filter((session) => session.pain_occurred).length;

  const weeklyBars = weekStarts.map((weekStart) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

    return {
      label: formatWeekLabel(weekStart),
      completed: completedSessions.filter((session) => {
        const completedOn = new Date(`${session.completed_on}T00:00:00.000Z`);
        return completedOn >= weekStart && completedOn < weekEnd;
      }).length
    };
  });

  return {
    weeklyTarget,
    completedThisWeek,
    cleanSessions,
    painFlags,
    latestRecommendation: sessions[0]?.recommendation ?? "Log a workout to get a suggested next step.",
    weeklyBars
  };
}

function getCurrentWeekday() {
  return weekdayByIndex[new Date().getDay()];
}

function getActiveIncompletePlan(plans: WorkoutPlan[]) {
  return (
    plans.find((plan) => plan.isActive && !plan.completedAt && !plan.archivedAt) ??
    plans.find((plan) => !plan.completedAt && !plan.archivedAt) ??
    null
  );
}

function getCurrentPhaseWorkouts(plan: WorkoutPlan | null) {
  if (!plan) {
    return [];
  }

  return plan.workouts.filter((workout) => workout.phaseId === plan.currentPhase.id);
}

function getRecommendedWorkout(workouts: WorkoutTemplate[]) {
  const today = getCurrentWeekday();
  return workouts.find((workout) => workout.scheduledDays.includes(today)) ?? workouts[0] ?? null;
}

export async function getProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, goal, injuries, equipment, days_per_week, session_minutes, onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    goal: data.goal,
    injuries: data.injuries ?? [],
    equipment: data.equipment ?? [],
    daysPerWeek: data.days_per_week,
    sessionMinutes: data.session_minutes,
    onboardingCompletedAt: data.onboarding_completed_at
  };
}

export async function getPlans(): Promise<WorkoutPlan[]> {
  const user = await getCurrentUser();

  if (!user) {
    return [];
  }

  const bundle = await getPlanBundle(user.id);

  return bundle.plans.map((plan) =>
    mapPlanFromBundle(plan, bundle.phases, bundle.workouts, bundle.exercises, bundle.sessions)
  );
}

export async function getPlanById(id: string): Promise<WorkoutPlan | undefined> {
  const plans = await getPlans();
  return plans.find((plan) => plan.id === id);
}

export async function getTodayWorkout(): Promise<WorkoutTemplate | null> {
  const dashboard = await getDashboardData();
  return dashboard.todayWorkout;
}

export async function getWorkoutById(id: string): Promise<WorkoutTemplate | null> {
  const plans = await getPlans();

  for (const plan of plans) {
    const workout = plan.workouts.find((item) => item.id === id);
    if (workout) {
      return workout;
    }
  }

  return null;
}

export async function getLatestSessionForWorkout(
  workoutTemplateId: string
): Promise<WorkoutSession | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("workout_sessions")
    .select(
      "id, workout_template_id, workout_name_snapshot, created_at, completed_on, completed, pain_occurred, perceived_difficulty, notes, recommendation, phase_id_at_completion, progression_decision, progression_reason"
    )
    .eq("user_id", user.id)
    .eq("workout_template_id", workoutTemplateId)
    .order("completed_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    workoutTemplateId: data.workout_template_id,
    workoutNameSnapshot: data.workout_name_snapshot,
    createdAt: data.created_at,
    completedOn: data.completed_on,
    completed: data.completed,
    painOccurred: data.pain_occurred,
    perceivedDifficulty: data.perceived_difficulty,
    notes: data.notes,
    recommendation: data.recommendation,
    phaseIdAtCompletion: data.phase_id_at_completion,
    progressionDecision: data.progression_decision,
    progressionReason: data.progression_reason
  };
}

export async function getWorkoutPageData(
  selectedWorkoutId?: string
): Promise<WorkoutPageData> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      activePlan: null,
      workouts: [],
      activePhaseWorkouts: [],
      recommendedWorkout: null,
      selectedWorkout: null,
      recentSessions: [],
      latestSessionForSelectedWorkout: null,
      progressSummary: computeProgressSummary([], 3),
      phaseProgress: null
    };
  }

  const supabase = await getSupabaseServerClient();
  const sessionSince = getDaysAgoDateString(progressHistoryDays);
  const [bundle, profileResult] = await Promise.all([
    getPlanBundle(user.id, sessionSince),
    supabase
      .from("profiles")
      .select("days_per_week")
      .eq("id", user.id)
      .maybeSingle()
  ]);

  if (profileResult.error) {
    throw new Error(profileResult.error.message);
  }

  const mappedPlans = bundle.plans.map((plan) =>
    mapPlanFromBundle(plan, bundle.phases, bundle.workouts, bundle.exercises, bundle.sessions)
  );
  const activePlan = getActiveIncompletePlan(mappedPlans);
  const workouts = activePlan?.workouts ?? [];
  const activePhaseWorkouts = getCurrentPhaseWorkouts(activePlan);
  const recommendedWorkout = getRecommendedWorkout(activePhaseWorkouts);
  const selectedWorkout =
    activePhaseWorkouts.find((workout) => workout.id === selectedWorkoutId) ??
    recommendedWorkout;
  const recentSessions = bundle.sessions.map(mapSession);
  const phaseProgress: PhaseProgressSummary | null = activePlan
    ? calculatePhaseProgress({
        plan: activePlan,
        currentPhase: activePlan.currentPhase,
        sessions: recentSessions
      })
    : null;

  return {
    activePlan,
    workouts,
    activePhaseWorkouts,
    recommendedWorkout,
    selectedWorkout,
    recentSessions,
    latestSessionForSelectedWorkout: selectedWorkout
      ? recentSessions.find((session) => session.workoutTemplateId === selectedWorkout.id) ?? null
      : null,
    progressSummary: computeProgressSummary(
      bundle.sessions,
      profileResult.data?.days_per_week ?? 3
    ),
    phaseProgress
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      activePlan: null,
      todayWorkout: null,
      metrics: computeMetrics(null, []),
      phaseProgress: null
    };
  }

  const bundle = await getPlanBundle(user.id);
  const mappedPlans = bundle.plans.map((plan) =>
    mapPlanFromBundle(plan, bundle.phases, bundle.workouts, bundle.exercises, bundle.sessions)
  );
  const activePlan = getActiveIncompletePlan(mappedPlans);
  const todayWorkout = getRecommendedWorkout(getCurrentPhaseWorkouts(activePlan));
  const recentSessions = bundle.sessions.map(mapSession);

  return {
    activePlan,
    todayWorkout,
    metrics: computeMetrics(activePlan, bundle.sessions),
    phaseProgress: activePlan
      ? calculatePhaseProgress({
          plan: activePlan,
          currentPhase: activePlan.currentPhase,
          sessions: recentSessions
        })
      : null
  };
}
