"use client";

import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");

  return (
    <form className="space-y-4">
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
          placeholder="Enter your password"
          className="mt-3 w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
        />
      </label>
      <button className="w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">
        Continue with email
      </button>
      <p className="text-sm leading-6 text-slate">
        Connect this form to Supabase auth by calling{" "}
        <code>supabase.auth.signInWithPassword()</code> and routing successful
        users to the dashboard.
      </p>
    </form>
  );
}
