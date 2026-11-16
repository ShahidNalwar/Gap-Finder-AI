"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { z } from "zod";
import { topicSchema } from "@/lib/ai/schemas";
import { requestJson } from "@/lib/http";

const schema = z.object({ topics: z.array(topicSchema), mappings: z.array(z.object({ topic_id: z.string().nullable() })) });

export function TopicMap() {
  const [data, setData] = useState<z.infer<typeof schema>>({ topics: [], mappings: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function load() { setData(await requestJson("/api/topics/build", schema)); }
  useEffect(() => { load().catch((e: Error) => setError(e.message)).finally(() => setLoading(false)); }, []);
  async function build() {
    if (data.topics.length && !window.confirm("Replace your topic map? Unsubmitted quizzes will be removed. Maps used by submitted attempts are preserved and cannot be rebuilt.")) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await requestJson("/api/topics/build", z.object({ mapped: z.number(), unmapped: z.number() }), {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rebuild: !!data.topics.length }),
      });
      setMessage(`${result.mapped} past-paper questions mapped; ${result.unmapped} could not be mapped.`);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't build the topic map."); }
    finally { setBusy(false); }
  }
  const roots = data.topics.filter((topic) => !topic.parent_id);
  const max = Math.max(1, ...roots.map((topic) => data.mappings.filter((mapping) => mapping.topic_id === topic.id).length));
  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <button className="button-primary" onClick={build} disabled={busy || loading}>{busy ? "Reading syllabus and mapping papers…" : roots.length ? "Rebuild topic map" : "Build topic map"}</button>
        {!!roots.length && <Link href="/quiz" className="text-sm font-semibold text-teal-800 underline">Take a diagnostic quiz →</Link>}
      </div>
      {busy && <p role="status" className="text-sm text-slate-500">This can take a few minutes. Mapping runs sequentially to respect AI rate limits.</p>}
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
      {message && <p role="status" className="rounded-xl bg-teal-50 p-4 text-teal-900">{message}</p>}
      {loading ? <p role="status">Loading topics…</p> : !roots.length ? <p className="text-slate-500">No topic map yet. <Link className="underline" href="/upload">Upload your syllabus</Link>, then build it here. Uploads never automatically replace an existing map.</p> : (
        <div className="grid gap-5 sm:grid-cols-2">{roots.map((topic) => {
          const count = data.mappings.filter((mapping) => mapping.topic_id === topic.id).length;
          return <article key={topic.id} className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold">{topic.name}</h2>
            <ul className="my-4 list-inside list-disc space-y-2 text-sm text-slate-600">{data.topics.filter((child) => child.parent_id === topic.id).map((child) => <li key={child.id}>{child.name}</li>)}</ul>
            <p className="text-sm text-teal-800">{count} past-paper questions · exam weight {topic.weight}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true"><div className="h-full rounded-full bg-teal-600" style={{ width: `${count / max * 100}%` }} /></div>
          </article>;
        })}</div>
      )}
    </div>
  );
}
