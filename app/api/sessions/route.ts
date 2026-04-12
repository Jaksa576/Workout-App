import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { WorkoutSessionInput } from "@/lib/types";

function isWorkoutSessionInput(value: unknown): value is WorkoutSessionInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const input = value as Partial<WorkoutSessionInput>;

  return (
    typeof input.workoutTemplateId === "string" &&
    typeof input.completed === "boolean" &&
    typeof input.painOccurred === "boolean" &&
    typeof input.perceivedDifficulty === "string" &&
    typeof input.notes === "string" &&
    typeof input.recommendation === "string" &&
    Array.isArray(input.completedExerciseIds)
  );
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!isWorkoutSessionInput(body)) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();

  const { data: exercises, error: exercisesError } = await supabase
    .from("exercise_entries")
    .select("id")
    .eq("workout_template_id", body.workoutTemplateId);

  if (exercisesError) {
    return NextResponse.json({ error: exercisesError.message }, { status: 500 });
  }

  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: user.id,
      workout_template_id: body.workoutTemplateId,
      completed: body.completed,
      pain_occurred: body.painOccurred,
      perceived_difficulty: body.perceivedDifficulty,
      notes: body.notes.trim(),
      recommendation: body.recommendation
    })
    .select("id")
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
    return NextResponse.json({ error: resultsError.message }, { status: 500 });
  }

  return NextResponse.json({ id: session.id });
}
