import type { StructuredExerciseInput, TrainingGoalType } from "@/lib/types";

export type ExerciseCategory =
  | "mobility"
  | "strength"
  | "cardio"
  | "core"
  | "running_prep"
  | "recovery"
  | "athletic";

export type MovementPattern =
  | "squat"
  | "hinge"
  | "lunge"
  | "push"
  | "pull"
  | "carry"
  | "core"
  | "mobility"
  | "run"
  | "walk"
  | "calf"
  | "lateral"
  | "power";

export type DifficultyTier = "intro" | "foundation" | "intermediate";

export type CautionTag =
  | "knee"
  | "back"
  | "shoulder"
  | "ankle"
  | "hamstring"
  | "impact"
  | "overhead"
  | "loaded_spine";

export type ExerciseCatalogItem = StructuredExerciseInput & {
  id: string;
  category: ExerciseCategory;
  movementPattern: MovementPattern;
  equipmentTags: string[];
  goalTags: TrainingGoalType[];
  difficultyTier: DifficultyTier;
  cautionTags: CautionTag[];
  traitTags: string[];
  preferenceTags: string[];
};

export const exerciseCategories: Array<{ value: ExerciseCategory; label: string }> = [
  { value: "mobility", label: "Mobility" },
  { value: "strength", label: "Strength" },
  { value: "cardio", label: "Cardio" },
  { value: "core", label: "Core" },
  { value: "running_prep", label: "Running prep" },
  { value: "recovery", label: "Recovery" },
  { value: "athletic", label: "Athletic" }
];

const allStrengthGoals: TrainingGoalType[] = [
  "general_fitness",
  "strength",
  "hypertrophy",
  "sport_performance"
];

const simpleGoals: TrainingGoalType[] = ["recovery", "consistency", "general_fitness"];

export const exerciseCatalog: ExerciseCatalogItem[] = [
  {
    id: "bodyweight-squat",
    name: "Bodyweight squat",
    category: "strength",
    movementPattern: "squat",
    equipmentTags: ["Bodyweight"],
    goalTags: [...simpleGoals, "strength"],
    difficultyTier: "intro",
    cautionTags: ["knee"],
    traitTags: ["bilateral", "low_setup"],
    preferenceTags: ["bodyweight", "lower body", "squat"],
    sets: 3,
    reps: "8-10",
    rest: "60 sec",
    coachingNote: "Keep your ribs stacked and move through a comfortable range.",
    videoUrl: "https://www.youtube.com/watch?v=aclHkVaku9U"
  },
  {
    id: "box-squat",
    name: "Box squat",
    category: "recovery",
    movementPattern: "squat",
    equipmentTags: ["Bodyweight", "Bench"],
    goalTags: ["recovery", "consistency", "general_fitness"],
    difficultyTier: "intro",
    cautionTags: ["knee"],
    traitTags: ["bilateral", "low_load"],
    preferenceTags: ["bodyweight", "lower body", "squat"],
    sets: 2,
    reps: "6-8",
    rest: "60 sec",
    coachingNote: "Sit back to a comfortable height and stand up with control."
  },
  {
    id: "goblet-squat",
    name: "Goblet squat",
    category: "strength",
    movementPattern: "squat",
    equipmentTags: ["Dumbbells", "Kettlebell"],
    goalTags: allStrengthGoals,
    difficultyTier: "foundation",
    cautionTags: ["knee", "back"],
    traitTags: ["bilateral", "loaded"],
    preferenceTags: ["dumbbells", "kettlebell", "lower body", "squat"],
    sets: 3,
    reps: "8-10",
    rest: "90 sec",
    coachingNote: "Hold the weight close and keep your knees tracking over your toes.",
    videoUrl: "https://www.youtube.com/watch?v=MeIiIdhvXT4"
  },
  {
    id: "barbell-back-squat",
    name: "Barbell back squat",
    category: "strength",
    movementPattern: "squat",
    equipmentTags: ["Barbell"],
    goalTags: ["strength", "sport_performance"],
    difficultyTier: "intermediate",
    cautionTags: ["knee", "back", "loaded_spine"],
    traitTags: ["bilateral", "higher_load"],
    preferenceTags: ["barbell", "lower body", "squat"],
    sets: 4,
    reps: "4-6",
    rest: "2-3 min",
    coachingNote: "Brace before each rep and keep the bar path controlled."
  },
  {
    id: "romanian-deadlift",
    name: "Romanian deadlift",
    category: "strength",
    movementPattern: "hinge",
    equipmentTags: ["Dumbbells", "Barbell"],
    goalTags: allStrengthGoals,
    difficultyTier: "foundation",
    cautionTags: ["back", "hamstring"],
    traitTags: ["bilateral", "loaded"],
    preferenceTags: ["dumbbells", "barbell", "hinge", "posterior chain"],
    sets: 3,
    reps: "8",
    rest: "90 sec",
    coachingNote: "Hinge at the hips and keep the weights close to your legs.",
    videoUrl: "https://www.youtube.com/watch?v=JCXUYuzwNrM"
  },
  {
    id: "hip-hinge-drill",
    name: "Hip hinge drill",
    category: "recovery",
    movementPattern: "hinge",
    equipmentTags: ["Bodyweight"],
    goalTags: ["recovery", "consistency", "general_fitness"],
    difficultyTier: "intro",
    cautionTags: ["back", "hamstring"],
    traitTags: ["low_load", "technique"],
    preferenceTags: ["bodyweight", "hinge", "posterior chain"],
    sets: 2,
    reps: "8",
    rest: "45 sec",
    coachingNote: "Practice the hinge slowly and stop before your back takes over."
  },
  {
    id: "glute-bridge",
    name: "Glute bridge",
    category: "recovery",
    movementPattern: "hinge",
    equipmentTags: ["Bodyweight", "Bands"],
    goalTags: ["recovery", "general_fitness", "running", "hypertrophy", "consistency"],
    difficultyTier: "intro",
    cautionTags: [],
    traitTags: ["low_load", "posterior_chain"],
    preferenceTags: ["bodyweight", "glutes", "lower body"],
    sets: 3,
    reps: "10-12",
    rest: "60 sec",
    coachingNote: "Pause at the top and keep your low back quiet.",
    videoUrl: "https://www.youtube.com/watch?v=wPM8icPu6H8"
  },
  {
    id: "reverse-lunge",
    name: "Reverse lunge",
    category: "strength",
    movementPattern: "lunge",
    equipmentTags: ["Bodyweight", "Dumbbells"],
    goalTags: ["general_fitness", "strength", "hypertrophy", "sport_performance"],
    difficultyTier: "foundation",
    cautionTags: ["knee"],
    traitTags: ["unilateral", "lower_body"],
    preferenceTags: ["bodyweight", "dumbbells", "lower body", "lunge"],
    sets: 3,
    reps: "8 each side",
    rest: "75 sec",
    coachingNote: "Step back softly and keep the front foot grounded."
  },
  {
    id: "step-up",
    name: "Step-up",
    category: "strength",
    movementPattern: "lunge",
    equipmentTags: ["Bodyweight", "Dumbbells", "Bench"],
    goalTags: ["general_fitness", "strength", "running", "sport_performance"],
    difficultyTier: "foundation",
    cautionTags: ["knee"],
    traitTags: ["unilateral", "lower_body"],
    preferenceTags: ["bodyweight", "dumbbells", "lower body", "running prep"],
    sets: 3,
    reps: "8 each side",
    rest: "75 sec",
    coachingNote: "Use a low step and control the lowering phase."
  },
  {
    id: "walking-lunge",
    name: "Walking lunge",
    category: "running_prep",
    movementPattern: "lunge",
    equipmentTags: ["Bodyweight", "Dumbbells"],
    goalTags: ["running", "sport_performance", "general_fitness"],
    difficultyTier: "foundation",
    cautionTags: ["knee"],
    traitTags: ["unilateral", "running_support"],
    preferenceTags: ["bodyweight", "dumbbells", "lower body", "running prep"],
    sets: 2,
    reps: "8 each side",
    rest: "75 sec",
    coachingNote: "Step smoothly and keep the front foot grounded.",
    videoUrl: "https://www.youtube.com/watch?v=L8fvypPrzzs"
  },
  {
    id: "incline-push-up",
    name: "Incline push-up",
    category: "strength",
    movementPattern: "push",
    equipmentTags: ["Bodyweight", "Bench"],
    goalTags: ["recovery", "general_fitness", "strength", "hypertrophy", "consistency"],
    difficultyTier: "intro",
    cautionTags: ["shoulder"],
    traitTags: ["upper_body", "low_load"],
    preferenceTags: ["bodyweight", "push", "upper body"],
    sets: 3,
    reps: "8-12",
    rest: "60 sec",
    coachingNote: "Use a height that lets you control every rep.",
    videoUrl: "https://www.youtube.com/watch?v=Z0bRiVhnO8Q"
  },
  {
    id: "push-up",
    name: "Push-up",
    category: "strength",
    movementPattern: "push",
    equipmentTags: ["Bodyweight"],
    goalTags: ["general_fitness", "strength", "hypertrophy", "sport_performance"],
    difficultyTier: "foundation",
    cautionTags: ["shoulder"],
    traitTags: ["upper_body", "low_setup"],
    preferenceTags: ["bodyweight", "push", "upper body"],
    sets: 3,
    reps: "6-12",
    rest: "90 sec",
    coachingNote: "Keep a strong plank and leave a rep or two in reserve."
  },
  {
    id: "dumbbell-floor-press",
    name: "Dumbbell floor press",
    category: "strength",
    movementPattern: "push",
    equipmentTags: ["Dumbbells"],
    goalTags: ["strength", "hypertrophy", "general_fitness"],
    difficultyTier: "foundation",
    cautionTags: ["shoulder"],
    traitTags: ["upper_body", "loaded"],
    preferenceTags: ["dumbbells", "push", "chest", "upper body"],
    sets: 3,
    reps: "8-10",
    rest: "90 sec",
    coachingNote: "Pause the upper arms lightly on the floor and press with control."
  },
  {
    id: "dumbbell-shoulder-press",
    name: "Dumbbell shoulder press",
    category: "strength",
    movementPattern: "push",
    equipmentTags: ["Dumbbells"],
    goalTags: ["strength", "hypertrophy"],
    difficultyTier: "foundation",
    cautionTags: ["shoulder", "overhead"],
    traitTags: ["upper_body", "loaded"],
    preferenceTags: ["dumbbells", "push", "shoulders", "overhead"],
    sets: 3,
    reps: "8-10",
    rest: "90 sec",
    coachingNote: "Press without shrugging and stop if the shoulder feels irritated."
  },
  {
    id: "band-row",
    name: "Band row",
    category: "strength",
    movementPattern: "pull",
    equipmentTags: ["Bands"],
    goalTags: ["recovery", "general_fitness", "strength", "hypertrophy", "consistency"],
    difficultyTier: "intro",
    cautionTags: ["shoulder"],
    traitTags: ["upper_body", "low_load"],
    preferenceTags: ["bands", "pull", "upper body", "back"],
    sets: 3,
    reps: "10-12",
    rest: "60 sec",
    coachingNote: "Pull your elbows back and keep your shoulders relaxed.",
    videoUrl: "https://www.youtube.com/watch?v=GZbfZ033f74"
  },
  {
    id: "dumbbell-row",
    name: "Dumbbell row",
    category: "strength",
    movementPattern: "pull",
    equipmentTags: ["Dumbbells", "Bench"],
    goalTags: ["general_fitness", "strength", "hypertrophy", "sport_performance"],
    difficultyTier: "foundation",
    cautionTags: ["shoulder", "back"],
    traitTags: ["upper_body", "loaded"],
    preferenceTags: ["dumbbells", "pull", "upper body", "back"],
    sets: 3,
    reps: "8-10 each side",
    rest: "90 sec",
    coachingNote: "Pull the elbow toward your hip and keep the torso steady."
  },
  {
    id: "farmer-carry",
    name: "Farmer carry",
    category: "strength",
    movementPattern: "carry",
    equipmentTags: ["Dumbbells", "Kettlebell"],
    goalTags: ["strength", "sport_performance", "general_fitness"],
    difficultyTier: "foundation",
    cautionTags: ["back"],
    traitTags: ["loaded", "core", "grip"],
    preferenceTags: ["dumbbells", "kettlebell", "carry", "core"],
    sets: 3,
    reps: "30-40 sec",
    rest: "75 sec",
    coachingNote: "Walk tall and keep the ribs stacked over the pelvis."
  },
  {
    id: "dead-bug",
    name: "Dead bug",
    category: "core",
    movementPattern: "core",
    equipmentTags: ["Bodyweight"],
    goalTags: ["recovery", "general_fitness", "running", "sport_performance", "consistency"],
    difficultyTier: "intro",
    cautionTags: [],
    traitTags: ["core", "low_load"],
    preferenceTags: ["bodyweight", "core"],
    sets: 3,
    reps: "6 each side",
    rest: "45 sec",
    coachingNote: "Move slowly and keep your back gently anchored.",
    videoUrl: "https://www.youtube.com/watch?v=4XLEnwUr1d8"
  },
  {
    id: "side-plank",
    name: "Side plank",
    category: "core",
    movementPattern: "core",
    equipmentTags: ["Bodyweight"],
    goalTags: ["general_fitness", "running", "sport_performance", "consistency"],
    difficultyTier: "foundation",
    cautionTags: ["shoulder"],
    traitTags: ["core", "lateral"],
    preferenceTags: ["bodyweight", "core"],
    sets: 2,
    reps: "20-30 sec each side",
    rest: "45 sec",
    coachingNote: "Keep a straight line from shoulder to ankle.",
    videoUrl: "https://www.youtube.com/watch?v=K2VljzCC16g"
  },
  {
    id: "bird-dog",
    name: "Bird dog",
    category: "core",
    movementPattern: "core",
    equipmentTags: ["Bodyweight"],
    goalTags: ["recovery", "general_fitness", "consistency"],
    difficultyTier: "intro",
    cautionTags: [],
    traitTags: ["core", "low_load"],
    preferenceTags: ["bodyweight", "core", "back-friendly"],
    sets: 2,
    reps: "6 each side",
    rest: "45 sec",
    coachingNote: "Reach long without letting the hips rotate."
  },
  {
    id: "dumbbell-lateral-raise",
    name: "Dumbbell lateral raise",
    category: "strength",
    movementPattern: "push",
    equipmentTags: ["Dumbbells"],
    goalTags: ["hypertrophy"],
    difficultyTier: "foundation",
    cautionTags: ["shoulder"],
    traitTags: ["upper_body", "accessory"],
    preferenceTags: ["dumbbells", "shoulders", "hypertrophy"],
    sets: 3,
    reps: "12-15",
    rest: "60 sec",
    coachingNote: "Lift only to a comfortable height and control the lowering."
  },
  {
    id: "dumbbell-curl",
    name: "Dumbbell curl",
    category: "strength",
    movementPattern: "pull",
    equipmentTags: ["Dumbbells"],
    goalTags: ["hypertrophy"],
    difficultyTier: "intro",
    cautionTags: [],
    traitTags: ["upper_body", "accessory"],
    preferenceTags: ["dumbbells", "arms", "hypertrophy"],
    sets: 3,
    reps: "10-15",
    rest: "60 sec",
    coachingNote: "Keep the upper arm still and squeeze each rep."
  },
  {
    id: "calf-raise",
    name: "Calf raise",
    category: "running_prep",
    movementPattern: "calf",
    equipmentTags: ["Bodyweight", "Dumbbells"],
    goalTags: ["running", "general_fitness", "hypertrophy"],
    difficultyTier: "intro",
    cautionTags: ["ankle"],
    traitTags: ["lower_body", "running_support"],
    preferenceTags: ["bodyweight", "dumbbells", "calves", "running prep"],
    sets: 3,
    reps: "12-15",
    rest: "45 sec",
    coachingNote: "Rise with control and lower slowly.",
    videoUrl: "https://www.youtube.com/watch?v=YMmgqO8Jo-k"
  },
  {
    id: "tibialis-raise",
    name: "Tibialis raise",
    category: "running_prep",
    movementPattern: "calf",
    equipmentTags: ["Bodyweight"],
    goalTags: ["running", "recovery"],
    difficultyTier: "intro",
    cautionTags: ["ankle"],
    traitTags: ["lower_body", "running_support"],
    preferenceTags: ["bodyweight", "shin", "running prep"],
    sets: 2,
    reps: "12-15",
    rest: "45 sec",
    coachingNote: "Lift the toes toward the shins without bouncing."
  },
  {
    id: "hip-flexor-rockback",
    name: "Hip flexor rockback",
    category: "mobility",
    movementPattern: "mobility",
    equipmentTags: ["Bodyweight"],
    goalTags: ["recovery", "general_fitness", "running", "sport_performance", "consistency"],
    difficultyTier: "intro",
    cautionTags: [],
    traitTags: ["mobility", "low_load"],
    preferenceTags: ["bodyweight", "mobility", "hips"],
    sets: 2,
    reps: "8 each side",
    rest: "30 sec",
    coachingNote: "Move gently and stay out of sharp pain.",
    videoUrl: "https://www.youtube.com/watch?v=YQmpO9VT2X4"
  },
  {
    id: "thoracic-rotation",
    name: "Thoracic rotation",
    category: "mobility",
    movementPattern: "mobility",
    equipmentTags: ["Bodyweight"],
    goalTags: ["recovery", "general_fitness", "sport_performance", "consistency"],
    difficultyTier: "intro",
    cautionTags: [],
    traitTags: ["mobility", "upper_body"],
    preferenceTags: ["bodyweight", "mobility", "upper back"],
    sets: 2,
    reps: "6 each side",
    rest: "30 sec",
    coachingNote: "Rotate through the upper back and keep the movement easy."
  },
  {
    id: "ankle-rock",
    name: "Ankle rock",
    category: "mobility",
    movementPattern: "mobility",
    equipmentTags: ["Bodyweight"],
    goalTags: ["recovery", "running", "sport_performance"],
    difficultyTier: "intro",
    cautionTags: ["ankle"],
    traitTags: ["mobility", "running_support"],
    preferenceTags: ["bodyweight", "mobility", "ankle", "running prep"],
    sets: 2,
    reps: "8 each side",
    rest: "30 sec",
    coachingNote: "Move through a comfortable ankle range without forcing it."
  },
  {
    id: "brisk-walk",
    name: "Brisk walk",
    category: "cardio",
    movementPattern: "walk",
    equipmentTags: ["Bodyweight"],
    goalTags: ["recovery", "general_fitness", "consistency", "running"],
    difficultyTier: "intro",
    cautionTags: [],
    traitTags: ["cardio", "low_setup", "low_impact"],
    preferenceTags: ["cardio", "walking", "outdoors", "bodyweight"],
    sets: 1,
    reps: "10-20 min",
    rest: "As needed",
    coachingNote: "Keep the pace conversational and stop if symptoms spike."
  },
  {
    id: "low-impact-cardio-march",
    name: "Low-impact cardio march",
    category: "cardio",
    movementPattern: "walk",
    equipmentTags: ["Bodyweight"],
    goalTags: ["general_fitness", "consistency", "recovery"],
    difficultyTier: "intro",
    cautionTags: [],
    traitTags: ["cardio", "low_setup", "low_impact"],
    preferenceTags: ["cardio", "bodyweight", "home"],
    sets: 3,
    reps: "2 min",
    rest: "60 sec",
    coachingNote: "March tall and keep the effort easy to moderate."
  },
  {
    id: "run-walk-intervals",
    name: "Run/walk intervals",
    category: "cardio",
    movementPattern: "run",
    equipmentTags: ["Bodyweight"],
    goalTags: ["running"],
    difficultyTier: "intro",
    cautionTags: ["impact", "knee", "ankle"],
    traitTags: ["running", "interval", "cardio"],
    preferenceTags: ["running", "cardio", "outdoors"],
    sets: 6,
    reps: "1 min easy run / 2 min walk",
    rest: "Walk recoveries",
    coachingNote: "Keep the run portions easy enough to finish with control."
  },
  {
    id: "easy-run",
    name: "Easy run",
    category: "cardio",
    movementPattern: "run",
    equipmentTags: ["Bodyweight"],
    goalTags: ["running"],
    difficultyTier: "foundation",
    cautionTags: ["impact", "knee", "ankle"],
    traitTags: ["running", "cardio"],
    preferenceTags: ["running", "cardio", "outdoors"],
    sets: 1,
    reps: "15-25 min easy",
    rest: "As needed",
    coachingNote: "Stay at a conversational pace and finish feeling like you could do more."
  },
  {
    id: "stride-drills",
    name: "Stride drills",
    category: "running_prep",
    movementPattern: "run",
    equipmentTags: ["Bodyweight"],
    goalTags: ["running", "sport_performance"],
    difficultyTier: "foundation",
    cautionTags: ["impact", "knee", "ankle", "hamstring"],
    traitTags: ["running", "speed", "athletic"],
    preferenceTags: ["running", "cardio", "sport"],
    sets: 4,
    reps: "15 sec relaxed stride",
    rest: "60-90 sec walk",
    coachingNote: "Keep these smooth, relaxed, and well below sprint effort."
  },
  {
    id: "lateral-lunge",
    name: "Lateral lunge",
    category: "athletic",
    movementPattern: "lateral",
    equipmentTags: ["Bodyweight", "Dumbbells"],
    goalTags: ["sport_performance", "general_fitness", "strength"],
    difficultyTier: "foundation",
    cautionTags: ["knee"],
    traitTags: ["unilateral", "lateral", "athletic"],
    preferenceTags: ["sport", "lateral", "lower body"],
    sets: 3,
    reps: "8 each side",
    rest: "75 sec",
    coachingNote: "Shift side to side without letting the knee cave inward."
  },
  {
    id: "lateral-shuffle",
    name: "Lateral shuffle",
    category: "athletic",
    movementPattern: "lateral",
    equipmentTags: ["Bodyweight"],
    goalTags: ["sport_performance"],
    difficultyTier: "foundation",
    cautionTags: ["knee", "ankle", "impact"],
    traitTags: ["lateral", "athletic", "cardio"],
    preferenceTags: ["sport", "lateral", "agility"],
    sets: 4,
    reps: "10-15 sec",
    rest: "45 sec",
    coachingNote: "Stay low and controlled rather than chasing speed."
  },
  {
    id: "skater-hop",
    name: "Skater hop",
    category: "athletic",
    movementPattern: "power",
    equipmentTags: ["Bodyweight"],
    goalTags: ["sport_performance"],
    difficultyTier: "intermediate",
    cautionTags: ["knee", "ankle", "impact"],
    traitTags: ["unilateral", "lateral", "power", "athletic"],
    preferenceTags: ["sport", "lateral", "jumping", "power"],
    sets: 3,
    reps: "5 each side",
    rest: "75 sec",
    coachingNote: "Land softly and keep every rep crisp."
  }
];

export function getCatalogExercise(id: string) {
  return exerciseCatalog.find((exercise) => exercise.id === id);
}

export function toPlanExercise(item: ExerciseCatalogItem): StructuredExerciseInput {
  return {
    sourceExerciseId: item.id,
    name: item.name,
    sets: item.sets,
    reps: item.reps,
    rest: item.rest,
    coachingNote: item.coachingNote,
    videoUrl: item.videoUrl
  };
}
