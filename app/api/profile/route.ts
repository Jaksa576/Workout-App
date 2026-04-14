import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { buildProfileUpdateValues } from "@/lib/profile-settings";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { isProfileSettingsInput } from "@/lib/validation";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!isProfileSettingsInput(body)) {
    return NextResponse.json(
      { error: "Check your profile settings, then try again." },
      { status: 400 }
    );
  }

  const updateValues = buildProfileUpdateValues(body);

  if (Object.keys(updateValues).length === 0) {
    return NextResponse.json({ status: "unchanged" });
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(updateValues)
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: "Profile not found. Complete profile setup first." },
      { status: 404 }
    );
  }

  return NextResponse.json({ status: "saved" });
}
