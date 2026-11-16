import { apiUser, apiError, json, kindSchema, AppError, checkDb } from "@/lib/api";
import { ingestDocument } from "@/lib/documents/ingest";
import { extractPdf } from "@/lib/pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  try {
    const { supabase, userId } = await apiUser();
    const { data, error } = await supabase.from("documents").select("id,name,kind,created_at")
      .eq("user_id", userId).order("created_at", { ascending: false });
    checkDb(error);
    return json({ documents: data ?? [] });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const { supabase, userId } = await apiUser(request);
    if (Number(request.headers.get("content-length")) > 4 * 1024 * 1024) {
      throw new AppError("Choose a file smaller than 3 MB.");
    }
    const form = await request.formData();
    const kind = kindSchema.parse(form.get("kind"));
    const file = form.get("file");
    if (!(file instanceof File) || !file.size) throw new AppError("Choose a PDF or text file.");
    if (file.size > 3 * 1024 * 1024) throw new AppError("Choose a file smaller than 3 MB.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const pdf = file.name.toLowerCase().endsWith(".pdf");
    if (!pdf && !file.name.toLowerCase().endsWith(".txt")) throw new AppError("Only .pdf and .txt files are supported.");
    if (pdf && new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") throw new AppError("This isn't a valid PDF.");
    const pages = pdf ? await extractPdf(bytes) : [{ page: 1, text: new TextDecoder("utf-8", { fatal: true }).decode(bytes) }];
    return json(await ingestDocument(supabase, userId, file.name, kind, pages));
  } catch (error) { return apiError(error); }
}
