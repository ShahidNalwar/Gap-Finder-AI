import { apiUser, apiError, json } from "@/lib/api";
import { submissionSchema } from "@/lib/ai/schemas";
import { submitQuiz } from "@/lib/quiz/submit";

export async function POST(request: Request) {
  try {
    const { supabase, userId } = await apiUser(request);
    return json(await submitQuiz(supabase, userId, submissionSchema.parse(await request.json())));
  } catch (error) { return apiError(error); }
}
