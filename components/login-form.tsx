"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

const defaultSiteUrl = "https://workout-app-seven-delta.vercel.app";
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? defaultSiteUrl).replace(/\/$/, "");

export function LoginForm({
  initialMode = "sign-in"
}: {
  initialMode?: "sign-in" | "sign-up";
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up">(initialMode);
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
                emailRedirectTo: `${siteUrl}/dashboard`
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
      router.push("/dashboard");
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
            mode === "sign-in" ? "bg-hero text-white" : "bg-surface-soft text-muted"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("sign-up")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            mode === "sign-up" ? "bg-hero text-white" : "bg-surface-soft text-muted"
          }`}
        >
          Create account
        </button>
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-copy">Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="ui-input mt-3"
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-copy">Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Your password"
          className="ui-input mt-3"
        />
      </label>

      <button
        className="ui-button-primary w-full disabled:opacity-60"
        disabled={loading}
      >
        {loading
          ? mode === "sign-in"
            ? "Signing in..."
            : "Creating account..."
          : mode === "sign-in"
            ? "Sign in"
            : "Create account"}
      </button>

      {status ? <p className="text-sm leading-6 text-muted">{status}</p> : null}
    </form>
  );
}
