import { apiUser, apiError, json } from "@/lib/api";
import { submissionSchema } from "@/lib/ai/schemas";
import { submitQuiz } from "@/lib/quiz/submit";
import { updatePlanAfterAttempt } from "@/lib/plans/generate";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const { supabase, userId } = await apiUser(request);
    const result = await submitQuiz(supabase, userId, submissionSchema.parse(await request.json()));
    let planWarning: string | null = null;
    try { await updatePlanAfterAttempt(supabase, userId, result.attemptId); }
    catch { planWarning = "Your answers are saved. Open Plan to retry updating your schedule."; }
    return json({ ...result, planWarning });
  } catch (error) { return apiError(error); }
}
