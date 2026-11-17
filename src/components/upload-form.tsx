"use client";

import Link, { useLinkStatus } from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { requestJson } from "@/lib/http";
import { Icon } from "@/components/ui/icon";
import { SAMPLE_PACK } from "@/lib/documents/sample-pack";
import { WorkspaceReset } from "@/components/workspace-reset";

const documentSchema = z.object({ id: z.string(), name: z.string(), kind: z.string(), created_at: z.string() });
const documentsSchema = z.object({ documents: z.array(documentSchema) });
const searchSchema = z.object({ passages: z.array(z.object({ id: z.string(), content: z.string(), section: z.string().nullable(), kind: z.string() })) });

function ViewDocumentLabel() {
  const { pending } = useLinkStatus();
  return <span className="inline-flex min-w-32 items-center justify-center gap-2" role={pending ? "status" : undefined}>
    {pending ? <span className="navigation-spinner h-4 w-4" aria-hidden="true" /> : <Icon name="book" className="h-4 w-4" />}
    {pending ? "Opening…" : "View document"}
  </span>;
}

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
      {error && <p role="alert" className="notice-error">{error}</p>}
      {message && <p role="status" className="notice-success">{message}</p>}
      <div className="grid gap-6 lg:grid-cols-5">
        <form onSubmit={upload} className="surface space-y-6 p-6 sm:p-7 lg:col-span-3">
          <div className="flex items-center gap-3"><span className="icon-tile"><Icon name="upload" /></span><div><h2 className="text-lg font-semibold text-slate-900">Add your study material</h2><p className="mt-1 text-xs text-slate-400">One document at a time. All in one place.</p></div></div>
          <label className="block text-sm font-semibold">Document type
            <select name="kind" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm font-normal" disabled={!!busy}>
              <option value="syllabus">Syllabus</option><option value="notes">Notes / textbook</option><option value="past_paper">Past paper</option>
            </select>
          </label>
          <label className="block rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-5 text-sm font-semibold text-slate-600">
            <span className="flex items-center gap-2"><Icon name="file" className="h-4 w-4 text-teal-700" />Choose a PDF or text file</span>
            <input className="mt-4 !border-0 !bg-transparent !p-0 text-xs font-normal" type="file" name="file" accept=".pdf,.txt" required disabled={!!busy} />
          </label>
          <p className="text-xs leading-5 text-slate-500">Up to 3 MB. PDFs must contain selectable text. Documents stay private to your account.</p>
          <p className="text-sm font-semibold text-teal-800">Please click the Upload material button to upload your resources.</p>
          <div className="flex flex-wrap items-center justify-between gap-3"><button className="button-primary" disabled={!!busy}><Icon name="upload" className="h-4 w-4" />{busy === "upload" ? "Extracting and saving…" : "Upload material"}</button><span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400"><Icon name="shield" className="h-3.5 w-3.5" />Only visible to you</span></div>
        </form>
        <section className="relative flex flex-col overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-emerald-50/50 p-6 sm:p-7 lg:col-span-2">
          <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-100 bg-white text-teal-800"><Icon name="book" className="h-6 w-6" /></span>
          <p className="eyebrow">Just exploring?</p>
          <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-teal-950">Try it with a ready-made subject.</h2>
          <p className="mt-4 text-sm leading-7 text-teal-900/65">Explore {SAMPLE_PACK.level} with a complete {SAMPLE_PACK.name} study pack. No files to hunt for.</p>
          <div className="my-6 flex flex-wrap gap-2">{["1 syllabus", "4 topics", "10 exam questions"].map((label) => <span key={label} className="rounded-lg border border-teal-100 bg-white/80 px-2.5 py-1.5 text-[11px] font-semibold text-teal-800">{label}</span>)}</div>
          <button className="button-secondary mt-auto self-start !border-teal-200 !text-teal-900" onClick={sample} disabled={!!busy}>{busy === "sample" ? "Loading sample…" : "Load sample data"}<Icon name="arrow" className="h-4 w-4" /></button>
          <p className="mt-4 text-[11px] leading-5 text-teal-900/55">Use a fresh account, or <a href="#reset-heading" className="font-semibold underline underline-offset-2">reset your study workspace below</a>. Loading the sample never replaces existing data or adds duplicate sample files.</p>
        </section>
      </div>
      <section className="surface p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-3 text-lg font-semibold text-slate-900">Your library {!loading && <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">{documents.length}</span>}</h2>
          {!!documents.length && <Link className="button-primary" href="/topics">Next: build topic map<Icon name="arrow" className="h-4 w-4" /></Link>}
        </div>
        {loading ? <p role="status" className="mt-6 animate-pulse text-sm text-slate-400">Loading your library…</p> : !documents.length ? <div className="mt-5 flex flex-col items-center rounded-xl border border-dashed border-slate-200 px-4 py-9 text-center"><Icon name="file" className="mb-3 h-8 w-8 text-slate-300" /><p className="text-sm font-semibold text-slate-600">A fresh start.</p><p className="mt-2 max-w-sm text-xs leading-6 text-slate-400">Your documents will appear here. Add a syllabus and notes, or explore with the sample pack.</p></div> : (
          <ul className="mt-4 divide-y divide-slate-100">{documents.map((document) => (
            <li key={document.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400"><Icon name="file" className="h-5 w-5" /></span><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-700" title={document.name}>{document.name}</p><p className="mt-1 text-[11px] text-slate-400">Added {new Date(document.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}</p></div></div>
              <div className="flex shrink-0 flex-wrap items-center gap-3"><span className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide ${document.kind === "syllabus" ? "bg-teal-50 text-teal-700" : document.kind === "past_paper" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{document.kind.replace("_", " ")}</span>
                <Link className="button-secondary" href={`/upload/${document.id}`} aria-label={`View ${document.name}`}><ViewDocumentLabel /></Link>
              </div>
            </li>
          ))}</ul>
        )}
      </section>
      <details className="surface p-6">
        <summary className="cursor-pointer text-sm font-semibold text-slate-600">Look inside your sources <span className="ml-2 text-xs font-normal text-slate-400">Check source retrieval</span></summary>
        <form onSubmit={search} className="mt-5 flex flex-wrap gap-3">
          <input name="query" aria-label="Search uploaded material" placeholder={`Try ${SAMPLE_PACK.searchExample}`} minLength={2} maxLength={200} required className="min-w-0 flex-1" />
          <button className="button-secondary" disabled={!!busy}>{busy === "search" ? "Searching…" : "Search"}</button>
        </form>
        {passages && (passages.length ? passages.map((passage) => <blockquote key={passage.id} className="mt-5 border-l-2 border-teal-600 pl-4 text-sm leading-6"><strong>{passage.section ?? "Source"} · {passage.kind}</strong><p>{passage.content}</p></blockquote>) : <p className="mt-4 text-slate-500">No matching passages found.</p>)}
      </details>
      <WorkspaceReset disabled={loading || !!busy} onBusyChange={(pending) => setBusy(pending ? "reset" : "")} />
    </div>
  );
}
