"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon, type IconName } from "@/components/ui/icon";

const links = [
  { href: "/upload", label: "Upload", icon: "upload" },
  { href: "/topics", label: "Topics", icon: "topics" },
  { href: "/quiz", label: "Quiz", icon: "quiz" },
  { href: "/plan", label: "Plan", icon: "plan" },
  { href: "/chat", label: "Chat", icon: "chat" },
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
] satisfies { href: string; label: string; icon: IconName }[];

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
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl print:hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <div className="flex items-center justify-between gap-4 py-5">
          <Link href="/upload" className="flex shrink-0 items-center gap-3" aria-label="GapFinder AI home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-800 text-white shadow-sm"><Icon name="spark" className="h-6 w-6" /></span>
            <span className="text-xl font-bold tracking-[-.045em] text-slate-900">GapFinder<span className="ml-1.5 rounded-md bg-teal-50 px-1.5 py-0.5 text-xs font-bold tracking-normal text-teal-800">AI</span></span>
          </Link>
          <span className="hidden items-center gap-2 text-xs text-slate-400 md:inline-flex"><Icon name="shield" className="h-3.5 w-3.5" />Your private study workspace</span>
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-teal-100 bg-teal-50 text-xs font-bold uppercase text-teal-800 sm:inline-flex">{email.charAt(0)}</span>
            <span className="hidden max-w-40 truncate text-xs text-slate-500 lg:inline" title={email}>{email}</span>
            <button className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" onClick={logout} disabled={pending}><Icon name="logout" className="h-4 w-4" />{pending ? "Signing out…" : "Sign out"}</button>
          </div>
        </div>
        <nav aria-label="Main navigation" className="-mb-px flex gap-1 overflow-x-auto pt-1 sm:gap-3">
          {links.map(({ href, label, icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`) || (href === "/quiz" && pathname.startsWith("/report/"));
            return <Link key={href} href={href} aria-current={active ? "page" : undefined}
              className={`relative inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-4 text-[13px] font-semibold transition sm:px-4 ${active ? "border-teal-700 text-teal-800" : "border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-700"}`}>
              <Icon name={icon} className="h-4 w-4" />{label}
            </Link>;
          })}
        </nav>
        {error && <p role="alert" className="w-full py-3 text-sm text-red-700">{error}</p>}
      </div>
    </header>
  );
}
