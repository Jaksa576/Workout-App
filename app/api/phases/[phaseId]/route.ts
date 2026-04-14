import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ phaseId: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { phaseId } = await params;
  const supabase = await getSupabaseServerClient();
  const { data: phase, error: phaseError } = await supabase
    .from("plan_phases")
    .select("id, plan_id, phase_number")
    .eq("id", phaseId)
    .maybeSingle();

  if (phaseError) {
    return NextResponse.json({ error: phaseError.message }, { status: 500 });
  }

  if (!phase) {
    return NextResponse.json({ error: "Block not found." }, { status: 404 });
  }

  const { data: plan, error: planError } = await supabase
    .from("workout_plans")
    .select("id, current_phase_id")
    .eq("id", phase.plan_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (planError) {
    return NextResponse.json({ error: planError.message }, { status: 500 });
  }

  if (!plan) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  const { data: phases, error: phasesError } = await supabase
    .from("plan_phases")
    .select("id, phase_number")
    .eq("plan_id", plan.id)
    .order("phase_number", { ascending: true });

  if (phasesError) {
    return NextResponse.json({ error: phasesError.message }, { status: 500 });
  }

  if (!phases || phases.length <= 1) {
    return NextResponse.json(
      { error: "A plan needs at least one block." },
      { status: 400 }
    );
  }

  if (plan.current_phase_id === phase.id) {
    const targetPhase =
      phases.find((item) => item.phase_number > phase.phase_number && item.id !== phase.id) ??
      phases
        .slice()
        .reverse()
        .find((item) => item.phase_number < phase.phase_number && item.id !== phase.id);

    const { error: updatePlanError } = await supabase
      .from("workout_plans")
      .update({ current_phase_id: targetPhase?.id ?? null })
      .eq("id", plan.id)
      .eq("user_id", user.id);

    if (updatePlanError) {
      return NextResponse.json({ error: updatePlanError.message }, { status: 500 });
    }
  }

  const { error } = await supabase.from("plan_phases").delete().eq("id", phase.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "deleted" });
}
