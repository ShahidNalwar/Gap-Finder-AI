import { z } from "zod";
import { apiUser, apiError, checkDb, json } from "@/lib/api";
import { buildTopics } from "@/lib/topics/build";

export const maxDuration = 300;

export async function GET() {
  try {
    const { supabase, userId } = await apiUser();
    const result = await supabase.from("topics").select("id,name,parent_id,weight").eq("user_id", userId).order("created_at");
    checkDb(result.error);
    const questions = await supabase.from("past_questions").select("topic_id").eq("user_id", userId);
    checkDb(questions.error);
    return json({ topics: result.data ?? [], mappings: questions.data ?? [] });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const { supabase, userId } = await apiUser(request);
    const input = z.object({ rebuild: z.boolean().default(false) }).parse(await request.json());
    return json(await buildTopics(supabase, userId, input.rebuild));
  } catch (error) { return apiError(error); }
}
