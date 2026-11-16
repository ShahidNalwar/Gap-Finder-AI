import { apiUser, apiError, json } from "@/lib/api";
import { startQuiz } from "@/lib/quiz/start";

export async function POST(request: Request) {
  try {
    const { supabase, userId } = await apiUser(request);
    return json(await startQuiz(supabase, userId));
  } catch (error) { return apiError(error); }
}
