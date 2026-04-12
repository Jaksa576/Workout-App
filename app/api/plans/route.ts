import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { PlanFormInput } from "@/lib/types";

function isPlanFormInput(value: unknown): value is PlanFormInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const input = value as Partial<PlanFormInput>;

  return (
    typeof input.name === "string" &&
    typeof input.description === "string" &&
    typeof input.scheduleSummary === "string" &&
    typeof input.phaseGoal === "string" &&
    typeof input.advanceCriteria === "string" &&
    typeof input.deloadCriteria === "string" &&
    typeof input.workoutName === "string" &&
    typeof input.workoutFocus === "string" &&
    typeof input.workoutSummary === "string" &&
    Array.isArray(input.exercises)
  );
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!isPlanFormInput(body)) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.name.trim() || !body.phaseGoal.trim() || !body.workoutName.trim()) {
    return NextResponse.json(
      { error: "Plan, phase, and workout names are required." },
      { status: 400 }
    );
  }

  const validExercises = body.exercises.filter(
    (exercise) => exercise.name.trim() && exercise.reps.trim() && exercise.rest.trim()
  );

  if (validExercises.length === 0) {
    return NextResponse.json(
      { error: "At least one complete exercise is required." },
      { status: 400 }
    );
  }

  const supabase = await getSupabaseServerClient();
  const { data: existingPlans } = await supabase
    .from("workout_plans")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  const isFirstPlan = !existingPlans || existingPlans.length === 0;

  const { data: plan, error: planError } = await supabase
    .from("workout_plans")
    .insert({
      user_id: user.id,
      name: body.name.trim(),
      description: body.description.trim(),
      schedule_summary: body.scheduleSummary.trim(),
      is_active: isFirstPlan
    })
    .select("id")
    .single();

  if (planError || !plan) {
    return NextResponse.json(
      { error: planError?.message ?? "Unable to create plan." },
      { status: 500 }
    );
  }

  const { data: phase, error: phaseError } = await supabase
    .from("plan_phases")
    .insert({
      plan_id: plan.id,
      phase_number: 1,
      goal: body.phaseGoal.trim(),
      advance_criteria: body.advanceCriteria.trim(),
      deload_criteria: body.deloadCriteria.trim()
    })
    .select("id")
    .single();

  if (phaseError || !phase) {
    return NextResponse.json(
      { error: phaseError?.message ?? "Unable to create phase." },
      { status: 500 }
    );
  }

  const { data: workout, error: workoutError } = await supabase
    .from("workout_templates")
    .insert({
      phase_id: phase.id,
      name: body.workoutName.trim(),
      focus: body.workoutFocus.trim() || "General focus",
      summary: body.workoutSummary.trim(),
      day_order: 1
    })
    .select("id")
    .single();

  if (workoutError || !workout) {
    return NextResponse.json(
      { error: workoutError?.message ?? "Unable to create workout." },
      { status: 500 }
    );
  }

  const { error: exercisesError } = await supabase.from("exercise_entries").insert(
    validExercises.map((exercise, index) => ({
      workout_template_id: workout.id,
      name: exercise.name.trim(),
      sets: exercise.sets,
      reps: exercise.reps.trim(),
      rest: exercise.rest.trim(),
      coaching_note: exercise.coachingNote.trim(),
      video_url: exercise.videoUrl?.trim() || null,
      sort_order: index + 1
    }))
  );

  if (exercisesError) {
    return NextResponse.json(
      { error: exercisesError.message ?? "Unable to create exercises." },
      { status: 500 }
    );
  }

  const { error: currentPhaseError } = await supabase
    .from("workout_plans")
    .update({ current_phase_id: phase.id })
    .eq("id", plan.id);

  if (currentPhaseError) {
    return NextResponse.json(
      { error: currentPhaseError.message ?? "Unable to activate phase." },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: plan.id });
}
