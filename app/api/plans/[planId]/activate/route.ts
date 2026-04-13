import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(
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
    .is("completed_at", null)
    .is("archived_at", null)
    .maybeSingle();

  if (planError) {
    return NextResponse.json({ error: planError.message }, { status: 500 });
  }

  if (!plan) {
    return NextResponse.json(
      { error: "Only incomplete saved plans can be made active." },
      { status: 404 }
    );
  }

  const { error: deactivateError } = await supabase
    .from("workout_plans")
    .update({ is_active: false })
    .eq("user_id", user.id)
    .is("completed_at", null)
    .is("archived_at", null);

  if (deactivateError) {
    return NextResponse.json({ error: deactivateError.message }, { status: 500 });
  }

  const { error: activateError } = await supabase
    .from("workout_plans")
    .update({ is_active: true })
    .eq("id", plan.id)
    .eq("user_id", user.id);

  if (activateError) {
    return NextResponse.json({ error: activateError.message }, { status: 500 });
  }

  return NextResponse.json({ status: "active" });
}
