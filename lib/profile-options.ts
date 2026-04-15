import type {
  ActivityLevel,
  TrainingEnvironment,
  TrainingExperience,
  Weekday
} from "@/lib/types";

export const limitationAreas = ["Knee", "Hamstring", "Back", "Shoulder", "Ankle", "None right now"];

export const equipmentOptions = ["Bodyweight", "Dumbbells", "Bands", "Kettlebell", "Barbell", "Bench"];

export const exercisePreferenceOptions = [
  "Strength training",
  "Mobility",
  "Running",
  "Low-impact",
  "Bodyweight",
  "Short sessions"
];

export const exerciseDislikeOptions = [
  "Jumping",
  "Running",
  "Overhead work",
  "Barbell lifts",
  "Floor exercises",
  "High-impact work"
];

export const sportsInterestOptions = [
  "Running",
  "Cycling",
  "Basketball",
  "Soccer",
  "Tennis",
  "Hiking",
  "Pickleball",
  "General athletics"
];

export const trainingExperienceOptions: Array<{ value: TrainingExperience; label: string }> = [
  { value: "new", label: "New to training" },
  { value: "returning", label: "Returning after time away" },
  { value: "intermediate", label: "Training regularly" },
  { value: "advanced", label: "Advanced or competitive" }
];

export const activityLevelOptions: Array<{ value: ActivityLevel; label: string }> = [
  { value: "mostly_sedentary", label: "Mostly sedentary" },
  { value: "lightly_active", label: "Lightly active" },
  { value: "moderately_active", label: "Moderately active" },
  { value: "very_active", label: "Very active" }
];

export const trainingEnvironmentOptions: Array<{ value: TrainingEnvironment; label: string }> = [
  { value: "home", label: "Home" },
  { value: "gym", label: "Gym" },
  { value: "outdoors", label: "Outdoors" },
  { value: "mixed", label: "Mixed" }
];

export const weekdays: Array<{ value: Weekday; label: string }> = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" }
];

export const sessionLengths = [30, 45, 60, 75];
