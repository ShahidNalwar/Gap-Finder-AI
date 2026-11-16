"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    try {
      const supabase = createClient();
      const result = mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
          });
      if (result.error) {
        setError(result.error.message);
      } else if (result.data.session) {
        // A full navigation ensures the server sees the newly written auth cookies.
        window.location.replace("/upload");
      } else {
        setMessage("Check your email to confirm your account, then sign in.");
      }
    } catch {
      setError("We couldn't connect. Check your connection and Supabase configuration, then try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="mb-7 grid grid-cols-2 gap-1 rounded-xl bg-slate-200/60 p-1" aria-label="Account options">
        {(["login", "signup"] as const).map((value) => (
          <button key={value} type="button" disabled={pending} aria-pressed={mode === value}
            className={`rounded-lg py-2.5 text-sm font-semibold ${mode === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
            onClick={() => { setMode(value); setError(""); setMessage(""); }}>
            {value === "login" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-5" aria-busy={pending}>
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-semibold">Email address</label>
          <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required disabled={pending} maxLength={254} />
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-semibold">Password</label>
          <input id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "signup" ? 8 : 1} disabled={pending} />
          {mode === "signup" && <p className="mt-2 text-xs text-slate-500">Use at least 8 characters.</p>}
        </div>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {message && <p role="status" className="rounded-lg bg-teal-50 p-3 text-sm text-teal-900">{message}</p>}
        <button type="submit" disabled={pending} className="button-primary w-full">
          {pending ? "Please wait…" : mode === "login" ? "Sign in →" : "Create account →"}
        </button>
      </form>
      <p className="mt-6 text-center text-xs leading-5 text-slate-500">Your study material and progress stay linked to your account.</p>
    </>
  );
}
