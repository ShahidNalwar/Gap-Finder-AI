import "server-only";

import { z } from "zod";
import { AppError, checkDb, type DbClient } from "@/lib/api";
import { structured } from "@/lib/ai/model";
import { prompts } from "@/lib/ai/prompts";
import { questionBatchSchema, topicSchema } from "@/lib/ai/schemas";
import { searchTopicNotes } from "@/lib/retrieval/search";
import { checkGrounding, normalize, rejectionLabels, type RejectionReason } from "@/lib/quiz/grounding";

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
  const rejectionSummary: { topic: string; reasons: string[]; retried: boolean }[] = [];

  for (const topic of topics) {
    const existing = await supabase.from("questions").select("id,question").eq("user_id", userId)
      .eq("topic_id", topic.id).order("created_at", { ascending: false }).limit(2);
    checkDb(existing.error);
    const available = z.array(z.object({ id: z.string().uuid(), question: z.string() })).parse(existing.data ?? []);
    if (available.length === 2 && !regenerate) {
      cached += available.length;
      accepted += available.length;
      continue;
    }
    const target = regenerate ? 2 : 2 - available.length;
    const passages = await searchTopicNotes(supabase, {
      name: topic.name,
      subtopics: allTopics.filter((child) => child.parent_id === topic.id).map((child) => child.name),
    }, 5);
    if (!passages.length) {
      cached += available.length;
      accepted += available.length;
      warnings.push(available.length
        ? `${topic.name}: using ${available.length} previously verified questions; no new source passages were found.`
        : `${topic.name}: no matching source passages were found, so this topic was not included.`);
      continue;
    }
    const seen = new Set(regenerate ? [] : available.map((question) => normalize(question.question)));
    const reasons = new Map<RejectionReason, number>();
    let feedback: { question: string; issue: string }[] = [];
    let saved = 0;
    let retried = false;
    for (let round = 0; round < 2 && saved < target; round++) {
      if (round) retried = true;
      // Retrieved topic notes; generate (or repair) MCQs only from these passages.
      // Verifier feedback is a correction request, never additional source evidence.
      const batch = await structured(questionBatchSchema, prompts.questions, {
        topic: topic.name, passages, requestedQuestions: target - saved,
        avoidQuestions: [...seen], correctionFeedback: feedback,
      });
      generated += batch.questions.length;
      feedback = [];
      for (const question of batch.questions) {
        const result = saved >= target
          ? { accepted: false as const, reason: "limit" as const, feedback: "Return only the requested number of questions." }
          : seen.has(normalize(question.question))
            ? { accepted: false as const, reason: "duplicate" as const, feedback: "Choose a different understanding check from the supplied passages." }
            : await checkGrounding(question, passages);
        if (!result.accepted) {
          rejected++;
          reasons.set(result.reason, (reasons.get(result.reason) ?? 0) + 1);
          feedback.push({ question: question.question, issue: result.feedback });
          continue;
        }
        const insert = await supabase.from("questions").insert({ ...question, user_id: userId, topic_id: topic.id });
        checkDb(insert.error);
        seen.add(normalize(question.question));
        saved++;
      }
      if (!batch.questions.length) feedback.push({ question: "", issue: "No questions were returned. Try a simpler check answerable entirely from one supplied passage; return none only if evidence really is insufficient." });
    }
    const reused = Math.min(available.length, 2 - saved);
    cached += reused;
    accepted += saved + reused;
    if (reasons.size) rejectionSummary.push({
      topic: topic.name, retried,
      reasons: [...reasons].map(([reason, count]) => `${count}: ${rejectionLabels[reason]}`),
    });
    if (saved < target) {
      warnings.push(reused
        ? `${topic.name}: keeping ${reused} previously verified questions alongside ${saved} new questions.`
        : saved
          ? `${topic.name}: ${saved} verified question is ready; unsupported candidates were excluded.`
          : `${topic.name}: no supported questions could be created after one repair attempt. This topic was excluded, not guessed.`);
    }
  }
  return { generated, accepted, rejected, cached, warnings, rejectionSummary };
}
