"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { requestJson } from "@/lib/http";
import { Icon } from "@/components/ui/icon";

const CONFIRMATION = "DELETE MY STUDY DATA";

export function WorkspaceReset({ disabled, onBusyChange }: { disabled: boolean; onBusyChange: (pending: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function reset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirmation !== CONFIRMATION || pending || disabled) return;
    setPending(true); setError(""); onBusyChange(true);
    try {
      await requestJson("/api/workspace", z.object({ reset: z.literal(true) }), {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      // A full navigation clears stale document, report, and plan state in this tab.
      window.location.replace("/upload?reset=done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't reset the workspace. Please try again.");
      setPending(false); onBusyChange(false);
    }
  }

  function cancel() {
    setOpen(false); setConfirmation(""); setError("");
  }

  return <section className="rounded-2xl border border-rose-200/80 bg-white p-6 sm:p-7" aria-labelledby="reset-heading">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700"><Icon name="alert" /></span>
        <div><h2 id="reset-heading" className="scroll-mt-40 text-base font-semibold text-slate-900">Start fresh with a different subject</h2><p className="mt-1 max-w-xl text-xs leading-6 text-slate-500">Clear your study workspace while keeping your login account. This is permanent, so save any revision PDFs you want first.</p></div>
      </div>
      {!open && <button type="button" className="button-secondary !border-rose-200 !text-rose-700 hover:!bg-rose-50" disabled={disabled} aria-expanded={open} aria-controls="reset-confirmation" onClick={() => setOpen(true)}>Reset study workspace</button>}
    </div>
    {open && <form id="reset-confirmation" onSubmit={reset} className="mt-6 border-t border-rose-100 pt-5">
      <p className="text-sm font-semibold text-rose-800">This permanently deletes all of your:</p>
      <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm leading-6 text-slate-600">
        <li>Uploaded material and source passages</li>
        <li>Topic maps, past-paper mappings, and generated quiz questions</li>
        <li>Quiz attempts, answers, gap reports, and dashboard progress</li>
        <li>Saved revision plans and online revision sheets</li>
      </ul>
      <p className="mt-4 text-sm leading-6 text-slate-600"><strong>Your login account and password stay unchanged.</strong> Downloaded PDF copies are not removed. There is no undo.</p>
      <p id="reset-warning" className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-6 text-amber-900">Finish any running uploads or AI tasks, including in other tabs, before resetting. You can <Link className="font-semibold underline" href="/plan">save your revision sheet</Link> first.</p>
      <label htmlFor="reset-phrase" className="mt-5 block text-sm font-semibold text-slate-700">Type <span className="select-all rounded bg-rose-50 px-1.5 py-0.5 font-mono text-xs text-rose-800">{CONFIRMATION}</span> to confirm</label>
      <input id="reset-phrase" name="confirmation" className="mt-2 max-w-lg font-mono text-sm" autoComplete="off" spellCheck={false} required value={confirmation} disabled={pending} aria-describedby="reset-warning" onChange={(event) => setConfirmation(event.target.value)} />
      {error && <p role="alert" className="notice-error mt-4">{error}</p>}
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-700 bg-rose-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:opacity-50" disabled={disabled || pending || confirmation !== CONFIRMATION}>{pending ? "Deleting your study data…" : "Permanently delete my study data"}</button>
        <button type="button" className="button-secondary" disabled={pending} onClick={cancel}>Cancel</button>
      </div>
      {pending && <p role="status" className="mt-3 text-sm text-slate-500">Resetting your workspace. Please keep this tab open.</p>}
    </form>}
  </section>;
}
