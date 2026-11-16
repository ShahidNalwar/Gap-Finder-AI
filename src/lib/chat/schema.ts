import { z } from "zod";

export const REFUSAL = "I couldn't find this in your uploaded material.";
export const chatOutputSchema = z.object({
  supported: z.boolean(),
  answer: z.string().min(1).max(5000),
  used_chunk_ids: z.array(z.string().uuid()).max(4),
});
export const chatAnswerSchema = z.object({
  answer: z.string(),
  citations: z.array(z.object({ id: z.string(), section: z.string(), quote: z.string() })),
});
export const chatEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("status"), message: z.string() }),
  z.object({ type: z.literal("answer"), data: chatAnswerSchema }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);
export type ChatAnswer = z.infer<typeof chatAnswerSchema>;
