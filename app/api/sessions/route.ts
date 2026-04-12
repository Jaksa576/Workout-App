import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { generateRecommendation } from "@/lib/recommendation";
import { isWorkoutSessionInput } from "@/lib/validation";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!isWorkoutSessionInput(body)) {
    return NextResponse.json(
      { error: "Check the workout date and required fields, then try again." },
      { status: 400 }
    );
  }

  const supabase = await getSupabaseServerClient();

  const { data: workout, error: workoutError } = await supabase
    .from("workout_templates")
    .select("id, name")
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
    .select("id")
    .eq("workout_template_id", body.workoutTemplateId);

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
      recommendation: recommendation.title
    })
    .select("id, workout_template_id, created_at, completed_on, completed, pain_occurred, perceived_difficulty, notes, recommendation")
    .single();

  if (sessionError || !session) {
    return NextResponse.json(
      { error: sessionError?.message ?? "Unable to save workout session." },
      { status: 500 }
    );
  }

  const validExerciseIds = new Set(body.completedExerciseIds);
  const { error: resultsError } = await supabase.from("exercise_results").insert(
    (exercises ?? []).map((exercise) => ({
      workout_session_id: session.id,
      exercise_entry_id: exercise.id,
      completed: validExerciseIds.has(exercise.id),
      pain_flag: body.painOccurred && validExerciseIds.has(exercise.id)
    }))
  );

  if (resultsError) {
    await supabase.from("workout_sessions").delete().eq("id", session.id).eq("user_id", user.id);

    return NextResponse.json({ error: resultsError.message }, { status: 500 });
  }

  return NextResponse.json({
    session: {
      id: session.id,
      createdAt: session.created_at,
      workoutTemplateId: session.workout_template_id,
      workoutName: workout.name,
      completedOn: session.completed_on,
      completed: session.completed,
      painOccurred: session.pain_occurred,
      perceivedDifficulty: session.perceived_difficulty,
      notes: session.notes,
      recommendation: session.recommendation,
      completedExerciseCount: validExerciseIds.size
    }
  });
}
