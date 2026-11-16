import { readFile } from "node:fs/promises";
import path from "node:path";
import { apiUser, apiError, AppError, checkDb, json, type DocumentKind } from "@/lib/api";
import { ingestDocument } from "@/lib/documents/ingest";
import { SAMPLE_PACK } from "@/lib/documents/sample-pack";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { supabase, userId } = await apiUser(request);
    const existing = await supabase.from("documents").select("name").eq("user_id", userId);
    checkDb(existing.error);
    if (existing.data?.some((document) => !String(document.name).startsWith(`${SAMPLE_PACK.documentPrefix}: `))) {
      throw new AppError("This account already has study material. Use Reset study workspace on Upload (this deletes study data after confirmation), or use a fresh test account for the Electricity sample. Nothing has been changed by this request.", 409);
    }
    let loaded = 0;
    for (const kind of ["syllabus", "notes", "past_paper"] as DocumentKind[]) {
      const name = `${SAMPLE_PACK.documentPrefix}: ${kind}.txt`;
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
