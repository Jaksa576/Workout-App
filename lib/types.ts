export type Profile = {
  id: string;
  goal: string;
  injuries: string[];
  equipment: string[];
  daysPerWeek: number;
  sessionMinutes: number;
};

export type UserSummary = {
  id: string;
  email: string | null;
};

export type ExerciseEntry = {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
  coachingNote: string;
  videoUrl?: string;
};

export type WorkoutTemplate = {
  id: string;
  name: string;
  focus: string;
  summary: string;
  readiness: string;
  exercises: ExerciseEntry[];
};

export type PlanPhase = {
  id: string;
  phaseNumber: number;
  goal: string;
  advanceCriteria: string;
  deloadCriteria: string;
};

export type WorkoutPlan = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  scheduleSummary: string;
  currentPhase: PlanPhase;
  phases: PlanPhase[];
  workouts: WorkoutTemplate[];
};

export type DashboardMetric = {
  label: string;
  value: string;
  detail: string;
};

export type DashboardData = {
  activePlan: WorkoutPlan | null;
  todayWorkout: WorkoutTemplate | null;
  metrics: DashboardMetric[];
};

export type ProgressBarPoint = {
  label: string;
  completed: number;
};

export type WorkoutProgressSummary = {
  weeklyTarget: number;
  completedThisWeek: number;
  cleanSessions: number;
  painFlags: number;
  latestRecommendation: string;
  weeklyBars: ProgressBarPoint[];
};

export type WorkoutSession = {
  id: string;
  createdAt: string;
  completedOn: string;
  completed: boolean;
  painOccurred: boolean;
  perceivedDifficulty: "too_easy" | "appropriate" | "too_hard";
  notes: string;
  recommendation: string;
  workoutTemplateId: string;
};

export type WorkoutSessionInput = {
  workoutTemplateId: string;
  completedOn: string;
  completed: boolean;
  painOccurred: boolean;
  perceivedDifficulty: "too_easy" | "appropriate" | "too_hard";
  notes: string;
  completedExerciseIds: string[];
};

export type SavedWorkoutSession = WorkoutSession & {
  completedExerciseCount: number;
  workoutName: string;
};

export type WorkoutPageData = {
  activePlan: WorkoutPlan | null;
  workouts: WorkoutTemplate[];
  selectedWorkout: WorkoutTemplate | null;
  recentSessions: WorkoutSession[];
  latestSessionForSelectedWorkout: WorkoutSession | null;
  progressSummary: WorkoutProgressSummary;
};

export type PlanFormInput = {
  name: string;
  description: string;
  scheduleSummary: string;
  phaseGoal: string;
  advanceCriteria: string;
  deloadCriteria: string;
  workoutName: string;
  workoutFocus: string;
  workoutSummary: string;
  exercises: Array<{
    name: string;
    sets: number;
    reps: string;
    rest: string;
    coachingNote: string;
    videoUrl?: string;
  }>;
};
