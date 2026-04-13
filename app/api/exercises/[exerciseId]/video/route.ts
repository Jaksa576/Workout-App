import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { normalizeExerciseVideoUrl } from "@/lib/validation";

type ExerciseVideoRequest = {
  videoUrl?: unknown;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ exerciseId: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { exerciseId } = await params;
  const body = (await request.json()) as ExerciseVideoRequest;

  if (typeof body.videoUrl !== "string") {
    return NextResponse.json(
      { error: "Add a YouTube link or leave the field blank." },
      { status: 400 }
    );
  }

  const normalizedVideoUrl = normalizeExerciseVideoUrl(body.videoUrl);

  if (normalizedVideoUrl === null) {
    return NextResponse.json(
      { error: "Use a YouTube link, or leave the field blank." },
      { status: 400 }
    );
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("exercise_entries")
    .update({ video_url: normalizedVideoUrl || null })
    .eq("id", exerciseId)
    .select("id, video_url")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: "This exercise is not available for your account." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    exercise: {
      id: data.id,
      videoUrl: data.video_url ?? ""
    }
  });
}
