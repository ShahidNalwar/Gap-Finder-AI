import "server-only";

import { AppError, checkDb, type DbClient, type DocumentKind } from "@/lib/api";
import { chunkText, type TextPage } from "@/lib/retrieval/chunk";

export async function ingestDocument(supabase: DbClient, userId: string, name: string, kind: DocumentKind, pages: TextPage[]) {
  const total = pages.reduce((sum, page) => sum + page.text.length, 0);
  if (total > 200_000) throw new AppError("This document is too long. Upload a chapter at a time (maximum 200,000 characters).");
  const chunks = chunkText(pages);
  if (!chunks.length) throw new AppError("No readable text was found. Scanned PDFs need OCR first; try a text-based PDF or .txt file.");
  const { data, error } = await supabase.from("documents")
    .insert({ user_id: userId, name: name.slice(0, 200), kind }).select("id").single();
  checkDb(error);
  if (!data) throw new AppError("Couldn't create the document. Please try again.", 503);
  const id = String(data.id);
  const { error: chunkError } = await supabase.from("chunks").insert(
    chunks.map((chunk) => ({ ...chunk, user_id: userId, document_id: id })),
  );
  if (chunkError) {
    // Roll back the parent so a failed upload never looks ready for retrieval.
    await supabase.from("documents").delete().eq("id", id).eq("user_id", userId);
    checkDb(chunkError);
  }
  return { id, chunks: chunks.length };
}
