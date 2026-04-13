import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getProfile } from "@/lib/data";
import { getPlanDraftProvider } from "@/lib/plan-drafting/plan-draft-provider";
import { isPlanSetupInput, normalizeWeekdays } from "@/lib/validation";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!isPlanSetupInput(body)) {
    return NextResponse.json(
      { error: "Check your plan setup answers, then try again." },
      { status: 400 }
    );
  }

  const setup = {
    ...body,
    weeklySchedule: normalizeWeekdays(body.weeklySchedule)
  };
  const profile = await getProfile();
  const provider = getPlanDraftProvider("template");

  if (!provider.isConfigured()) {
    return NextResponse.json(
      { error: "Template draft generation is unavailable right now." },
      { status: 400 }
    );
  }

  try {
    const draft = await provider.createDraft({ setup, profile });

    return NextResponse.json({ draft: draft.plan, source: draft.source });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to generate plan draft." },
      { status: 400 }
    );
  }
}
