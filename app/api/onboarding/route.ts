import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { isOnboardingInput } from "@/lib/validation";

function keepExistingString(existingValue: string | null | undefined, nextValue: string | undefined) {
  const trimmedValue = nextValue?.trim();
  return trimmedValue || existingValue || null;
}

function keepExistingArray(existingValue: string[] | null | undefined, nextValue: string[] | undefined) {
  if (nextValue && nextValue.length > 0) {
    return nextValue;
  }

  return existingValue ?? [];
}

function keepExistingNullableValue<T>(
  existingValue: T | null | undefined,
  nextValue: T | null | undefined
) {
  return nextValue ?? existingValue ?? null;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!isOnboardingInput(body)) {
    return NextResponse.json(
      { error: "Check your setup answers, then try again." },
      { status: 400 }
    );
  }

  const supabase = await getSupabaseServerClient();
  const { data: existingProfile, error: profileReadError } = await supabase
    .from("profiles")
    .select(
      "goal, injuries, equipment, limitations_detail, age, weight, training_experience, activity_level, training_environment, exercise_preferences, exercise_dislikes, sports_interests"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profileReadError) {
    return NextResponse.json({ error: profileReadError.message }, { status: 500 });
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    goal: existingProfile?.goal || body.goal.trim() || "Build a sustainable routine.",
    injuries: keepExistingArray(existingProfile?.injuries, body.injuries),
    limitations_detail: keepExistingString(
      existingProfile?.limitations_detail,
      body.limitationsDetail
    ),
    equipment: keepExistingArray(existingProfile?.equipment, body.equipment),
    age: keepExistingNullableValue(existingProfile?.age, body.age),
    weight: keepExistingNullableValue(existingProfile?.weight, body.weight),
    training_experience: keepExistingNullableValue(
      existingProfile?.training_experience,
      body.trainingExperience
    ),
    activity_level: keepExistingNullableValue(existingProfile?.activity_level, body.activityLevel),
    training_environment: keepExistingNullableValue(
      existingProfile?.training_environment,
      body.trainingEnvironment
    ),
    exercise_preferences: keepExistingArray(
      existingProfile?.exercise_preferences,
      body.exercisePreferences
    ),
    exercise_dislikes: keepExistingArray(existingProfile?.exercise_dislikes, body.exerciseDislikes),
    sports_interests: keepExistingArray(existingProfile?.sports_interests, body.sportsInterests),
    days_per_week: body.daysPerWeek,
    session_minutes: body.sessionMinutes,
    onboarding_completed_at: new Date().toISOString()
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (body.planSetupChoice === "manual") {
    return NextResponse.json({ redirectTo: "/plans/new?mode=manual" });
  }

  return NextResponse.json({ redirectTo: "/plans/new" });
}
