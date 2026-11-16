"use client";

import { useState } from "react";
import { z } from "zod";
import { requestJson } from "@/lib/http";

const countsSchema = z.object({
  generated: z.number(), accepted: z.number(), rejected: z.number(), cached: z.number(), warnings: z.array(z.string()),
});

export function QuizGenerator({ onReady }: { onReady?: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [counts, setCounts] = useState<z.infer<typeof countsSchema> | null>(null);
  async function generate(regenerate: boolean) {
    if (regenerate && !window.confirm("Generate new questions? This uses AI quota. Existing questions and previous results will be kept.")) return;
    setBusy(true); setError("");
    try {
      const result = await requestJson("/api/quiz/generate", countsSchema, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ regenerate }),
      });
      setCounts(result);
      if (result.accepted) onReady?.();
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't generate a quiz."); }
    finally { setBusy(false); }
  }
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-bold">Prepare your diagnostic</h2>
      <p className="text-sm leading-6 text-slate-500">Up to 6 topics and 12 questions. Questions are generated once, checked against their sources, and reused to save AI quota.</p>
      <div className="flex flex-wrap gap-3">
        <button className="button-primary" disabled={busy} onClick={() => generate(false)}>{busy ? "Retrieving, generating, verifying…" : "Prepare quiz"}</button>
        <button className="button-secondary" disabled={busy} onClick={() => generate(true)}>Regenerate questions</button>
      </div>
      {busy && <p role="status" className="text-sm text-slate-500">This may take a few minutes. If Groq is busy, a short retry happens automatically. Questions that pass are saved.</p>}
      {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
      {counts && <div role="status" className="space-y-2 text-sm">
        <p className="font-semibold text-teal-800">Generated {counts.generated}, rejected {counts.rejected} · {counts.accepted} ready ({counts.cached} cached)</p>
        {counts.cached > 0 && <p className="text-slate-500">Counts describe this request; cached questions were verified when first generated.</p>}
        {counts.warnings.map((warning) => <p key={warning} className="text-amber-800">{warning}</p>)}
      </div>}
    </section>
  );
}
