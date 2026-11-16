import { z } from "zod";

export const topicTreeSchema = z.object({
  topics: z.array(z.object({
    name: z.string().trim().min(1).max(120),
    subtopics: z.array(z.string().trim().min(1).max(160)).max(5),
  })).min(1).max(6),
});
export const topicSchema = z.object({
  id: z.string().uuid(), name: z.string(), parent_id: z.string().uuid().nullable(), weight: z.number(),
});
export type Topic = z.infer<typeof topicSchema>;

export const generatedQuestionSchema = z.object({
  question: z.string().min(5).max(800),
  options: z.array(z.string().min(1).max(400)).length(4),
  correct_index: z.number().int().min(0).max(3),
  explanation: z.string().min(1).max(1500),
  misconceptions: z.array(z.string().min(1).max(600).nullable()).length(4),
  chunk_id: z.string().uuid(),
  source_quote: z.string().min(10).max(1600),
});
export const questionBatchSchema = z.object({ questions: z.array(generatedQuestionSchema).max(2) });
export const verifierSchema = z.object({ grounded: z.boolean(), reason: z.string().max(600) });
export const storedQuestionSchema = generatedQuestionSchema.extend({
  id: z.string().uuid(), topic_id: z.string().uuid(),
});
export type StoredQuestion = z.infer<typeof storedQuestionSchema>;
export const publicQuestionSchema = storedQuestionSchema.pick({
  id: true, topic_id: true, question: true, options: true, chunk_id: true,
}).extend({ section: z.string(), topic: z.string() });
export type PublicQuestion = z.infer<typeof publicQuestionSchema>;
export const submissionSchema = z.object({
  attemptId: z.string().uuid(),
  answers: z.array(z.object({
    questionId: z.string().uuid(), selectedIndex: z.number().int().min(0).max(3),
    confidence: z.enum(["sure", "guessing"]),
  })).min(1).max(12),
});
export const tipsSchema = z.object({ tips: z.array(z.string().min(1).max(600)).length(2) });
