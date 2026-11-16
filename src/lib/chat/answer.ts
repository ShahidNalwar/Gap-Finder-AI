import "server-only";

import type { DbClient } from "@/lib/api";
import { searchChunks } from "@/lib/retrieval/search";
import { structured } from "@/lib/ai/model";
import { prompts } from "@/lib/ai/prompts";
import { chatOutputSchema, REFUSAL, type ChatAnswer } from "@/lib/chat/schema";

export async function answerFromMaterial(supabase: DbClient, message: string): Promise<ChatAnswer> {
  const passages = await searchChunks(supabase, message, 4, ["notes", "syllabus"]);
  const refusal: ChatAnswer = { answer: REFUSAL, citations: [] };
  if (!passages.length) return refusal;

  // Retrieved at most four own passages; generate only a source-grounded explanation, not a memory answer.
  const result = await structured(chatOutputSchema, prompts.chat, { question: message, passages });
  if (!result.supported || !result.used_chunk_ids.length) return refusal;
  if (result.used_chunk_ids.some((id) => !passages.some((passage) => passage.id === id))) return refusal;
  const citations = [...new Set(result.used_chunk_ids)].map((id) => {
    const passage = passages.find((source) => source.id === id)!;
    return { id, section: passage.section ?? "Uploaded source", quote: passage.content };
  });
  return { answer: result.answer, citations };
}
