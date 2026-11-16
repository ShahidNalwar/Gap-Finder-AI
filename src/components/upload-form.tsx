"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { requestJson } from "@/lib/http";

const documentSchema = z.object({ id: z.string(), name: z.string(), kind: z.string(), created_at: z.string() });
const documentsSchema = z.object({ documents: z.array(documentSchema) });
const searchSchema = z.object({ passages: z.array(z.object({ id: z.string(), content: z.string(), section: z.string().nullable(), kind: z.string() })) });

export function UploadForm() {
  const [documents, setDocuments] = useState<z.infer<typeof documentSchema>[]>([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [passages, setPassages] = useState<z.infer<typeof searchSchema>["passages"] | null>(null);

  async function refresh() {
    const result = await requestJson("/api/upload", documentsSchema);
    setDocuments(result.documents);
  }
  useEffect(() => { refresh().catch((e: Error) => setError(e.message)).finally(() => setLoading(false)); }, []);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = new FormData(form);
    setBusy("upload"); setError(""); setMessage("");
    try {
      const result = await requestJson("/api/upload", z.object({ chunks: z.number() }), { method: "POST", body });
      setMessage(`Upload ready: ${result.chunks} passages saved.`);
      form.reset();
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Upload failed."); }
    finally { setBusy(""); }
  }

  async function sample() {
    setBusy("sample"); setError(""); setMessage("");
    try {
      const result = await requestJson("/api/upload/sample", z.object({ loaded: z.number() }), { method: "POST" });
      setMessage(result.loaded ? `${result.loaded} sample documents loaded.` : "Sample documents are already loaded.");
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't load sample data."); }
    finally { setBusy(""); }
  }

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = new FormData(event.currentTarget).get("query");
    setBusy("search"); setError("");
    try { setPassages((await requestJson(`/api/search?q=${encodeURIComponent(String(q))}`, searchSchema)).passages); }
    catch (e) { setError(e instanceof Error ? e.message : "Search failed."); }
    finally { setBusy(""); }
  }

  return (
    <div className="mt-8 space-y-8">
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
      {message && <p role="status" className="rounded-xl bg-teal-50 p-4 text-teal-900">{message}</p>}
      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={upload} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold">Upload your material</h2>
          <label className="block text-sm font-semibold">Document type
            <select name="kind" className="mt-2 w-full rounded-lg border border-slate-300 p-3" disabled={!!busy}>
              <option value="syllabus">Syllabus</option><option value="notes">Notes / textbook</option><option value="past_paper">Past paper</option>
            </select>
          </label>
          <label className="block text-sm font-semibold">PDF or text file
            <input className="mt-2" type="file" name="file" accept=".pdf,.txt" required disabled={!!busy} />
          </label>
          <p className="text-xs leading-5 text-slate-500">Up to 3 MB. PDFs must contain selectable text. Documents stay private to your account.</p>
          <button className="button-primary" disabled={!!busy}>{busy === "upload" ? "Extracting and saving…" : "Upload material"}</button>
        </form>
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold">Try the complete sample</h2>
          <p className="my-4 leading-7 text-slate-500">Class 10 Science: a syllabus, chapter notes, and ten past-paper questions covering four Life Processes topics.</p>
          <button className="button-secondary" onClick={sample} disabled={!!busy}>{busy === "sample" ? "Loading sample…" : "Load sample data"}</button>
          <p className="mt-5 text-sm text-slate-500">Already-loaded sample files won&apos;t be added again.</p>
        </section>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Your documents</h2>
          {!!documents.length && <Link className="text-sm font-semibold text-teal-800 underline" href="/topics">Build your topic map →</Link>}
        </div>
        {loading ? <p role="status" className="mt-4">Loading documents…</p> : !documents.length ? <p className="mt-4 text-slate-500">No material yet. Upload a syllabus and notes, or load the sample above.</p> : (
          <ul className="mt-4 divide-y divide-slate-100">{documents.map((document) => (
            <li key={document.id} className="flex flex-wrap justify-between gap-2 py-3"><span className="break-all">{document.name}</span><span className="text-sm text-slate-500">{document.kind.replace("_", " ")}</span></li>
          ))}</ul>
        )}
      </section>
      <details className="rounded-2xl border border-slate-200 bg-white p-6">
        <summary className="cursor-pointer font-semibold">Check source retrieval</summary>
        <form onSubmit={search} className="mt-5 flex flex-wrap gap-3">
          <input name="query" aria-label="Search uploaded material" placeholder="Try chlorophyll" minLength={2} maxLength={200} required className="min-w-0 flex-1" />
          <button className="button-secondary" disabled={!!busy}>{busy === "search" ? "Searching…" : "Search"}</button>
        </form>
        {passages && (passages.length ? passages.map((passage) => <blockquote key={passage.id} className="mt-5 border-l-2 border-teal-600 pl-4 text-sm leading-6"><strong>{passage.section ?? "Source"} · {passage.kind}</strong><p>{passage.content}</p></blockquote>) : <p className="mt-4 text-slate-500">No matching passages found.</p>)}
      </details>
    </div>
  );
}
