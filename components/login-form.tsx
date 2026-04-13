"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

const defaultSiteUrl = "https://workout-app-seven-delta.vercel.app";
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? defaultSiteUrl).replace(/\/$/, "");

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } =
        mode === "sign-in"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: {
                emailRedirectTo: `${siteUrl}/`
              }
            });

      if (error) {
        throw error;
      }

      if (mode === "sign-up" && !data.session) {
        setStatus("Account created. Check your email to confirm it, then sign in.");
        return;
      }

      setStatus("Signed in. Taking you to your dashboard...");
      router.push("/");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setMode("sign-in")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            mode === "sign-in" ? "bg-ink text-white" : "bg-mist text-slate"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setMode("sign-up")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            mode === "sign-up" ? "bg-ink text-white" : "bg-mist text-slate"
          }`}
        >
          Create Account
        </button>
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-ink">Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="mt-3 w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-ink">Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Your password"
          className="mt-3 w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
        />
      </label>

      <button
        className="w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        disabled={loading}
      >
        {loading
          ? mode === "sign-in"
            ? "Signing In..."
            : "Creating Account..."
          : mode === "sign-in"
            ? "Sign In"
            : "Create Account"}
      </button>

      {status ? <p className="text-sm leading-6 text-slate">{status}</p> : null}
    </form>
  );
}
