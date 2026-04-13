import type { StructuredExerciseInput } from "@/lib/types";

export type ExerciseCategory =
  | "mobility"
  | "lower_body"
  | "upper_body"
  | "core"
  | "running_prep"
  | "rehab";

export type ExerciseCatalogItem = StructuredExerciseInput & {
  id: string;
  category: ExerciseCategory;
  equipmentTags: string[];
};

export const exerciseCategories: Array<{ value: ExerciseCategory; label: string }> = [
  { value: "mobility", label: "Mobility" },
  { value: "lower_body", label: "Lower body" },
  { value: "upper_body", label: "Upper body" },
  { value: "core", label: "Core" },
  { value: "running_prep", label: "Running prep" },
  { value: "rehab", label: "Rehab" }
];

export const exerciseCatalog: ExerciseCatalogItem[] = [
  {
    id: "bodyweight-squat",
    name: "Bodyweight squat",
    category: "lower_body",
    equipmentTags: ["Bodyweight"],
    sets: 3,
    reps: "8-10",
    rest: "60 sec",
    coachingNote: "Keep your ribs stacked and move through a comfortable range.",
    videoUrl: "https://www.youtube.com/watch?v=aclHkVaku9U"
  },
  {
    id: "goblet-squat",
    name: "Goblet squat",
    category: "lower_body",
    equipmentTags: ["Dumbbells", "Kettlebell"],
    sets: 3,
    reps: "8-10",
    rest: "90 sec",
    coachingNote: "Hold the weight close and keep your knees tracking over your toes.",
    videoUrl: "https://www.youtube.com/watch?v=MeIiIdhvXT4"
  },
  {
    id: "romanian-deadlift",
    name: "Romanian deadlift",
    category: "lower_body",
    equipmentTags: ["Dumbbells", "Barbell"],
    sets: 3,
    reps: "8",
    rest: "90 sec",
    coachingNote: "Hinge at the hips and keep the weights close to your legs.",
    videoUrl: "https://www.youtube.com/watch?v=JCXUYuzwNrM"
  },
  {
    id: "glute-bridge",
    name: "Glute bridge",
    category: "rehab",
    equipmentTags: ["Bodyweight", "Bands"],
    sets: 3,
    reps: "10-12",
    rest: "60 sec",
    coachingNote: "Pause at the top and keep your low back quiet.",
    videoUrl: "https://www.youtube.com/watch?v=wPM8icPu6H8"
  },
  {
    id: "dead-bug",
    name: "Dead bug",
    category: "core",
    equipmentTags: ["Bodyweight"],
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
    equipmentTags: ["Bodyweight"],
    sets: 2,
    reps: "20-30 sec each side",
    rest: "45 sec",
    coachingNote: "Keep a straight line from shoulder to ankle.",
    videoUrl: "https://www.youtube.com/watch?v=K2VljzCC16g"
  },
  {
    id: "incline-push-up",
    name: "Incline push-up",
    category: "upper_body",
    equipmentTags: ["Bodyweight", "Bench"],
    sets: 3,
    reps: "8-12",
    rest: "60 sec",
    coachingNote: "Use a height that lets you control every rep.",
    videoUrl: "https://www.youtube.com/watch?v=Z0bRiVhnO8Q"
  },
  {
    id: "band-row",
    name: "Band row",
    category: "upper_body",
    equipmentTags: ["Bands"],
    sets: 3,
    reps: "10-12",
    rest: "60 sec",
    coachingNote: "Pull your elbows back and keep your shoulders relaxed.",
    videoUrl: "https://www.youtube.com/watch?v=GZbfZ033f74"
  },
  {
    id: "walking-lunge",
    name: "Walking lunge",
    category: "running_prep",
    equipmentTags: ["Bodyweight", "Dumbbells"],
    sets: 2,
    reps: "8 each side",
    rest: "75 sec",
    coachingNote: "Step smoothly and keep the front foot grounded.",
    videoUrl: "https://www.youtube.com/watch?v=L8fvypPrzzs"
  },
  {
    id: "calf-raise",
    name: "Calf raise",
    category: "running_prep",
    equipmentTags: ["Bodyweight", "Dumbbells"],
    sets: 3,
    reps: "12-15",
    rest: "45 sec",
    coachingNote: "Rise with control and lower slowly.",
    videoUrl: "https://www.youtube.com/watch?v=YMmgqO8Jo-k"
  },
  {
    id: "hip-flexor-rockback",
    name: "Hip flexor rockback",
    category: "mobility",
    equipmentTags: ["Bodyweight"],
    sets: 2,
    reps: "8 each side",
    rest: "30 sec",
    coachingNote: "Move gently and stay out of sharp pain.",
    videoUrl: "https://www.youtube.com/watch?v=YQmpO9VT2X4"
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
