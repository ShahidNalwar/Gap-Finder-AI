import "server-only";

import { AppError, checkDb, type DbClient } from "@/lib/api";
import { buildReport } from "@/lib/reports/build";
import { createPlan } from "@/lib/scoring/plan";
import { savedPlanSchema } from "@/lib/plans/schema";
import { searchTopicNotes } from "@/lib/retrieval/search";
import { structured } from "@/lib/ai/model";
import { tipsSchema } from "@/lib/ai/schemas";
import { prompts } from "@/lib/ai/prompts";

export async function generatePlan(supabase: DbClient, userId: string, attemptId: string, days: number, hoursPerDay: number) {
  const report = await buildReport(supabase, userId, attemptId);
  const oldResult = await supabase.from("plans").select("id,attempt_id,created_at,days,hours_per_day,data")
    .eq("user_id", userId).neq("attempt_id", attemptId).order("created_at", { ascending: false }).limit(1);
  checkDb(oldResult.error);
  const previous = oldResult.data?.[0] ? savedPlanSchema.parse(oldResult.data[0]) : undefined;
  let plan;
  try { plan = createPlan(report.scores, days, hoursPerDay, previous?.data); }
  catch (error) { throw new AppError(error instanceof Error ? error.message : "Invalid time budget."); }
  const warnings: string[] = [];
  for (const item of plan.items) {
    const passages = await searchTopicNotes(supabase, {
      name: item.name,
      subtopics: report.topics.filter((topic) => topic.parent_id === item.topicId).map((topic) => topic.name),
      sourceChunkIds: report.reviews.filter((review) => review.topic_id === item.topicId).map((review) => review.chunk_id),
    });
    if (!passages.length) {
      warnings.push(`${item.name}: source-based tips are temporarily unavailable; your revision schedule is still saved.`);
      continue;
    }
    const facts = report.scores.find((score) => score.id === item.topicId)!;
    try {
      // Retrieved notes for this topic; generate only two tips, never order, priority, or minutes.
      const result = await structured(tipsSchema, prompts.tips, { topic: item.name, mastery: facts.mastery, mistakes: facts.reason, passages }, true);
      item.tips = result.tips;
    } catch {
      warnings.push(`${item.name}: AI tips unavailable; the calculated schedule is still saved.`);
      item.tips = [
        `Read ${passages[0].section ?? "the cited source"} and summarize ${item.name} using only those notes.`,
        `Retake the questions on ${item.name}, then check each answer against ${passages[0].section ?? "your uploaded notes"}.`,
      ];
    }
  }
  const result = await supabase.from("plans").insert({
    user_id: userId, attempt_id: attemptId, days, hours_per_day: hoursPerDay, data: plan,
  }).select("id,attempt_id,created_at,days,hours_per_day,data").single();
  checkDb(result.error);
  return { plan: savedPlanSchema.parse(result.data), warnings };
}

export async function updatePlanAfterAttempt(supabase: DbClient, userId: string, attemptId: string) {
  const existing = await supabase.from("plans").select("id").eq("user_id", userId).eq("attempt_id", attemptId).limit(1);
  checkDb(existing.error);
  if (existing.data?.length) return;
  const latest = await supabase.from("plans").select("days,hours_per_day").eq("user_id", userId)
    .order("created_at", { ascending: false }).limit(1);
  checkDb(latest.error);
  if (latest.data?.[0]) {
    await generatePlan(supabase, userId, attemptId, Number(latest.data[0].days), Number(latest.data[0].hours_per_day));
  }
}
