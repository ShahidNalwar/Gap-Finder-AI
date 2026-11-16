import { readFile } from "node:fs/promises";
import path from "node:path";
import { apiUser, apiError, checkDb, json, type DocumentKind } from "@/lib/api";
import { ingestDocument } from "@/lib/documents/ingest";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { supabase, userId } = await apiUser(request);
    let loaded = 0;
    for (const kind of ["syllabus", "notes", "past_paper"] as DocumentKind[]) {
      const name = `Sample: ${kind}.txt`;
      const { data, error } = await supabase.from("documents").select("id")
        .eq("user_id", userId).eq("name", name).eq("kind", kind).limit(1);
      checkDb(error);
      if (data?.length) continue;
      const text = await readFile(path.join(process.cwd(), "sample-data", `${kind}.txt`), "utf8");
      await ingestDocument(supabase, userId, name, kind, [{ page: 1, text }]);
      loaded++;
    }
    return json({ loaded });
  } catch (error) { return apiError(error); }
}
