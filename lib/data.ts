import { getCurrentUser } from "@/lib/auth";
import {
  type DashboardData,
  type DashboardMetric,
  type ExerciseEntry,
  type PlanPhase,
  type Profile,
  type WorkoutPlan,
  type WorkoutSession,
  type WorkoutTemplate
} from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase-server";

type PlanRow = {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  schedule_summary: string;
  current_phase_id: string | null;
};

type PhaseRow = {
  id: string;
  plan_id: string;
  phase_number: number;
  goal: string;
  advance_criteria: string;
  deload_criteria: string;
};

type WorkoutRow = {
  id: string;
  phase_id: string;
  name: string;
  focus: string;
  summary: string;
  day_order: number;
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
  workout_template_id: string;
  completed_on: string;
  completed: boolean;
  pain_occurred: boolean;
  perceived_difficulty: "too_easy" | "appropriate" | "too_hard";
  notes: string;
  recommendation: string;
};

function mapPhase(row: PhaseRow): PlanPhase {
  return {
    id: row.id,
    phaseNumber: row.phase_number,
    goal: row.goal,
    advanceCriteria: row.advance_criteria,
    deloadCriteria: row.deload_criteria
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

function mapWorkout(
  workout: WorkoutRow,
  exercises: ExerciseRow[],
  latestSession?: SessionRow
): WorkoutTemplate {
  return {
    id: workout.id,
    name: workout.name,
    focus: workout.focus,
    summary: workout.summary,
    readiness: deriveReadiness(latestSession),
    exercises: exercises
      .filter((exercise) => exercise.workout_template_id === workout.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(mapExercise)
  };
}

async function getPlanBundle(userId: string) {
  const supabase = await getSupabaseServerClient();

  const { data: plansData, error: plansError } = await supabase
    .from("workout_plans")
    .select("id, name, description, is_active, schedule_summary, current_phase_id")
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
    .select("id, plan_id, phase_number, goal, advance_criteria, deload_criteria")
    .in("plan_id", planIds)
    .order("phase_number", { ascending: true });

  if (phasesError) {
    throw new Error(phasesError.message);
  }

  const phaseIds = (phasesData ?? []).map((phase) => phase.id);

  const workoutQuery = phaseIds.length
    ? supabase
        .from("workout_templates")
        .select("id, phase_id, name, focus, summary, day_order")
        .in("phase_id", phaseIds)
        .order("day_order", { ascending: true })
    : Promise.resolve({ data: [], error: null });

  const [workoutsResult] = await Promise.all([workoutQuery]);

  if (workoutsResult.error) {
    throw new Error(workoutsResult.error.message);
  }

  const workoutIds = (workoutsResult.data ?? []).map((workout) => workout.id);

  const [exercisesResult, sessionsResult] = await Promise.all([
    workoutIds.length
      ? supabase
          .from("exercise_entries")
          .select(
            "id, workout_template_id, name, sets, reps, rest, coaching_note, video_url, sort_order"
          )
          .in("workout_template_id", workoutIds)
          .order("sort_order", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    workoutIds.length
      ? supabase
          .from("workout_sessions")
          .select(
            "id, workout_template_id, completed_on, completed, pain_occurred, perceived_difficulty, notes, recommendation"
          )
          .eq("user_id", userId)
          .in("workout_template_id", workoutIds)
          .order("completed_on", { ascending: false })
      : Promise.resolve({ data: [], error: null })
  ]);

  if (exercisesResult.error) {
    throw new Error(exercisesResult.error.message);
  }

  if (sessionsResult.error) {
    throw new Error(sessionsResult.error.message);
  }

  return {
    plans: (plansData ?? []) as PlanRow[],
    phases: (phasesData ?? []) as PhaseRow[],
    workouts: (workoutsResult.data ?? []) as WorkoutRow[],
    exercises: (exercisesResult.data ?? []) as ExerciseRow[],
    sessions: (sessionsResult.data ?? []) as SessionRow[]
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
    deloadCriteria: "Add deload criteria to guide pain or fatigue decisions."
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
      value: painCount === 0 ? "Stable" : `${painCount} pain flags`,
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

export async function getProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, goal, injuries, equipment, days_per_week, session_minutes")
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
    sessionMinutes: data.session_minutes
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
      "id, workout_template_id, completed_on, completed, pain_occurred, perceived_difficulty, notes, recommendation"
    )
    .eq("user_id", user.id)
    .eq("workout_template_id", workoutTemplateId)
    .order("completed_on", { ascending: false })
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
    completedOn: data.completed_on,
    completed: data.completed,
    painOccurred: data.pain_occurred,
    perceivedDifficulty: data.perceived_difficulty,
    notes: data.notes,
    recommendation: data.recommendation
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      activePlan: null,
      todayWorkout: null,
      metrics: computeMetrics(null, [])
    };
  }

  const bundle = await getPlanBundle(user.id);
  const mappedPlans = bundle.plans.map((plan) =>
    mapPlanFromBundle(plan, bundle.phases, bundle.workouts, bundle.exercises, bundle.sessions)
  );
  const activePlan = mappedPlans.find((plan) => plan.isActive) ?? mappedPlans[0] ?? null;
  const currentPhaseId = activePlan?.currentPhase.id;
  const todayWorkout =
    activePlan?.workouts.find((workout) =>
      bundle.workouts.some(
        (row) =>
          row.id === workout.id &&
          row.phase_id === currentPhaseId
      )
    ) ?? activePlan?.workouts[0] ?? null;

  return {
    activePlan,
    todayWorkout,
    metrics: computeMetrics(activePlan, bundle.sessions)
  };
}
