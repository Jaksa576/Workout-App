import { getSupabaseServerClient } from "@/lib/supabase-server";
import { selectDefaultProgressionMode } from "@/lib/progression-mode";
import type {
  PlanFormInput,
  StructuredExerciseInput,
  StructuredPhaseInput,
  StructuredPlanInput,
  StructuredWorkoutInput,
  Weekday
} from "@/lib/types";
import { normalizeExerciseVideoUrl } from "@/lib/validation";

type SupabaseServerClient = Awaited<ReturnType<typeof getSupabaseServerClient>>;

const weekdayLabels: Record<Weekday, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun"
};

function getPresetSummary(phase: StructuredPhaseInput) {
  const sessions = phase.advancementSettings.sessions ?? 4;
  const weeks = phase.advancementSettings.weeks ?? 2;
  const painFlags = phase.deloadSettings.painFlags ?? 2;
  const days = phase.deloadSettings.days ?? 7;

  return {
    advanceCriteria:
      phase.advancementPreset === "clean_sessions_streak"
        ? `Complete ${sessions} clean sessions in a row with no pain flags.`
        : `Complete ${sessions} clean sessions over ${weeks} weeks with no pain flags.`,
    deloadCriteria:
      phase.deloadPreset === "too_hard_streak"
        ? `Pause if ${phase.deloadSettings.sessions ?? 2} workouts in a row feel too hard.`
        : `Pause if ${painFlags} pain flags happen within ${days} days.`
  };
}

export function formatWeeklySchedule(days: Weekday[]) {
  return days.length ? days.map((day) => weekdayLabels[day]).join(" / ") : "Flexible schedule";
}

export function legacyPlanToStructured(input: PlanFormInput): StructuredPlanInput {
  return {
    version: "structured-v1",
    name: input.name,
    description: input.description,
    weeklySchedule: [],
    phases: [
      {
        goal: input.phaseGoal,
        advancementPreset: "clean_sessions_in_window",
        advancementSettings: { sessions: 4, weeks: 2 },
        deloadPreset: "pain_flags_in_window",
        deloadSettings: { painFlags: 2, days: 7 },
        workouts: [
          {
            name: input.workoutName,
            focus: input.workoutFocus,
            summary: input.workoutSummary,
            scheduledDays: [],
            exercises: input.exercises
          }
        ]
      }
    ]
  };
}

function validateExercise(exercise: StructuredExerciseInput) {
  const videoUrl = normalizeExerciseVideoUrl(exercise.videoUrl ?? "");

  if (videoUrl === null) {
    throw new Error("Use a YouTube link for exercise videos, or leave the field blank.");
  }

  if (!exercise.name.trim() || !exercise.reps.trim() || !exercise.rest.trim()) {
    throw new Error("Each workout needs exercises with a name, reps, and rest.");
  }

  if (!Number.isInteger(exercise.sets) || exercise.sets < 1) {
    throw new Error("Exercise sets must be a whole number greater than zero.");
  }

  return {
    name: exercise.name.trim(),
    sets: exercise.sets,
    reps: exercise.reps.trim(),
    rest: exercise.rest.trim(),
    coachingNote: exercise.coachingNote.trim(),
    videoUrl,
    sourceExerciseId: exercise.sourceExerciseId?.trim() || null
  };
}

function validateWorkout(workout: StructuredWorkoutInput) {
  const exercises = workout.exercises.map(validateExercise);

  if (!workout.name.trim()) {
    throw new Error("Each phase needs at least one named workout.");
  }

  if (exercises.length === 0) {
    throw new Error("Each workout needs at least one exercise.");
  }

  return {
    name: workout.name.trim(),
    focus: workout.focus.trim() || "General focus",
    summary: workout.summary.trim(),
    scheduledDays: workout.scheduledDays,
    exercises
  };
}

function validatePhase(phase: StructuredPhaseInput) {
  const workouts = phase.workouts.map(validateWorkout);

  if (!phase.goal.trim()) {
    throw new Error("Each phase needs a clear goal.");
  }

  return {
    ...phase,
    goal: phase.goal.trim(),
    workouts
  };
}

export async function createStructuredPlanForUser({
  supabase,
  userId,
  input
}: {
  supabase: SupabaseServerClient;
  userId: string;
  input: StructuredPlanInput;
}) {
  const phases = input.phases.map(validatePhase);

  if (!input.name.trim()) {
    throw new Error("Plan name is required.");
  }

  const { data: existingPlans } = await supabase
    .from("workout_plans")
    .select("id, is_active")
    .eq("user_id", userId)
    .eq("is_active", true)
    .is("archived_at", null)
    .limit(1);

  const hasExistingActivePlan = Boolean(existingPlans?.some((plan) => plan.is_active));
  const progressionMode =
    input.progressionMode ?? selectDefaultProgressionMode(input.goalType ?? null);

  const { data: plan, error: planError } = await supabase
    .from("workout_plans")
    .insert({
      user_id: userId,
      name: input.name.trim(),
      description: input.description.trim(),
      goal_type: input.goalType ?? null,
      progression_mode: progressionMode,
      creation_source: input.creationSource ?? "manual",
      schedule_summary: formatWeeklySchedule(input.weeklySchedule),
      weekly_schedule: input.weeklySchedule,
      is_active: !hasExistingActivePlan
    })
    .select("id")
    .single();

  if (planError || !plan) {
    throw new Error(planError?.message ?? "Unable to create plan.");
  }

  let firstPhaseId: string | null = null;

  for (const [phaseIndex, phaseInput] of phases.entries()) {
    const criteria = getPresetSummary(phaseInput);
    const { data: phase, error: phaseError } = await supabase
      .from("plan_phases")
      .insert({
        plan_id: plan.id,
        phase_number: phaseIndex + 1,
        goal: phaseInput.goal,
        advance_criteria: criteria.advanceCriteria,
        deload_criteria: criteria.deloadCriteria,
        advancement_preset: phaseInput.advancementPreset,
        advancement_settings: phaseInput.advancementSettings,
        deload_preset: phaseInput.deloadPreset,
        deload_settings: phaseInput.deloadSettings
      })
      .select("id")
      .single();

    if (phaseError || !phase) {
      throw new Error(phaseError?.message ?? "Unable to create phase.");
    }

    firstPhaseId ??= phase.id;

    for (const [workoutIndex, workoutInput] of phaseInput.workouts.entries()) {
      const { data: workout, error: workoutError } = await supabase
        .from("workout_templates")
        .insert({
          phase_id: phase.id,
          name: workoutInput.name,
          focus: workoutInput.focus,
          summary: workoutInput.summary,
          day_order: workoutIndex + 1,
          scheduled_days: workoutInput.scheduledDays
        })
        .select("id")
        .single();

      if (workoutError || !workout) {
        throw new Error(workoutError?.message ?? "Unable to create workout.");
      }

      const { error: exercisesError } = await supabase.from("exercise_entries").insert(
        workoutInput.exercises.map((exercise, exerciseIndex) => ({
          workout_template_id: workout.id,
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          rest: exercise.rest,
          coaching_note: exercise.coachingNote,
          video_url: exercise.videoUrl || null,
          source_exercise_id: exercise.sourceExerciseId,
          sort_order: exerciseIndex + 1
        }))
      );

      if (exercisesError) {
        throw new Error(exercisesError.message ?? "Unable to create exercises.");
      }
    }
  }

  if (firstPhaseId) {
    const { error: currentPhaseError } = await supabase
      .from("workout_plans")
      .update({ current_phase_id: firstPhaseId })
      .eq("id", plan.id);

    if (currentPhaseError) {
      throw new Error(currentPhaseError.message ?? "Unable to activate phase.");
    }
  }

  return { id: plan.id };
}
