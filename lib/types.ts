export type Profile = {
  id: string;
  goal: string;
  injuries: string[];
  equipment: string[];
  daysPerWeek: number;
  sessionMinutes: number;
  onboardingCompletedAt: string | null;
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

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type ProgressionDecision = "advance" | "repeat" | "review" | "deload";

export type AdvancementPreset =
  | "clean_sessions_in_window"
  | "clean_sessions_streak"
  | "all_scheduled_workouts";

export type DeloadPreset = "pain_flags_in_window" | "too_hard_streak";

export type ProgressionSettings = {
  sessions?: number;
  weeks?: number;
  painFlags?: number;
  days?: number;
};

export type WorkoutTemplate = {
  id: string;
  phaseId: string;
  name: string;
  focus: string;
  summary: string;
  readiness: string;
  scheduledDays: Weekday[];
  exercises: ExerciseEntry[];
};

export type PlanPhase = {
  id: string;
  phaseNumber: number;
  goal: string;
  advanceCriteria: string;
  deloadCriteria: string;
  advancementPreset: AdvancementPreset;
  advancementSettings: ProgressionSettings;
  deloadPreset: DeloadPreset;
  deloadSettings: ProgressionSettings;
};

export type WorkoutPlan = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  scheduleSummary: string;
  weeklySchedule: Weekday[];
  completedAt: string | null;
  archivedAt: string | null;
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
  phaseProgress: PhaseProgressSummary | null;
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

export type PhaseProgressSummary = {
  decision: ProgressionDecision;
  recommendation: string;
  reason: string;
  canAdvance: boolean;
  canComplete: boolean;
  criteriaMet: boolean;
  currentPhaseId: string;
  nextPhaseId: string | null;
  previousPhaseId: string | null;
  cleanSessions: number;
  requiredCleanSessions: number;
  painFlags: number;
  completionPercent: number;
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
  workoutTemplateId: string | null;
  workoutNameSnapshot: string;
  phaseIdAtCompletion?: string | null;
  progressionDecision?: ProgressionDecision | null;
  progressionReason?: string | null;
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
  activePhaseWorkouts: WorkoutTemplate[];
  recommendedWorkout: WorkoutTemplate | null;
  selectedWorkout: WorkoutTemplate | null;
  recentSessions: WorkoutSession[];
  latestSessionForSelectedWorkout: WorkoutSession | null;
  progressSummary: WorkoutProgressSummary;
  phaseProgress: PhaseProgressSummary | null;
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

export type StructuredExerciseInput = {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  coachingNote: string;
  videoUrl?: string;
  sourceExerciseId?: string;
};

export type StructuredWorkoutInput = {
  name: string;
  focus: string;
  summary: string;
  scheduledDays: Weekday[];
  exercises: StructuredExerciseInput[];
};

export type StructuredPhaseInput = {
  goal: string;
  advancementPreset: AdvancementPreset;
  advancementSettings: ProgressionSettings;
  deloadPreset: DeloadPreset;
  deloadSettings: ProgressionSettings;
  workouts: StructuredWorkoutInput[];
};

export type StructuredPlanInput = {
  version: "structured-v1";
  name: string;
  description: string;
  weeklySchedule: Weekday[];
  phases: StructuredPhaseInput[];
};

export type PlanCreationInput = PlanFormInput | StructuredPlanInput;

export type PlanSetupChoice = "manual" | "guided" | "ai";

export type OnboardingInput = {
  goal: string;
  goalNotes: string;
  injuries: string[];
  equipment: string[];
  daysPerWeek: number;
  sessionMinutes: number;
  weeklySchedule: Weekday[];
  planSetupChoice: PlanSetupChoice;
};
