export type Profile = {
  id: string;
  goal: string;
  goalNotes?: string | null;
  primaryGoalType?: TrainingGoalType | null;
  injuries: string[];
  limitationsDetail?: string | null;
  equipment: string[];
  age?: number | null;
  weight?: number | null;
  trainingExperience?: TrainingExperience | null;
  activityLevel?: ActivityLevel | null;
  trainingEnvironment?: TrainingEnvironment | null;
  exercisePreferences?: string[];
  exerciseDislikes?: string[];
  sportsInterests?: string[];
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
  sourceExerciseId?: string | null;
};

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type TrainingGoalType =
  | "recovery"
  | "general_fitness"
  | "strength"
  | "hypertrophy"
  | "running"
  | "sport_performance"
  | "consistency";

export type ProgressionMode =
  | "symptom_based"
  | "adherence_based"
  | "performance_based"
  | "hybrid";

export type TrainingExperience =
  | "new"
  | "returning"
  | "intermediate"
  | "advanced";

export type ActivityLevel =
  | "mostly_sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active";

export type TrainingEnvironment =
  | "home"
  | "gym"
  | "outdoors"
  | "mixed";

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
  goalType?: TrainingGoalType | null;
  progressionMode?: ProgressionMode | null;
  creationSource?: PlanCreationSource | null;
  setupContext?: PlanSetupInput | null;
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
  weekPreview: DashboardWeekPreviewItem[];
  activitySummary: DashboardActivitySummary;
  progressionPrompt: DashboardProgressionPrompt | null;
  painTrend: DashboardPainTrend | null;
};

export type DashboardWeekPreviewItem = {
  key: string;
  weekday: Weekday;
  weekdayLabel: string;
  dateLabel: string;
  isToday: boolean;
  workoutId: string | null;
  workoutName: string;
  detail: string;
  tone: "workout" | "fallback" | "rest";
};

export type DashboardActivityDay = {
  key: string;
  weekdayLabel: string;
  isToday: boolean;
  completed: boolean;
  painFlagged: boolean;
};

export type DashboardActivitySummary = {
  completedThisWeek: number;
  days: DashboardActivityDay[];
  streakLabel: string;
};

export type DashboardProgressionPrompt = {
  tone: "ready" | "complete" | "caution" | "steady";
  eyebrow: string;
  title: string;
  detail: string;
  actionLabel: string | null;
  actionHref: string | null;
};

export type DashboardPainTrend = {
  label: string;
  detail: string;
  painFlags: number;
  tone: "stable" | "caution";
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
  sourceExerciseId?: string | null;
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
  goalType?: TrainingGoalType | null;
  progressionMode?: ProgressionMode | null;
  creationSource?: PlanCreationSource;
  weeklySchedule: Weekday[];
  phases: StructuredPhaseInput[];
};

export type StructuredPlanSaveInput = {
  plan: StructuredPlanInput;
  setupContext?: PlanSetupInput | null;
};

export type PlanCreationInput = PlanFormInput | StructuredPlanInput;

export type PlanSetupChoice = "manual" | "guided" | "ai";

export type PlanCreationSource =
  | "manual"
  | "guided_template"
  | "llm_draft"
  | "ai_import";

export type PlanDraftStrategy = "template" | "llm";

export type PlanPreferredSplit =
  | "full_body"
  | "upper_lower"
  | "push_pull_legs"
  | "run_strength"
  | "mobility_strength"
  | "flexible";

export type PlanSetupInput = {
  goalType: TrainingGoalType;
  objectiveSummary?: string;
  daysPerWeek: number;
  sessionMinutes: number;
  weeklySchedule: Weekday[];
  preferredSplit: PlanPreferredSplit;
  focusAreas: string[];
  currentConstraints: string[];
  progressionModeOverride?: ProgressionMode | null;
};

export type AiPlanPromptInput = {
  goalTrack: TrainingGoalType;
  daysPerWeek: number;
  sessionDurationMin: number;
  weeklySchedule: Weekday[];
  equipmentAccess: string;
  experienceLevel?: TrainingExperience | null;
  limitations: string;
  primaryFocus: string;
  progressionMode?: ProgressionMode | null;
  trainingEnvironment?: TrainingEnvironment | null;
  preferences?: string[];
  dislikes?: string[];
  sportsInterests?: string[];
  freeformContext?: string;
};

export type AiImportedExercise = {
  name: string;
  sets: number;
  reps: string;
  restSeconds: number | null;
  notes: string;
};

export type AiImportedWorkout = {
  name: string;
  focus: string;
  scheduledDay?: Weekday | null;
  exercises: AiImportedExercise[];
};

export type AiImportedPhase = {
  phaseNumber: number;
  name: string;
  durationWeeks: number;
  objective: string;
  workouts: AiImportedWorkout[];
};

export type AiImportedPlan = {
  title: string;
  goalTrack: TrainingGoalType;
  progressionMode: ProgressionMode | null;
  daysPerWeek: number;
  sessionDurationMin: number;
  summary: string;
  phases: AiImportedPhase[];
};

export type PlanDraftProfileContext = {
  primaryGoalType?: TrainingGoalType | null;
  injuries: string[];
  limitationsDetail?: string | null;
  equipment: string[];
  trainingExperience?: TrainingExperience | null;
  activityLevel?: ActivityLevel | null;
  trainingEnvironment?: TrainingEnvironment | null;
  exercisePreferences?: string[];
  exerciseDislikes?: string[];
  sportsInterests?: string[];
  daysPerWeek?: number;
  sessionMinutes?: number;
};

export type PlanDraftInput = {
  setup: PlanSetupInput;
  profile?: PlanDraftProfileContext | null;
};

export type PlanDraftResult = {
  plan: StructuredPlanInput;
  source: PlanCreationSource;
  strategy: PlanDraftStrategy;
};

export type ProfileSetupInput = {
  age?: number | null;
  weight?: number | null;
  trainingExperience?: TrainingExperience | null;
  activityLevel?: ActivityLevel | null;
  trainingEnvironment?: TrainingEnvironment | null;
  limitationsDetail?: string;
  injuries: string[];
  equipment: string[];
  exercisePreferences?: string[];
  exerciseDislikes?: string[];
  sportsInterests?: string[];
  daysPerWeek: number;
  sessionMinutes: number;
  weeklySchedule: Weekday[];
};

export type ProfileSettingsInput = Partial<Omit<ProfileSetupInput, "weeklySchedule">>;

export type OnboardingInput = ProfileSetupInput & {
  goal: string;
  goalNotes: string;
  planSetupChoice: PlanSetupChoice;
};
