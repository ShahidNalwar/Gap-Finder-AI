import { z } from "zod";
import { apiUser, apiError, json } from "@/lib/api";
import { searchChunks } from "@/lib/retrieval/search";

export async function GET(request: Request) {
  try {
    const { supabase } = await apiUser();
    const query = z.string().trim().min(2).max(200).parse(new URL(request.url).searchParams.get("q"));
    return json({ passages: await searchChunks(supabase, query) });
  } catch (error) { return apiError(error); }
}
