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
