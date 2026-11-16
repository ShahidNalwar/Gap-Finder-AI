import "server-only";

import { z } from "zod";
import { AppError, checkDb, type DbClient } from "@/lib/api";
import { storedQuestionSchema, topicSchema } from "@/lib/ai/schemas";
import { scoreTopic } from "@/lib/scoring/mastery";

const answerSchema = z.object({
  question_id: z.string().uuid(), selected_index: z.number().int(), confidence: z.enum(["sure", "guessing"]),
});

export async function buildReport(supabase: DbClient, userId: string, attemptId: string) {
  if (!z.string().uuid().safeParse(attemptId).success) throw new AppError("Report not found.", 404);
  const attempt = await supabase.from("attempts").select("id,created_at,submitted_at,question_ids")
    .eq("user_id", userId).eq("id", attemptId).maybeSingle();
  checkDb(attempt.error);
  if (!attempt.data?.submitted_at) throw new AppError("Submit this quiz before viewing its report.", 404);
  const ids = z.array(z.string().uuid()).min(1).parse(attempt.data.question_ids);
  const answersResult = await supabase.from("answers").select("question_id,selected_index,confidence")
    .eq("user_id", userId).eq("attempt_id", attemptId);
  checkDb(answersResult.error);
  const answers = z.array(answerSchema).parse(answersResult.data ?? []);
  const questionResult = await supabase.from("questions").select("id,topic_id,chunk_id,question,options,correct_index,explanation,misconceptions,source_quote")
    .eq("user_id", userId).in("id", ids);
  checkDb(questionResult.error);
  const questions = z.array(storedQuestionSchema).parse(questionResult.data ?? []);
  if (questions.length !== ids.length || answers.length !== ids.length || ids.some((id) => !answers.some((answer) => answer.question_id === id))) {
    throw new AppError("This attempt is incomplete or its source data is missing.", 409);
  }
  const topicsResult = await supabase.from("topics").select("id,name,parent_id,weight").eq("user_id", userId);
  checkDb(topicsResult.error);
  const topics = z.array(topicSchema).parse(topicsResult.data ?? []);
  const chunks = await supabase.from("chunks").select("id,section").eq("user_id", userId).in("id", questions.map((question) => question.chunk_id));
  checkDb(chunks.error);
  const sections = z.array(z.object({ id: z.string(), section: z.string().nullable() })).parse(chunks.data ?? []);
  const reviews = ids.map((id) => {
    const question = questions.find((item) => item.id === id)!;
    const answer = answers.find((item) => item.question_id === id)!;
    return {
      ...question, selectedIndex: answer.selected_index, confidence: answer.confidence,
      // Never trust the writable is_correct column for diagnosis.
      isCorrect: question.correct_index === answer.selected_index,
      topic: topics.find((topic) => topic.id === question.topic_id)?.name ?? "Topic",
      section: sections.find((chunk) => chunk.id === question.chunk_id)?.section ?? "Uploaded source",
    };
  });
  const scores = topics.filter((topic) => !topic.parent_id).map((topic) => scoreTopic(topic,
    reviews.filter((review) => review.topic_id === topic.id).map((review) => ({
      correct: review.isCorrect, confidence: review.confidence,
      misconception: review.isCorrect ? null : review.misconceptions[review.selectedIndex] ?? null,
    })),
  ));
  return { attemptId, createdAt: String(attempt.data.created_at), submittedAt: String(attempt.data.submitted_at), topics, reviews, scores };
}

export type Report = Awaited<ReturnType<typeof buildReport>>;
