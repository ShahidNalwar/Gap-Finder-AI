import "server-only";

import { z } from "zod";
import { AppError, checkDb, type DbClient } from "@/lib/api";
import { publicQuestionSchema, storedQuestionSchema } from "@/lib/ai/schemas";

export async function startQuiz(supabase: DbClient, userId: string) {
  const topics = await supabase.from("topics").select("id,name").eq("user_id", userId)
    .is("parent_id", null).order("created_at").limit(6);
  checkDb(topics.error);
  const questions = [];
  for (const topic of topics.data ?? []) {
    const result = await supabase.from("questions").select("id,topic_id,chunk_id,question,options,correct_index,explanation,misconceptions,source_quote")
      .eq("user_id", userId).eq("topic_id", topic.id).order("created_at", { ascending: false }).limit(2);
    checkDb(result.error);
    questions.push(...z.array(storedQuestionSchema).parse(result.data ?? []));
  }
  if (!questions.length) throw new AppError("Prepare your quiz first. If no questions pass, upload more detailed notes.");
  const chunks = await supabase.from("chunks").select("id,section").eq("user_id", userId)
    .in("id", [...new Set(questions.map((question) => question.chunk_id))]);
  checkDb(chunks.error);
  const sections = z.array(z.object({ id: z.string(), section: z.string().nullable() })).parse(chunks.data ?? []);
  const publicQuestions = questions.map((question) => publicQuestionSchema.parse({
    ...question,
    section: sections.find((chunk) => chunk.id === question.chunk_id)?.section ?? "Uploaded source",
    topic: topics.data?.find((topic) => topic.id === question.topic_id)?.name ?? "Topic",
  }));
  const attempt = await supabase.from("attempts").insert({
    user_id: userId, question_ids: publicQuestions.map((question) => question.id),
  }).select("id").single();
  checkDb(attempt.error);
  if (!attempt.data) throw new AppError("Couldn't start the quiz. Please try again.", 503);
  return { attemptId: String(attempt.data.id), questions: publicQuestions };
}
