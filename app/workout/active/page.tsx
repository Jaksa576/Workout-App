import { redirect } from "next/navigation";
import type { Route } from "next";
import { WorkoutFlow } from "@/components/workout-flow";
import { getWorkoutPageData } from "@/lib/data";

export default async function ActiveWorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ workoutId?: string }>;
}) {
  const { workoutId } = await searchParams;
  const data = await getWorkoutPageData(workoutId);

  if (!data.activePlan || !data.selectedWorkout) {
    redirect("/plans/new" as Route);
  }

  return (
    <WorkoutFlow
      mode="active"
      workouts={data.activePhaseWorkouts}
      activePlan={data.activePlan}
      recommendedWorkout={data.recommendedWorkout}
      selectedWorkout={data.selectedWorkout}
      initialStep="workout"
      recentSessions={data.recentSessions}
      progressSummary={data.progressSummary}
      phaseProgress={data.phaseProgress}
      userId={data.userId}
      defaultRestSeconds={data.defaultRestSeconds}
      timeZone={data.timeZone}
    />
  );
}
