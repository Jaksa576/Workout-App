import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPlans } from "@/lib/data";
import { calculatePhaseProgress } from "@/lib/progression";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const actions = ["advance", "force_advance", "return_previous", "complete_plan"] as const;
type PhaseAction = (typeof actions)[number];

function isPhaseAction(value: unknown): value is PhaseAction {
  return typeof value === "string" && actions.includes(value as PhaseAction);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { planId } = await params;
  const body = (await request.json()) as { action?: unknown };

  if (!isPhaseAction(body.action)) {
    return NextResponse.json({ error: "Choose a valid block action." }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();
  const plans = await getPlans();
  const plan = plans.find((item) => item.id === planId);

  if (!plan) {
    return NextResponse.json(
      { error: "This plan is not available for your account." },
      { status: 404 }
    );
  }

  const workoutIds = plan.workouts.map((workout) => workout.id);
  const { data: sessions, error: sessionsError } = workoutIds.length
    ? await supabase
        .from("workout_sessions")
        .select("id, workout_template_id, workout_name_snapshot, created_at, completed_on, completed, pain_occurred, perceived_difficulty, notes, recommendation, phase_id_at_completion, progression_decision, progression_reason")
        .eq("user_id", user.id)
        .in("workout_template_id", workoutIds)
        .order("completed_on", { ascending: false })
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (sessionsError) {
    return NextResponse.json({ error: sessionsError.message }, { status: 500 });
  }

  const phaseProgress = calculatePhaseProgress({
    plan,
    currentPhase: plan.currentPhase,
    sessions: (sessions ?? []).map((session) => ({
      id: session.id,
      workoutTemplateId: session.workout_template_id,
      workoutNameSnapshot: session.workout_name_snapshot,
      createdAt: session.created_at,
      completedOn: session.completed_on,
      completed: session.completed,
      painOccurred: session.pain_occurred,
      perceivedDifficulty: session.perceived_difficulty,
      notes: session.notes,
      recommendation: session.recommendation,
      phaseIdAtCompletion: session.phase_id_at_completion,
      progressionDecision: session.progression_decision,
      progressionReason: session.progression_reason
    }))
  });

  const nextPhaseId =
    body.action === "advance" || body.action === "force_advance"
      ? phaseProgress.nextPhaseId
      : null;
  const previousPhaseId =
    body.action === "return_previous" ? phaseProgress.previousPhaseId : null;

  if ((body.action === "advance" || body.action === "force_advance") && !nextPhaseId) {
    return NextResponse.json({ error: "There is no next block for this plan." }, { status: 400 });
  }

  if (body.action === "return_previous" && !previousPhaseId) {
    return NextResponse.json({ error: "There is no previous block for this plan." }, { status: 400 });
  }

  if (body.action === "complete_plan") {
    if (!phaseProgress.canComplete) {
      return NextResponse.json(
        { error: "Finish the final block criteria before marking this plan complete." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("workout_plans")
      .update({ completed_at: new Date().toISOString(), is_active: false })
      .eq("id", plan.id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: "completed" });
  }

  const targetPhaseId = nextPhaseId ?? previousPhaseId;
  const { error } = await supabase
    .from("workout_plans")
    .update({ current_phase_id: targetPhaseId })
    .eq("id", plan.id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "updated", currentPhaseId: targetPhaseId });
}
