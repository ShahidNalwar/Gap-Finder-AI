import "server-only";

import { z } from "zod";
import { checkDb, type DbClient, type DocumentKind } from "@/lib/api";

export const passageSchema = z.object({
  id: z.string().uuid(),
  document_id: z.string().uuid(),
  content: z.string(),
  section: z.string().nullable(),
  kind: z.string(),
  rank: z.number(),
});
export type Passage = z.infer<typeof passageSchema>;

export function keywords(query: string) {
  return [...new Set(query.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? [])]
    .filter((word) => !["the", "and", "for", "this", "that", "explain", "what", "how", "does", "are", "from", "with", "please"].includes(word))
    .slice(0, 24);
}

export async function searchChunks(supabase: DbClient, query: string, k = 6, kinds?: DocumentKind[]): Promise<Passage[]> {
  const words = keywords(query);
  if (!words.length) return [];
  const { data, error } = await supabase.rpc("search_chunks", {
    q: words.join(" or "),
    k: Math.min(12, Math.max(1, k)),
    kinds: kinds ?? null,
  });
  checkDb(error);
  return z.array(passageSchema).parse(data ?? []);
}

const noteChunkSchema = passageSchema.omit({ kind: true, rank: true }).extend({
  documents: z.object({ kind: z.literal("notes") }),
});

function noteChunks(supabase: DbClient) {
  // The inner join enforces the notes kind; RLS applies to both tables.
  return supabase.from("chunks")
    .select("id,document_id,content,section,documents!inner(kind)")
    .eq("documents.kind", "notes");
}

function asPassages(rows: unknown): Passage[] {
  return z.array(noteChunkSchema).parse(rows ?? []).map(({ documents, ...chunk }) => ({
    ...chunk, kind: documents.kind, rank: 0,
  }));
}

export async function searchTopicNotes(
  supabase: DbClient,
  topic: { name: string; subtopics: string[]; sourceChunkIds?: string[] },
  k = 3,
): Promise<Passage[]> {
  const limit = Math.min(12, Math.max(1, k));
  const query = [topic.name, ...topic.subtopics].join(" ");
  const found = new Map<string, Passage>();

  // Exact citations remain reliable even when topic names never occur in body text.
  const ids = [...new Set(topic.sourceChunkIds ?? [])].slice(0, 12);
  if (ids.length) {
    const result = await noteChunks(supabase).in("id", ids).limit(limit);
    checkDb(result.error);
    asPassages(result.data).forEach((passage) => found.set(passage.id, passage));
  }
  if (found.size < limit) {
    const matches = await searchChunks(supabase, query, limit, ["notes"]);
    matches.forEach((passage) => { if (!found.has(passage.id)) found.set(passage.id, passage); });
  }
  if (found.size < limit) {
    // Headings are saved separately from the full-text body index.
    // Only alphanumeric tokens enter PostgREST's filter expression.
    const words = keywords(query).slice(0, 12);
    if (words.length) {
      const result = await noteChunks(supabase)
        .or(words.map((word) => `section.ilike.%${word}%`).join(",")).limit(limit);
      checkDb(result.error);
      asPassages(result.data).forEach((passage) => { if (!found.has(passage.id)) found.set(passage.id, passage); });
    }
  }
  return [...found.values()].slice(0, limit);
}
