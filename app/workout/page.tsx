import { redirect } from "next/navigation";
import type { Route } from "next";
import { WorkoutFlow } from "@/components/workout-flow";
import { getWorkoutPageData } from "@/lib/data";

export default async function WorkoutPage({
  searchParams
}: {
  searchParams: Promise<{ workoutId?: string; step?: string }>;
}) {
  const { workoutId, step } = await searchParams;
  const data = await getWorkoutPageData(workoutId);

  if (!data.activePlan || !data.selectedWorkout) {
    redirect("/plans/new" as Route);
  }

  return (
    <WorkoutFlow
      workouts={data.activePhaseWorkouts}
      activePlan={data.activePlan}
      recommendedWorkout={data.recommendedWorkout}
      selectedWorkout={data.selectedWorkout}
      initialStep={step === "check-in" ? "check-in" : "workout"}
      recentSessions={data.recentSessions}
      progressSummary={data.progressSummary}
      phaseProgress={data.phaseProgress}
    />
  );
}
