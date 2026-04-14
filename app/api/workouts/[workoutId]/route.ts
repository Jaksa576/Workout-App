import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ workoutId: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workoutId } = await params;
  const supabase = await getSupabaseServerClient();
  const { data: workout, error: workoutError } = await supabase
    .from("workout_templates")
    .select("id, phase_id, name")
    .eq("id", workoutId)
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

  const { data: phaseWorkouts, error: phaseWorkoutsError } = await supabase
    .from("workout_templates")
    .select("id")
    .eq("phase_id", phase.id);

  if (phaseWorkoutsError) {
    return NextResponse.json({ error: phaseWorkoutsError.message }, { status: 500 });
  }

  if (!phaseWorkouts || phaseWorkouts.length <= 1) {
    return NextResponse.json(
      { error: "A block needs at least one workout." },
      { status: 400 }
    );
  }

  const { error: snapshotError } = await supabase
    .from("workout_sessions")
    .update({ workout_name_snapshot: workout.name })
    .eq("user_id", user.id)
    .eq("workout_template_id", workout.id);

  if (snapshotError) {
    return NextResponse.json({ error: snapshotError.message }, { status: 500 });
  }

  const { error: deleteError } = await supabase
    .from("workout_templates")
    .delete()
    .eq("id", workout.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ status: "deleted" });
}
