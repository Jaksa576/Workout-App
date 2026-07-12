import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPlans } from "@/lib/data";
import { evaluatePhaseProgression } from "@/lib/progression";
import { getServerTimeZone } from "@/lib/server-time-zone";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { WorkoutSession } from "@/lib/types";
import { generateRecommendation } from "@/lib/recommendation";
import {
  buildPrescribedSetRows,
  getDefaultTrackingMetadata,
} from "@/lib/execution-results";
import { buildCanonicalSetRows, deriveExerciseCompletionStatus, isSuppliedMetricValuesValid, isSupportedMetricTrackingType } from "@/lib/set-logging";
import { isValidUuid, isWorkoutSessionInput } from "@/lib/validation";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const timeZone = await getServerTimeZone();

  if (
    body &&
    typeof body === "object" &&
    "clientSessionId" in body &&
    typeof body.clientSessionId === "string" &&
    !isValidUuid(body.clientSessionId)
  ) {
    return NextResponse.json(
      { error: "clientSessionId must be a valid UUID." },
      { status: 400 },
    );
  }

  if (!isWorkoutSessionInput(body, { timeZone })) {
    return NextResponse.json(
      { error: "Check the workout date and required fields, then try again." },
      { status: 400 },
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
      { status: 404 },
    );
  }

  const { data: exercises, error: exercisesError } = await supabase
    .from("exercise_entries")
    .select(
      "id, name, sets, reps, sort_order, source_exercise_id, tracking_type, unilateral_mode, load_unit, distance_unit, primary_value_label, secondary_value_label",
    )
    .eq("workout_template_id", body.workoutTemplateId)
    .order("sort_order", { ascending: true });

  if (exercisesError) {
    return NextResponse.json(
      { error: exercisesError.message },
      { status: 500 },
    );
  }

  const recommendation = generateRecommendation({
    completed: body.completed,
    pain: body.painOccurred,
    effort:
      body.perceivedDifficulty === "too_easy"
        ? "Too easy"
        : body.perceivedDifficulty === "too_hard"
          ? "Too hard"
          : "Appropriate",
  });
  const sessionId = body.clientSessionId ?? crypto.randomUUID();
  const finishedAt = new Date();
  const startedAt = body.startedAt ?? finishedAt.toISOString();
  const elapsedSeconds =
    body.elapsedSeconds ??
    Math.max(
      0,
      Math.floor((finishedAt.getTime() - Date.parse(startedAt)) / 1000),
    );
  const sessionPayload = {
    id: sessionId,
    workout_template_id: body.workoutTemplateId,
    completed_on: body.completedOn,
    completed: body.completed,
    pain_occurred: body.painOccurred,
    perceived_difficulty: body.perceivedDifficulty,
    notes: body.notes.trim(),
    recommendation: recommendation.title,
    phase_id_at_completion: workout.phase_id,
    workout_name_snapshot: workout.name,
    started_at: startedAt,
    finished_at: finishedAt.toISOString(),
    elapsed_seconds: elapsedSeconds,
    elapsed_source: body.startedAt ? "client_timer" : "server_timestamp",
  };

  const submittedSetResults = body.setResults ?? [];
  const completedExerciseIds = new Set(body.completedExerciseIds);
  const exercisePayload = (exercises ?? []).map((exercise, index) => {
    const fallback = getDefaultTrackingMetadata(exercise.source_exercise_id);
    const trackingType = exercise.tracking_type ?? fallback.trackingType;
    const unilateralMode = exercise.unilateral_mode ?? fallback.unilateralMode;

    return {
      id: crypto.randomUUID(),
      workout_session_id: sessionId,
      source_workout_template_id: body.workoutTemplateId,
      exercise_entry_id: exercise.id,
      source_exercise_id: exercise.source_exercise_id,
      exercise_name_snapshot: exercise.name,
      exercise_order: exercise.sort_order ?? index,
      tracking_type: trackingType,
      unilateral_mode: unilateralMode,
      load_unit:
        trackingType === "weight_reps"
          ? (exercise.load_unit ?? fallback.loadUnit)
          : null,
      distance_unit:
        trackingType === "distance_duration"
          ? (exercise.distance_unit ?? fallback.distanceUnit)
          : null,
      primary_value_label:
        exercise.primary_value_label ?? fallback.primaryValueLabel,
      secondary_value_label:
        exercise.secondary_value_label ?? fallback.secondaryValueLabel,
      prescribed_target_text: `${exercise.sets} sets × ${exercise.reps}`,
      completion_status: completedExerciseIds.has(exercise.id)
        ? "completed"
        : "incomplete",
      notes: body.exerciseNotes?.[exercise.id]?.trim() || null,
    };
  });

  const resultIdByEntryId = new Map(
    exercisePayload.map((result) => [result.exercise_entry_id, result.id]),
  );
  const trackingTypeByEntryId = new Map(
    exercisePayload.map((result) => [
      result.exercise_entry_id,
      result.tracking_type,
    ]),
  );
  const unilateralModeByEntryId = new Map(
    exercisePayload.map((result) => [result.exercise_entry_id, result.unilateral_mode]),
  );
  const submittedSetResultsByExerciseId = new Map<string, typeof submittedSetResults>();
  for (const row of submittedSetResults) {
    submittedSetResultsByExerciseId.set(row.exerciseEntryId, [
      ...(submittedSetResultsByExerciseId.get(row.exerciseEntryId) ?? []),
      row,
    ]);
  }
  const exerciseById = new Map((exercises ?? []).map((exercise) => [exercise.id, exercise]));
  const prescribedIndexKeys = new Set<string>();
  for (const row of submittedSetResults) {
    const exercise = exerciseById.get(row.exerciseEntryId);
    const trackingType = trackingTypeByEntryId.get(row.exerciseEntryId) ?? "completion";
    if (!exercise) return NextResponse.json({ error: "Submitted set row does not belong to this workout." }, { status: 400 });
    if (!isSupportedMetricTrackingType(trackingType) && trackingType !== "completion") return NextResponse.json({ error: "Unsupported exercises cannot submit set rows." }, { status: 400 });
    if (row.setKind === "prescribed") {
      if (row.prescribedSetIndex === null || row.prescribedSetIndex < 0 || row.prescribedSetIndex >= exercise.sets) return NextResponse.json({ error: "Submitted prescribed set index is invalid." }, { status: 400 });
      const prescribedKey = `${row.exerciseEntryId}:${row.prescribedSetIndex}`;
      if (prescribedIndexKeys.has(prescribedKey)) return NextResponse.json({ error: "Duplicate prescribed set indexes are not allowed." }, { status: 400 });
      prescribedIndexKeys.add(prescribedKey);
    }
    if (row.setKind === "added" && row.prescribedSetIndex !== null) return NextResponse.json({ error: "Added set rows cannot include a prescribed index." }, { status: 400 });
    if (!isSuppliedMetricValuesValid(trackingType, row, unilateralModeByEntryId.get(row.exerciseEntryId) ?? "bilateral")) return NextResponse.json({ error: "Set metrics must match tracking type, side mode, and non-negative value rules." }, { status: 400 });
  }

  const setPayload = (exercises ?? []).flatMap((exercise) => {
    const exerciseResultId = resultIdByEntryId.get(exercise.id);
    const trackingType = trackingTypeByEntryId.get(exercise.id) ?? "completion";
    if (!exerciseResultId) return [];
    const submittedRows = submittedSetResultsByExerciseId.get(exercise.id) ?? [];
    if (isSupportedMetricTrackingType(trackingType) || trackingType === "completion") {
      const mergeResult = buildCanonicalSetRows({
        exerciseEntryId: exercise.id,
        prescribedSetCount: exercise.sets,
        submittedRows,
        trackingType,
        legacyCompleted: trackingType === "completion" && completedExerciseIds.has(exercise.id),
      });
      if (!mergeResult.ok) {
        throw new Error(mergeResult.error);
      }
      return mergeResult.rows.map((row) => ({
        exercise_result_id: exerciseResultId,
        set_order: row.setOrder,
        prescribed_set_index: row.prescribedSetIndex,
        set_kind: row.setKind,
        status: row.status,
        actual_load: trackingType === "weight_reps" ? (row.actualLoad ?? null) : null,
        actual_reps: trackingType === "weight_reps" || trackingType === "reps_only" ? (row.actualReps ?? null) : null,
        actual_duration_seconds: trackingType === "duration" || trackingType === "distance_duration" ? (row.actualDurationSeconds ?? null) : null,
        actual_distance: trackingType === "distance_duration" ? (row.actualDistance ?? null) : null,
        actual_left_load: trackingType === "weight_reps" ? (row.actualLeftLoad ?? null) : null,
        actual_right_load: trackingType === "weight_reps" ? (row.actualRightLoad ?? null) : null,
        actual_left_reps: trackingType === "weight_reps" || trackingType === "reps_only" ? (row.actualLeftReps ?? null) : null,
        actual_right_reps: trackingType === "weight_reps" || trackingType === "reps_only" ? (row.actualRightReps ?? null) : null,
        actual_left_duration_seconds: trackingType === "duration" || trackingType === "distance_duration" ? (row.actualLeftDurationSeconds ?? null) : null,
        actual_right_duration_seconds: trackingType === "duration" || trackingType === "distance_duration" ? (row.actualRightDurationSeconds ?? null) : null,
        actual_left_distance: trackingType === "distance_duration" ? (row.actualLeftDistance ?? null) : null,
        actual_right_distance: trackingType === "distance_duration" ? (row.actualRightDistance ?? null) : null,
        completed_at: row.status === "completed" ? new Date().toISOString() : null,
      }));
    }
    return buildPrescribedSetRows(exerciseResultId, exercise, completedExerciseIds.has(exercise.id), trackingType);
  });

  for (const exercise of exercisePayload) {
    const submittedRows = submittedSetResultsByExerciseId.get(exercise.exercise_entry_id) ?? [];
    if (isSupportedMetricTrackingType(exercise.tracking_type) || exercise.tracking_type === "completion") {
      const canonicalRows = buildCanonicalSetRows({
        exerciseEntryId: exercise.exercise_entry_id,
        prescribedSetCount: exerciseById.get(exercise.exercise_entry_id)?.sets ?? 0,
        submittedRows,
        trackingType: exercise.tracking_type,
        legacyCompleted: exercise.tracking_type === "completion" && completedExerciseIds.has(exercise.exercise_entry_id),
      });
      if (canonicalRows.ok) exercise.completion_status = deriveExerciseCompletionStatus(canonicalRows.rows);
    }
  }

  const validExerciseIds = new Set(exercisePayload.filter((exercise) => exercise.completion_status === "completed").map((exercise) => exercise.exercise_entry_id));

  type SavedSessionRow = {
    id: string;
    workout_template_id: string;
    workout_name_snapshot: string | null;
    created_at: string;
    completed_on: string;
    completed: boolean;
    pain_occurred: boolean;
    perceived_difficulty: WorkoutSession["perceivedDifficulty"];
    notes: string | null;
    recommendation: string;
    phase_id_at_completion: string | null;
    progression_decision?: WorkoutSession["progressionDecision"];
    progression_reason?: string | null;
  };

  let session: SavedSessionRow | null = null;
  let shouldEvaluateProgression = true;

  if (body.clientSessionId) {
    const { data: existingSession, error: existingSessionError } =
      await supabase
        .from("workout_sessions")
        .select(
          "id, workout_template_id, workout_name_snapshot, created_at, completed_on, completed, pain_occurred, perceived_difficulty, notes, recommendation, phase_id_at_completion, progression_decision, progression_reason",
        )
        .eq("id", body.clientSessionId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (existingSessionError) {
      return NextResponse.json(
        { error: existingSessionError.message },
        { status: 500 },
      );
    }

    if (existingSession) {
      if (existingSession.workout_template_id !== body.workoutTemplateId) {
        return NextResponse.json(
          { error: "clientSessionId already belongs to a different workout." },
          { status: 409 },
        );
      }

      session = existingSession as SavedSessionRow;
      shouldEvaluateProgression = false;
    }
  }

  if (!session) {
    const { data: sessionData, error: sessionError } = await supabase
      .rpc("finalize_workout_session", {
        p_session: sessionPayload,
        p_exercise_results: exercisePayload,
        p_set_results: setPayload,
      } as never)
      .single();
    session = sessionData as SavedSessionRow | null;

    if (sessionError || !session) {
      return NextResponse.json(
        { error: sessionError?.message ?? "Unable to save workout session." },
        { status: 500 },
      );
    }
  }

  const plans = await getPlans();
  const owningPlan = plans.find((plan) =>
    plan.workouts.some((item) => item.id === body.workoutTemplateId),
  );
  const workoutIds = owningPlan?.workouts.map((item) => item.id) ?? [];
  let progression = {
    decision: (session.progression_decision ??
      null) as WorkoutSession["progressionDecision"],
    recommendation: session.recommendation,
    reason: session.progression_reason ?? null,
  };

  if (shouldEvaluateProgression && owningPlan && workoutIds.length > 0) {
    const { data: sessionRows, error: sessionRowsError } = await supabase
      .from("workout_sessions")
      .select(
        "id, workout_template_id, workout_name_snapshot, created_at, completed_on, completed, pain_occurred, perceived_difficulty, notes, recommendation, phase_id_at_completion, progression_decision, progression_reason",
      )
      .eq("user_id", user.id)
      .in("workout_template_id", workoutIds)
      .order("completed_on", { ascending: false })
      .order("created_at", { ascending: false });

    if (!sessionRowsError) {
      const phaseSessions: WorkoutSession[] = (sessionRows ?? []).map(
        (row) => ({
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
          progressionReason: row.progression_reason,
        }),
      );
      const evaluation = evaluatePhaseProgression({
        plan: owningPlan,
        currentPhase: owningPlan.currentPhase,
        sessions: phaseSessions,
      });

      progression = {
        decision: evaluation.decision,
        recommendation: evaluation.recommendation,
        reason: evaluation.reason,
      };

      const { error: updateSessionError } = await supabase
        .from("workout_sessions")
        .update({
          recommendation: evaluation.recommendation,
          progression_decision: evaluation.decision,
          progression_reason: evaluation.reason,
        })
        .eq("id", session.id)
        .eq("user_id", user.id);

      if (
        !updateSessionError &&
        evaluation.decision === "advance" &&
        evaluation.nextPhaseId
      ) {
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
      completedExerciseCount: validExerciseIds.size,
    },
  });
}
