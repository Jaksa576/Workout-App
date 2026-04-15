import type { StructuredPlanInput, WorkoutPlan } from "@/lib/types";

export function savedPlanToStructuredPlanInput(plan: WorkoutPlan): StructuredPlanInput {
  const phases = (plan.phases.length ? plan.phases : [plan.currentPhase])
    .slice()
    .sort((a, b) => a.phaseNumber - b.phaseNumber)
    .map((phase) => ({
      goal: phase.goal,
      advancementPreset: phase.advancementPreset,
      advancementSettings: phase.advancementSettings,
      deloadPreset: phase.deloadPreset,
      deloadSettings: phase.deloadSettings,
      workouts: plan.workouts
        .filter((workout) => workout.phaseId === phase.id)
        .map((workout) => ({
          name: workout.name,
          focus: workout.focus,
          summary: workout.summary,
          scheduledDays: workout.scheduledDays,
          exercises: workout.exercises.map((exercise) => ({
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            rest: exercise.rest,
            coachingNote: exercise.coachingNote,
            videoUrl: exercise.videoUrl,
            sourceExerciseId: exercise.sourceExerciseId ?? null
          }))
        }))
    }));

  return {
    version: "structured-v1",
    name: plan.name,
    description: plan.description,
    goalType: plan.goalType ?? null,
    progressionMode: plan.progressionMode ?? null,
    creationSource: plan.creationSource ?? undefined,
    weeklySchedule: plan.weeklySchedule,
    phases
  };
}
