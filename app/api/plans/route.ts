import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { parsePlanSaveInput } from "@/lib/plan-save-input";
import { createStructuredPlanForUser } from "@/lib/plan-write";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
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
    const supabase = await getSupabaseServerClient();
    const plan = await createStructuredPlanForUser({
      supabase,
      userId: user.id,
      input: parsedInput.input,
      setupContext: parsedInput.setupContext
    });

    return NextResponse.json(plan);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create plan." },
      { status: 400 }
    );
  }
}
