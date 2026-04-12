"use client";

import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-slate transition hover:border-coral hover:text-coral"
    >
      Sign Out
    </button>
  );
}
