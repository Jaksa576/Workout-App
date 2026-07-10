import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPlans } from "@/lib/data";
import { evaluatePhaseProgression } from "@/lib/progression";
import { getServerTimeZone } from "@/lib/server-time-zone";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { WorkoutSession } from "@/lib/types";
import { generateRecommendation } from "@/lib/recommendation";
import { buildPrescribedSetRows, getDefaultTrackingMetadata } from "@/lib/execution-results";
import { isWorkoutSessionInput } from "@/lib/validation";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const timeZone = await getServerTimeZone();

  if (!isWorkoutSessionInput(body, { timeZone })) {
    return NextResponse.json(
      { error: "Check the workout date and required fields, then try again." },
      { status: 400 }
    );
  }

  const supabase = await getSupabaseServerClient();

  const { data: workout, error: workoutError } = await supabase
    .from("workout_templates")
    .select("id, name, phase_id")
    .eq("id", body.workoutTemplateId)
    .maybeSingle();

  if (workoutError) {
    return NextResponse.json({ error: workoutError.message }, { status: 500 });
  }

  if (!workout) {
    return NextResponse.json(
      { error: "This workout is not available for your account." },
      { status: 404 }
    );
  }

  const { data: exercises, error: exercisesError } = await supabase
    .from("exercise_entries")
    .select("id, name, sets, reps, sort_order, source_exercise_id, tracking_type, unilateral_mode, load_unit, distance_unit, primary_value_label, secondary_value_label")
    .eq("workout_template_id", body.workoutTemplateId)
    .order("sort_order", { ascending: true });

  if (exercisesError) {
    return NextResponse.json({ error: exercisesError.message }, { status: 500 });
  }

  const recommendation = generateRecommendation({
    completed: body.completed,
    pain: body.painOccurred,
    effort:
      body.perceivedDifficulty === "too_easy"
        ? "Too easy"
        : body.perceivedDifficulty === "too_hard"
          ? "Too hard"
          : "Appropriate"
  });
  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: user.id,
      workout_template_id: body.workoutTemplateId,
      completed_on: body.completedOn,
      completed: body.completed,
      pain_occurred: body.painOccurred,
      perceived_difficulty: body.perceivedDifficulty,
      notes: body.notes.trim(),
      recommendation: recommendation.title,
      phase_id_at_completion: workout.phase_id,
      workout_name_snapshot: workout.name,
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
      elapsed_seconds: 0,
      elapsed_source: "server_timestamp"
    })
    .select("id, workout_template_id, workout_name_snapshot, created_at, completed_on, completed, pain_occurred, perceived_difficulty, notes, recommendation, phase_id_at_completion, progression_decision, progression_reason")
    .single();

  if (sessionError || !session) {
    return NextResponse.json(
      { error: sessionError?.message ?? "Unable to save workout session." },
      { status: 500 }
    );
  }

  const validExerciseIds = new Set(body.completedExerciseIds);
  const exercisePayload = (exercises ?? []).map((exercise, index) => {
    const fallback = getDefaultTrackingMetadata(exercise.source_exercise_id);
    const trackingType = exercise.tracking_type ?? fallback.trackingType;
    const unilateralMode = exercise.unilateral_mode ?? fallback.unilateralMode;

    return {
      workout_session_id: session.id,
      source_workout_template_id: body.workoutTemplateId,
      exercise_entry_id: exercise.id,
      source_exercise_id: exercise.source_exercise_id,
      exercise_name_snapshot: exercise.name,
      exercise_order: exercise.sort_order ?? index,
      tracking_type: trackingType,
      unilateral_mode: unilateralMode,
      load_unit: exercise.load_unit ?? fallback.loadUnit,
      distance_unit: exercise.distance_unit ?? fallback.distanceUnit,
      primary_value_label: exercise.primary_value_label ?? fallback.primaryValueLabel,
      secondary_value_label: exercise.secondary_value_label ?? fallback.secondaryValueLabel,
      prescribed_target_text: `${exercise.sets} sets × ${exercise.reps}`,
      completion_status: validExerciseIds.has(exercise.id) ? "completed" : "incomplete"
    };
  });

  const { data: exerciseResults, error: resultsError } = await supabase
    .from("exercise_results")
    .insert(exercisePayload)
    .select("id, exercise_entry_id");

  if (resultsError || !exerciseResults) {
    await supabase.from("workout_sessions").delete().eq("id", session.id).eq("user_id", user.id);

    return NextResponse.json({ error: resultsError?.message ?? "Unable to save exercise results." }, { status: 500 });
  }

  const resultIdByEntryId = new Map(exerciseResults.map((result) => [result.exercise_entry_id, result.id]));
  const setPayload = (exercises ?? []).flatMap((exercise) => {
    const exerciseResultId = resultIdByEntryId.get(exercise.id);
    return exerciseResultId
      ? buildPrescribedSetRows(exerciseResultId, exercise, validExerciseIds.has(exercise.id))
      : [];
  });

  if (setPayload.length > 0) {
    const { error: setResultsError } = await supabase.from("exercise_set_results").insert(setPayload);

    if (setResultsError) {
      await supabase.from("workout_sessions").delete().eq("id", session.id).eq("user_id", user.id);

      return NextResponse.json({ error: setResultsError.message }, { status: 500 });
    }
  }

  const plans = await getPlans();
  const owningPlan = plans.find((plan) =>
    plan.workouts.some((item) => item.id === body.workoutTemplateId)
  );
  const workoutIds = owningPlan?.workouts.map((item) => item.id) ?? [];
  let progression = {
    decision: null as WorkoutSession["progressionDecision"],
    recommendation: session.recommendation,
    reason: null as string | null
  };

  if (owningPlan && workoutIds.length > 0) {
    const { data: sessionRows, error: sessionRowsError } = await supabase
      .from("workout_sessions")
      .select("id, workout_template_id, workout_name_snapshot, created_at, completed_on, completed, pain_occurred, perceived_difficulty, notes, recommendation, phase_id_at_completion, progression_decision, progression_reason")
      .eq("user_id", user.id)
      .in("workout_template_id", workoutIds)
      .order("completed_on", { ascending: false })
      .order("created_at", { ascending: false });

    if (!sessionRowsError) {
      const phaseSessions: WorkoutSession[] = (sessionRows ?? []).map((row) => ({
        id: row.id,
        workoutTemplateId: row.workout_template_id,
        workoutNameSnapshot: row.workout_name_snapshot,
        createdAt: row.created_at,
        completedOn: row.completed_on,
        completed: row.completed,
        painOccurred: row.pain_occurred,
        perceivedDifficulty: row.perceived_difficulty,
        notes: row.notes,
        recommendation: row.recommendation,
        phaseIdAtCompletion: row.phase_id_at_completion,
        progressionDecision: row.progression_decision,
        progressionReason: row.progression_reason
      }));
      const evaluation = evaluatePhaseProgression({
        plan: owningPlan,
        currentPhase: owningPlan.currentPhase,
        sessions: phaseSessions
      });

      progression = {
        decision: evaluation.decision,
        recommendation: evaluation.recommendation,
        reason: evaluation.reason
      };

      const { error: updateSessionError } = await supabase
        .from("workout_sessions")
        .update({
          recommendation: evaluation.recommendation,
          progression_decision: evaluation.decision,
          progression_reason: evaluation.reason
        })
        .eq("id", session.id)
        .eq("user_id", user.id);

      if (!updateSessionError && evaluation.decision === "advance" && evaluation.nextPhaseId) {
        progression.reason = `${evaluation.reason} You can move to the next phase when you are ready.`;
      }
    }
  }

  return NextResponse.json({
    session: {
      id: session.id,
      createdAt: session.created_at,
      workoutTemplateId: session.workout_template_id,
      workoutNameSnapshot: session.workout_name_snapshot,
      workoutName: workout.name,
      completedOn: session.completed_on,
      completed: session.completed,
      painOccurred: session.pain_occurred,
      perceivedDifficulty: session.perceived_difficulty,
      notes: session.notes,
      recommendation: progression.recommendation,
      phaseIdAtCompletion: session.phase_id_at_completion,
      progressionDecision: progression.decision,
      progressionReason: progression.reason,
      completedExerciseCount: validExerciseIds.size
    }
  });
}
