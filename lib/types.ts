export type Profile = {
  id: string;
  goal: string;
  injuries: string[];
  equipment: string[];
  daysPerWeek: number;
  sessionMinutes: number;
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
  activePlan: WorkoutPlan;
  todayWorkout: WorkoutTemplate;
  metrics: DashboardMetric[];
};

