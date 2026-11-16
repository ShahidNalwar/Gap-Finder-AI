import "server-only";

import { z } from "zod";
import { AppError, checkDb, type DbClient } from "@/lib/api";
import { savedPlanSchema } from "@/lib/plans/schema";
import { buildReport } from "@/lib/reports/build";

export async function loadRevisionSheet(supabase: DbClient, userId: string, planId: string) {
  if (!z.string().uuid().safeParse(planId).success) throw new AppError("Revision plan not found.", 404);
  const result = await supabase.from("plans").select("id,attempt_id,created_at,days,hours_per_day,data")
    .eq("user_id", userId).eq("id", planId).maybeSingle();
  checkDb(result.error);
  if (!result.data) throw new AppError("Revision plan not found.", 404);
  const plan = savedPlanSchema.parse(result.data);
  if (!plan.attempt_id) throw new AppError("This plan is not linked to a diagnostic. Create a new plan from your latest report.");
  const report = await buildReport(supabase, userId, plan.attempt_id);
  // Use this exact saved snapshot, not the latest plan or newly generated tips.
  return { plan, report };
}
