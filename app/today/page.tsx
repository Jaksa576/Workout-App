import { TimerCard } from "@/components/timer-card";
import { WorkoutChecklist } from "@/components/workout-checklist";
import { SectionCard } from "@/components/section-card";
import { getTodayWorkout } from "@/lib/data";

export default async function TodayPage() {
  const workout = await getTodayWorkout();

  if (!workout) {
    return (
      <SectionCard
        title="No workout scheduled yet"
        eyebrow="Today"
        description="Create a plan first, then today&apos;s workout will appear here."
      >
        <p className="text-sm leading-6 text-slate">
          Start with one repeatable workout and a simple weekly schedule.
        </p>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate">
            Today&apos;s Workout
          </p>
          <h1 className="mt-2 font-display text-4xl text-ink">
            {workout.name}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate">
            {workout.summary}
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Exercises"
          eyebrow={workout.focus}
          description="Check off each exercise as you go, then log how the session felt."
        >
          <div className="space-y-5">
            <WorkoutChecklist
              workout={workout}
              storageKey={`workout-checklist:${workout.id}`}
            />
            <a
              href={`/check-in?workoutId=${workout.id}`}
              className="inline-flex rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white"
            >
              Finish Workout
            </a>
          </div>
        </SectionCard>
        <TimerCard />
      </section>
    </div>
  );
}
