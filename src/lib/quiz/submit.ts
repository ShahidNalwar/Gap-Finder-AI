import "server-only";

import { z } from "zod";
import { AppError, checkDb, type DbClient } from "@/lib/api";
import { storedQuestionSchema, submissionSchema } from "@/lib/ai/schemas";

export async function submitQuiz(supabase: DbClient, userId: string, input: z.infer<typeof submissionSchema>) {
  const attempt = await supabase.from("attempts").select("id,question_ids,submitted_at")
    .eq("user_id", userId).eq("id", input.attemptId).maybeSingle();
  checkDb(attempt.error);
  if (!attempt.data) throw new AppError("Quiz attempt not found.", 404);
  if (attempt.data.submitted_at) return { attemptId: input.attemptId };
  const ids = z.array(z.string().uuid()).min(1).max(12).parse(attempt.data.question_ids);
  const selectedIds = input.answers.map((answer) => answer.questionId);
  if (new Set(selectedIds).size !== ids.length || selectedIds.length !== ids.length || !ids.every((id) => selectedIds.includes(id))) {
    throw new AppError("Answer every question exactly once before submitting.");
  }
  const result = await supabase.from("questions").select("id,topic_id,chunk_id,question,options,correct_index,explanation,misconceptions,source_quote")
    .eq("user_id", userId).in("id", ids);
  checkDb(result.error);
  const questions = z.array(storedQuestionSchema).parse(result.data ?? []);
  if (questions.length !== ids.length) throw new AppError("A quiz source is missing. Start a new quiz.", 409);
  const rows = input.answers.map((answer) => ({
    user_id: userId, attempt_id: input.attemptId, question_id: answer.questionId,
    selected_index: answer.selectedIndex, confidence: answer.confidence,
    is_correct: questions.find((question) => question.id === answer.questionId)!.correct_index === answer.selectedIndex,
  }));
  const existing = await supabase.from("answers").select("question_id,selected_index,confidence")
    .eq("user_id", userId).eq("attempt_id", input.attemptId);
  checkDb(existing.error);
  if (!existing.data?.length) {
    checkDb((await supabase.from("answers").insert(rows)).error);
  } else if (existing.data.length !== rows.length || !rows.every((row) => existing.data?.some((saved) =>
    saved.question_id === row.question_id && saved.selected_index === row.selected_index && saved.confidence === row.confidence))) {
    throw new AppError("Answers have already been saved for this attempt. Start a new quiz to change them.", 409);
  }
  // Retry-safe: answers insert atomically, then this marker is completed without regrading.
  checkDb((await supabase.from("attempts").update({ submitted_at: new Date().toISOString() })
    .eq("user_id", userId).eq("id", input.attemptId).is("submitted_at", null)).error);
  return { attemptId: input.attemptId };
}
