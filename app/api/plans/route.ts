import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createStructuredPlanForUser, legacyPlanToStructured } from "@/lib/plan-write";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import {
  isLegacyPlanFormInput,
  isStructuredPlanInput,
  normalizeWeekdays
} from "@/lib/validation";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const input = isStructuredPlanInput(body)
    ? { ...body, weeklySchedule: normalizeWeekdays(body.weeklySchedule) }
    : isLegacyPlanFormInput(body)
      ? legacyPlanToStructured(body)
      : null;

  if (!input) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const supabase = await getSupabaseServerClient();
    const plan = await createStructuredPlanForUser({
      supabase,
      userId: user.id,
      input
    });

    return NextResponse.json(plan);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create plan." },
      { status: 400 }
    );
  }
}
