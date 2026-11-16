import "server-only";

import { z } from "zod";
import { checkDb, type DbClient } from "@/lib/api";
import { topicSchema } from "@/lib/ai/schemas";
import { scoreTopic } from "@/lib/scoring/mastery";
import { savedPlanSchema } from "@/lib/plans/schema";

export async function loadProgress(supabase: DbClient, userId: string) {
  const attemptsResult = await supabase.from("attempts").select("id,submitted_at,question_ids")
    .eq("user_id", userId).not("submitted_at", "is", null).order("submitted_at", { ascending: false }).limit(20);
  checkDb(attemptsResult.error);
  const attempts = z.array(z.object({ id: z.string(), submitted_at: z.string(), question_ids: z.array(z.string()) })).parse(attemptsResult.data ?? []).reverse();
  const topicResult = await supabase.from("topics").select("id,name,parent_id,weight").eq("user_id", userId).is("parent_id", null).order("created_at");
  checkDb(topicResult.error);
  const topics = z.array(topicSchema).parse(topicResult.data ?? []);
  const ids = [...new Set(attempts.flatMap((attempt) => attempt.question_ids))];
  let questions: { id: string; topic_id: string; correct_index: number }[] = [];
  let answers: { attempt_id: string; question_id: string; selected_index: number; confidence: "sure" | "guessing" }[] = [];
  if (ids.length) {
    const questionResult = await supabase.from("questions").select("id,topic_id,correct_index").eq("user_id", userId).in("id", ids);
    checkDb(questionResult.error);
    questions = z.array(z.object({ id: z.string(), topic_id: z.string(), correct_index: z.number() })).parse(questionResult.data ?? []);
    const answerResult = await supabase.from("answers").select("attempt_id,question_id,selected_index,confidence")
      .eq("user_id", userId).in("attempt_id", attempts.map((attempt) => attempt.id));
    checkDb(answerResult.error);
    answers = z.array(z.object({ attempt_id: z.string(), question_id: z.string(), selected_index: z.number(), confidence: z.enum(["sure", "guessing"]) })).parse(answerResult.data ?? []);
  }
  const progress = attempts.map((attempt) => ({
    id: attempt.id, submittedAt: attempt.submitted_at,
    scores: topics.map((topic) => scoreTopic(topic, answers.filter((answer) => answer.attempt_id === attempt.id && attempt.question_ids.includes(answer.question_id))
      .flatMap((answer) => {
        const question = questions.find((item) => item.id === answer.question_id && item.topic_id === topic.id);
        return question ? [{ correct: answer.selected_index === question.correct_index, confidence: answer.confidence, misconception: null }] : [];
      }))),
  }));
  const plan = await supabase.from("plans").select("id,attempt_id,created_at,days,hours_per_day,data")
    .eq("user_id", userId).order("created_at", { ascending: false }).limit(1);
  checkDb(plan.error);
  return { topics, progress, latestPlan: plan.data?.[0] ? savedPlanSchema.parse(plan.data[0]) : null };
}
