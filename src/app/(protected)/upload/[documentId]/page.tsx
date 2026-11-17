import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/api";
import { DOCUMENT_PAGE_SIZE, loadDocumentView } from "@/lib/documents/view";
import { PageHeader } from "@/components/ui/page-header";
import { Icon } from "@/components/ui/icon";

export default async function DocumentPage({ params, searchParams }: {
  params: Promise<{ documentId: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const user = await requireUser();
  const { documentId } = await params;
  const { page, q } = await searchParams;
  const supabase = await createClient();
  let view;
  try {
    view = await loadDocumentView(supabase, user.sub, { id: documentId, page, query: q });
  } catch (error) {
    if (!(error instanceof AppError)) throw error;
    return <section className="space-y-5">
      <h1 className="page-title">Couldn&apos;t open this document</h1>
      <p role="alert" className="notice-error">{error.message}</p>
      <Link className="button-primary" href="/upload">Back to your library →</Link>
    </section>;
  }
  const { document, passages, total, query, offset } = view;
  const pageCount = Math.max(1, Math.ceil(total / DOCUMENT_PAGE_SIZE));
  const pageLink = (number: number) => `/upload/${documentId}?${new URLSearchParams({ page: String(number), ...(query ? { q: query } : {}) })}`;
  return <section>
    <Link href="/upload" className="button-secondary mb-6">← Back to library</Link>
    <PageHeader eyebrow="Your resource viewer" icon="book" badge={String(document.kind).replace("_", " ")}
      title={String(document.name)} description="Read the saved source material used by your topic map, quizzes, and explanations." />
    <div className="notice-success mt-6">
      This is extracted text, not the original PDF or file layout. Passages are sorted by section label and may overlap.
      Original page order and formatting are not stored. No AI-generated content is added here.
    </div>
    <form className="surface mt-6 flex flex-wrap items-end gap-3 p-5" action={`/upload/${documentId}`}>
      <label className="min-w-0 flex-1 text-sm font-semibold text-slate-700">Find text in this document
        <input type="search" name="q" defaultValue={query} maxLength={100} placeholder="Try a topic, formula, or keyword" className="mt-2" />
      </label>
      <button className="button-primary">Search document</button>
      {query && <Link href={`/upload/${documentId}`} className="button-secondary">Clear search</Link>}
    </form>
    <p role="status" className="my-5 text-sm text-slate-500">
      {total ? `${offset < total ? offset + 1 : 0}–${Math.min(offset + passages.length, total)} of ${total} saved passages` : query ? "No passages match your search." : "No readable passages are saved for this document."}
      {query && <> matching &ldquo;{query}&rdquo;</>}
    </p>
    <div className="space-y-5">
      {passages.map((passage) => <article key={String(passage.id)} className="surface p-6 sm:p-8">
        <h2 className="mb-4 flex items-start gap-2 text-sm font-bold text-teal-800">
          <Icon name="file" className="h-4 w-4 shrink-0" />{String(passage.section ?? "Source passage")}
        </h2>
        <p className="whitespace-pre-wrap break-words text-base leading-8 text-slate-700">{String(passage.content)}</p>
      </article>)}
    </div>
    {!passages.length && <div className="surface p-6 text-sm text-slate-600">
      {view.page > 1 ? <Link href={pageLink(1)} className="font-semibold text-teal-800 underline">Return to the first page</Link>
        : query ? "Try a different keyword or clear the search to browse all saved passages." : "Try uploading the document again with selectable text."}
    </div>}
    {total > DOCUMENT_PAGE_SIZE && <nav aria-label="Document pages" className="mt-6 flex flex-wrap items-center justify-between gap-4">
      {view.page > 1 ? <Link href={pageLink(view.page - 1)} className="button-secondary">← Previous passages</Link> : <span />}
      <span className="text-sm text-slate-500">Page {view.page} of {pageCount}</span>
      {view.page < pageCount && <Link href={pageLink(view.page + 1)} className="button-primary">Next passages →</Link>}
    </nav>}
    <div className="mt-8 flex flex-wrap gap-3">
      <Link href="/topics" className="button-primary">Next: build topic map →</Link>
      <Link href="/chat" className="button-secondary">Ask about your material</Link>
    </div>
  </section>;
}
