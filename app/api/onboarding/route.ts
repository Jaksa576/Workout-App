import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPlanDraftProvider } from "@/lib/ai/plan-draft-provider";
import { createStructuredPlanForUser } from "@/lib/plan-write";
import { createGuidedStarterPlan } from "@/lib/starter-plan-generator";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { isOnboardingInput, normalizeWeekdays } from "@/lib/validation";

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
  const weeklySchedule = normalizeWeekdays(body.weeklySchedule);
  const goal = [body.goal, body.goalNotes].filter(Boolean).join(": ");

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    goal: goal || "Build a sustainable routine.",
    injuries: body.injuries,
    equipment: body.equipment,
    days_per_week: body.daysPerWeek,
    session_minutes: body.sessionMinutes,
    onboarding_completed_at: new Date().toISOString()
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (body.planSetupChoice === "manual") {
    return NextResponse.json({ redirectTo: "/plans/new" });
  }

  if (body.planSetupChoice === "ai") {
    const provider = getPlanDraftProvider();

    if (!provider.isConfigured()) {
      return NextResponse.json(
        { error: "AI draft unavailable. Use guided starter plan instead." },
        { status: 400 }
      );
    }
  }

  try {
    const plan = await createStructuredPlanForUser({
      supabase,
      userId: user.id,
      input: createGuidedStarterPlan({ ...body, weeklySchedule })
    });

    return NextResponse.json({ redirectTo: `/plans/${plan.id}` });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create starter plan." },
      { status: 400 }
    );
  }
}
