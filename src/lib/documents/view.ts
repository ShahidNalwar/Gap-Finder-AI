import "server-only";

import { z } from "zod";
import { AppError, checkDb, type DbClient } from "../api";

export const DOCUMENT_PAGE_SIZE = 24;
const inputSchema = z.object({
  id: z.uuid(),
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  query: z.string().trim().max(100).default(""),
});

export async function loadDocumentView(
  supabase: DbClient, userId: string,
  input: { id: string; page?: string; query?: string },
) {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) throw new AppError("This document link or search is invalid. Open the document again from your library.");
  const { id, page, query } = parsed.data;
  const document = await supabase.from("documents").select("id,name,kind,created_at")
    .eq("user_id", userId).eq("id", id).maybeSingle();
  checkDb(document.error);
  // Missing and foreign documents have the same response, before reading passages.
  if (!document.data) throw new AppError("Document not found. It may have been removed or belong to another account.", 404);

  let passages = supabase.from("chunks").select("id,section,content", { count: "exact" })
    .eq("user_id", userId).eq("document_id", id);
  if (query) {
    // Treat search as literal text, not a user-supplied SQL LIKE pattern.
    passages = passages.ilike("content", `%${query.replace(/[\\%_]/g, "\\$&")}%`);
  }
  const offset = (page - 1) * DOCUMENT_PAGE_SIZE;
  // Legacy chunks have no source-position field; provide stable passage browsing,
  // not a reconstruction that pretends to preserve the original file order.
  const result = await passages.order("section", { ascending: true }).order("id", { ascending: true })
    .range(offset, offset + DOCUMENT_PAGE_SIZE - 1);
  checkDb(result.error);
  return {
    document: document.data, passages: result.data ?? [],
    total: result.count ?? 0, page, query, offset,
  };
}
