"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { requestJson } from "@/lib/http";
import { savedPlanSchema, type SavedPlan } from "@/lib/plans/schema";
import { RevisionPlan } from "@/components/revision-plan";
import { Icon } from "@/components/ui/icon";

export function PlanForm({ attemptId }: { attemptId?: string }) {
  const [plan, setPlan] = useState<SavedPlan | null>(null);
  const [target, setTarget] = useState<string | null>(attemptId ?? null);
  const [days, setDays] = useState(5);
  const [hours, setHours] = useState(2);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    requestJson(`/api/plan/generate${attemptId ? `?attempt=${encodeURIComponent(attemptId)}` : ""}`, z.object({ plan: savedPlanSchema.nullable(), latestAttemptId: z.string().nullable() }))
      .then((result) => {
        if (cancelled) return;
        setPlan(result.plan); setTarget(attemptId ?? result.latestAttemptId);
        if (result.plan) { setDays(result.plan.days); setHours(result.plan.hours_per_day); }
      }).catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [attemptId]);

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setWarnings([]);
    try {
      const result = await requestJson("/api/plan/generate", z.object({ plan: savedPlanSchema, warnings: z.array(z.string()) }), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: target, days, hoursPerDay: hours }),
      });
      setPlan(result.plan); setWarnings(result.warnings);
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't make the plan."); }
    finally { setBusy(false); }
  }
  return <div className="mt-8">
    {error && <p role="alert" className="notice-error mb-5">{error}</p>}
    {loading ? <p role="status">Loading your plan…</p> : !target ? <div className="surface space-y-4 p-6"><p className="text-slate-500">Complete a diagnostic quiz first so your plan reflects your actual gaps.</p><Link className="button-primary" href="/quiz">Take diagnostic quiz <Icon name="arrow" className="h-4 w-4" /></Link></div> : (
      <form className="surface p-6 sm:p-7" onSubmit={generate}>
        <div className="mb-6 flex items-center gap-3"><span className="icon-tile"><Icon name="clock" /></span><div><h2 className="text-base font-semibold text-slate-900">Make time for what matters.</h2><p className="mt-1 text-xs text-slate-400">Tell us what fits your day. We&apos;ll work within it.</p></div></div>
        <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
          <label className="text-xs font-semibold text-slate-600">Days available<input className="mt-2" type="number" min={1} max={60} step={1} required value={days} onChange={(event) => setDays(Number(event.target.value))} disabled={busy} /></label>
          <label className="text-xs font-semibold text-slate-600">Hours per day<input className="mt-2" type="number" min={0.25} max={24} step={0.25} required value={hours} onChange={(event) => setHours(Number(event.target.value))} disabled={busy} /></label>
          <button className="button-primary sm:col-span-2 lg:col-span-1" disabled={busy}>{busy ? "Calculating your plan…" : plan ? "Update revision plan" : "Build revision plan"}<Icon name="arrow" className="h-4 w-4" /></button>
        </div>
      </form>
    )}
    {busy && <p role="status" className="mt-4 text-sm text-slate-500">Order and minutes are calculated in code. AI only adds source-based revision tips.</p>}
    {warnings.map((warning) => <p key={warning} role="status" className="mt-3 text-sm text-amber-800">{warning}</p>)}
    {plan && <><RevisionPlan plan={plan} /><div className="mt-6 flex flex-wrap gap-3"><Link href="/quiz" className="button-primary">Next: retake and track improvement <Icon name="arrow" className="h-4 w-4" /></Link><Link href={`/report/${plan.attempt_id}`} className="button-secondary">View the diagnosis behind this plan</Link></div></>}
  </div>;
}
