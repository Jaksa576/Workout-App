import { getTodayWorkout, getWorkoutById } from "@/lib/data";
import { CheckInForm } from "@/components/check-in-form";
import { SectionCard } from "@/components/section-card";

export default async function CheckInPage({
  searchParams
}: {
  searchParams: Promise<{ workoutId?: string }>;
}) {
  const { workoutId } = await searchParams;
  const workout = workoutId ? await getWorkoutById(workoutId) : await getTodayWorkout();

  if (!workout) {
    return (
      <SectionCard
        title="No workout selected"
        eyebrow="Workout Check-In"
        description="Choose a workout first so your check-in is saved in the right place."
      >
        <p className="text-sm leading-6 text-slate">
          Start today&apos;s workout, check off the exercises you completed, then
          come back here to finish the session.
        </p>
      </SectionCard>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section>
        <p className="text-sm uppercase tracking-[0.24em] text-slate">
          Workout Check-In
        </p>
        <h1 className="mt-2 font-display text-4xl text-ink">
          Capture what happened while it&apos;s still fresh.
        </h1>
      </section>

      <SectionCard
        title="How did it go?"
        eyebrow="Required"
        description="Pain and difficulty help decide whether to progress, repeat, or take a lighter day."
      >
        <CheckInForm workout={workout} />
      </SectionCard>
    </div>
  );
}
