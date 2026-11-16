"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  ["/upload", "Upload"],
  ["/topics", "Topics"],
  ["/quiz", "Quiz"],
  ["/plan", "Plan"],
  ["/chat", "Chat"],
  ["/dashboard", "Dashboard"],
] as const;

export function Navigation({ email }: { email: string }) {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok && response.status !== 401) throw new Error("Logout failed");
      window.location.replace("/login");
    } catch {
      setError("Couldn't sign out. Please try again.");
      setPending(false);
    }
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-6 py-5">
        <Link href="/upload" className="text-xl font-bold tracking-tight">GapFinder <span className="text-teal-700">AI</span></Link>
        <div className="flex items-center gap-4">
          <span className="max-w-48 truncate text-xs text-slate-500" title={email}>{email}</span>
          <button className="button-secondary" onClick={logout} disabled={pending}>{pending ? "Signing out…" : "Sign out"}</button>
        </div>
        <nav aria-label="Main navigation" className="-mb-5 flex w-full gap-1 overflow-x-auto">
          {links.map(([href, label]) => (
            <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}
              className={`whitespace-nowrap border-b-2 px-4 py-4 text-sm font-semibold ${pathname === href ? "border-teal-700 text-teal-800" : "border-transparent text-slate-500 hover:text-slate-900"}`}>
              {label}
            </Link>
          ))}
        </nav>
        {error && <p role="alert" className="w-full py-3 text-sm text-red-700">{error}</p>}
      </div>
    </header>
  );
}
