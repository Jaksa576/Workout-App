"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export function SignOutButton({ className }: { className?: string }) {
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
      className={clsx(
        "rounded-full border border-transparent px-4 py-2 text-center text-sm font-semibold text-muted transition outline-none hover:border-border hover:bg-surface hover:text-copy focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-shell sm:text-left",
        className
      )}
    >
      Sign Out
    </button>
  );
}
