import "server-only";

import { z } from "zod";
import { AppError, checkDb, type DbClient } from "@/lib/api";
import { structured } from "@/lib/ai/model";
import { prompts } from "@/lib/ai/prompts";
import { questionBatchSchema, topicSchema, verifierSchema } from "@/lib/ai/schemas";
import { searchTopicNotes } from "@/lib/retrieval/search";

function normalize(text: string) { return text.replace(/\s+/g, " ").trim(); }

export async function generateQuiz(supabase: DbClient, userId: string, regenerate: boolean) {
  const result = await supabase.from("topics").select("id,name,parent_id,weight")
    .eq("user_id", userId).order("created_at");
  checkDb(result.error);
  const allTopics = z.array(topicSchema).parse(result.data ?? []);
  const topics = allTopics.filter((topic) => !topic.parent_id).slice(0, 6);
  if (!topics.length) throw new AppError("Build your topic map before generating a quiz.");
  let generated = 0;
  let rejected = 0;
  let accepted = 0;
  let cached = 0;
  const warnings: string[] = [];

  for (const topic of topics) {
    const existing = await supabase.from("questions").select("id").eq("user_id", userId)
      .eq("topic_id", topic.id).order("created_at", { ascending: false }).limit(2);
    checkDb(existing.error);
    if (existing.data?.length && !regenerate) {
      cached += existing.data.length;
      accepted += existing.data.length;
      continue;
    }
    const passages = await searchTopicNotes(supabase, {
      name: topic.name,
      subtopics: allTopics.filter((child) => child.parent_id === topic.id).map((child) => child.name),
    }, 5);
    if (!passages.length) {
      warnings.push(`${topic.name}: no matching notes. Upload notes for this topic.`);
      continue;
    }
    // Retrieved topic notes; generate MCQs and all grading explanations only from these passages.
    const batch = await structured(questionBatchSchema, prompts.questions, { topic: topic.name, passages });
    generated += batch.questions.length;
    const seen = new Set<string>();
    let saved = 0;
    for (const question of batch.questions) {
      const passage = passages.find((item) => item.id === question.chunk_id);
      const validOptions = new Set(question.options.map((option) => normalize(option).toLowerCase())).size === 4;
      const validMisconceptions = question.misconceptions.every((value, index) => index === question.correct_index ? value === null : typeof value === "string");
      if (!passage || !normalize(passage.content).includes(normalize(question.source_quote)) || !validOptions || !validMisconceptions || seen.has(normalize(question.question))) {
        rejected++;
        continue;
      }
      seen.add(normalize(question.question));
      // Retrieved the exact cited chunk; verify answer uniqueness and grounding with the fast model.
      const verification = await structured(verifierSchema, prompts.verifier, { question, passage }, true);
      if (!verification.grounded) { rejected++; continue; }
      const insert = await supabase.from("questions").insert({ ...question, user_id: userId, topic_id: topic.id });
      checkDb(insert.error);
      accepted++; saved++;
    }
    if (!saved) warnings.push(`${topic.name}: no new questions passed grounding checks.`);
  }
  return { generated, accepted, rejected, cached, warnings };
}
