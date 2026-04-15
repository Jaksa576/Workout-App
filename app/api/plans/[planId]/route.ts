import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { parsePlanSaveInput } from "@/lib/plan-save-input";
import { updateStructuredPlanForUser } from "@/lib/plan-write";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsedInput = parsePlanSaveInput(body);

  if (!parsedInput) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const { planId } = await params;
    const supabase = await getSupabaseServerClient();
    const plan = await updateStructuredPlanForUser({
      supabase,
      userId: user.id,
      planId,
      input: parsedInput.input,
      setupContext: parsedInput.setupContext
    });

    return NextResponse.json(plan);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update plan.";

    return NextResponse.json(
      { error: message },
      { status: message === "Plan not found." ? 404 : 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { planId } = await params;
  const supabase = await getSupabaseServerClient();
  const { data: plan, error: planError } = await supabase
    .from("workout_plans")
    .select("id")
    .eq("id", planId)
    .eq("user_id", user.id)
    .is("archived_at", null)
    .maybeSingle();

  if (planError) {
    return NextResponse.json({ error: planError.message }, { status: 500 });
  }

  if (!plan) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  const { error } = await supabase
    .from("workout_plans")
    .update({ archived_at: new Date().toISOString(), is_active: false })
    .eq("id", plan.id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "archived" });
}
