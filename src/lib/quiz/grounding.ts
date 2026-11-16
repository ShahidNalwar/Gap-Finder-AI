import "server-only";

import { z } from "zod";
import { structured } from "@/lib/ai/model";
import { prompts } from "@/lib/ai/prompts";
import { generatedQuestionSchema, verifierSchema } from "@/lib/ai/schemas";
import type { Passage } from "@/lib/retrieval/search";

export type RejectionReason = "source" | "options" | "misconceptions" | "grounding" | "duplicate" | "limit";
export const rejectionLabels: Record<RejectionReason, string> = {
  source: "source citation or exact quote did not match",
  options: "answer options were not distinct",
  misconceptions: "option explanations were incomplete or misaligned",
  grounding: "the independent verifier could not confirm a unique, fully supported answer",
  duplicate: "question duplicated an already accepted question",
  limit: "question exceeded the two-question topic limit",
};

export function normalize(text: string) { return text.replace(/\s+/g, " ").trim(); }

export async function checkGrounding(
  question: z.infer<typeof generatedQuestionSchema>,
  passages: Passage[],
): Promise<{ accepted: true } | { accepted: false; reason: RejectionReason; feedback: string }> {
  const passage = passages.find((item) => item.id === question.chunk_id);
  if (!passage || !normalize(passage.content).includes(normalize(question.source_quote))) {
    return { accepted: false, reason: "source", feedback: "Use an unchanged provided chunk_id and copy source_quote exactly from that same passage." };
  }
  if (new Set(question.options.map((option) => normalize(option).toLowerCase())).size !== 4) {
    return { accepted: false, reason: "options", feedback: "Write four distinct answer options with exactly one supported answer." };
  }
  if (!question.misconceptions.every((value, index) => index === question.correct_index ? value === null : typeof value === "string")) {
    return { accepted: false, reason: "misconceptions", feedback: "Set the correct option's misconception to null and explain each of the other three mistakes." };
  }
  // Retrieved the exact cited chunk; verify answer uniqueness, explanations, and grounding.
  const result = await structured(verifierSchema, prompts.verifier, { question, passage }, true);
  return result.grounded ? { accepted: true } : { accepted: false, reason: "grounding", feedback: result.reason };
}
