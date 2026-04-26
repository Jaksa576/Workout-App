import { redirect } from "next/navigation";
import type { UserSummary } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function getCurrentUser(): Promise<UserSummary | null> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null
  };
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function redirectIfAuthenticated() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }
}
