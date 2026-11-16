import { z } from "zod";
import { apiUser, apiError, checkDb, json } from "@/lib/api";
import { planInputSchema } from "@/lib/plans/schema";
import { generatePlan } from "@/lib/plans/generate";

export const maxDuration = 300;

export async function GET(request: Request) {
  try {
    const { supabase, userId } = await apiUser();
    const id = new URL(request.url).searchParams.get("attempt");
    let query = supabase.from("plans").select("id,attempt_id,created_at,days,hours_per_day,data").eq("user_id", userId);
    if (id) query = query.eq("attempt_id", z.string().uuid().parse(id));
    const result = await query.order("created_at", { ascending: false }).limit(1);
    checkDb(result.error);
    const attempt = await supabase.from("attempts").select("id").eq("user_id", userId).not("submitted_at", "is", null).order("submitted_at", { ascending: false }).limit(1);
    checkDb(attempt.error);
    return json({ plan: result.data?.[0] ?? null, latestAttemptId: attempt.data?.[0]?.id ?? null });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const { supabase, userId } = await apiUser(request);
    const input = planInputSchema.parse(await request.json());
    return json(await generatePlan(supabase, userId, input.attemptId, input.days, input.hoursPerDay));
  } catch (error) { return apiError(error); }
}
