import Link from "next/link";
import { SectionCard } from "@/components/section-card";
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
    return (
      <div className="space-y-6">
        <SectionCard
          title="No workout ready yet"
          eyebrow="Workout"
          description="Create a plan first, then your workouts will appear here."
        >
          <Link
            href="/plans/new"
            className="inline-flex rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white"
          >
            Create Plan
          </Link>
        </SectionCard>
      </div>
    );
  }

  return (
    <WorkoutFlow
      workouts={data.workouts}
      selectedWorkout={data.selectedWorkout}
      initialStep={step === "check-in" ? "check-in" : "workout"}
      recentSessions={data.recentSessions}
      progressSummary={data.progressSummary}
    />
  );
}
