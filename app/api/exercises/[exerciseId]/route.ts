import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ exerciseId: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { exerciseId } = await params;
  const supabase = await getSupabaseServerClient();
  const { data: exercise, error: exerciseError } = await supabase
    .from("exercise_entries")
    .select("id, workout_template_id, name")
    .eq("id", exerciseId)
    .maybeSingle();

  if (exerciseError) {
    return NextResponse.json({ error: exerciseError.message }, { status: 500 });
  }

  if (!exercise) {
    return NextResponse.json({ error: "Exercise not found." }, { status: 404 });
  }

  const { data: workout, error: workoutError } = await supabase
    .from("workout_templates")
    .select("id, phase_id")
    .eq("id", exercise.workout_template_id)
    .maybeSingle();

  if (workoutError) {
    return NextResponse.json({ error: workoutError.message }, { status: 500 });
  }

  if (!workout) {
    return NextResponse.json({ error: "Workout not found." }, { status: 404 });
  }

  const { data: phase, error: phaseError } = await supabase
    .from("plan_phases")
    .select("id, plan_id")
    .eq("id", workout.phase_id)
    .maybeSingle();

  if (phaseError) {
    return NextResponse.json({ error: phaseError.message }, { status: 500 });
  }

  if (!phase) {
    return NextResponse.json({ error: "Block not found." }, { status: 404 });
  }

  const { data: plan, error: planError } = await supabase
    .from("workout_plans")
    .select("id")
    .eq("id", phase.plan_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (planError) {
    return NextResponse.json({ error: planError.message }, { status: 500 });
  }

  if (!plan) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  const { data: workoutExercises, error: workoutExercisesError } = await supabase
    .from("exercise_entries")
    .select("id")
    .eq("workout_template_id", workout.id);

  if (workoutExercisesError) {
    return NextResponse.json({ error: workoutExercisesError.message }, { status: 500 });
  }

  if (!workoutExercises || workoutExercises.length <= 1) {
    return NextResponse.json(
      { error: "A workout needs at least one exercise." },
      { status: 400 }
    );
  }

  const { error: snapshotError } = await supabase
    .from("exercise_results")
    .update({ exercise_name_snapshot: exercise.name })
    .eq("exercise_entry_id", exercise.id);

  if (snapshotError) {
    return NextResponse.json({ error: snapshotError.message }, { status: 500 });
  }

  const { error: deleteError } = await supabase
    .from("exercise_entries")
    .delete()
    .eq("id", exercise.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ status: "deleted" });
}
