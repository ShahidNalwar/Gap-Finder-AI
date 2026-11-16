import { z } from "zod";
import { apiUser, apiError, json } from "@/lib/api";
import { generateQuiz } from "@/lib/quiz/generate";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const { supabase, userId } = await apiUser(request);
    const input = z.object({ regenerate: z.boolean().default(false) }).parse(await request.json());
    return json(await generateQuiz(supabase, userId, input.regenerate));
  } catch (error) { return apiError(error); }
}
