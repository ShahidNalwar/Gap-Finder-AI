import "server-only";

import { z } from "zod";
import { AppError, checkDb, type DbClient } from "@/lib/api";
import { structured } from "@/lib/ai/model";
import { prompts } from "@/lib/ai/prompts";
import { topicSchema, topicTreeSchema } from "@/lib/ai/schemas";
import { searchChunks } from "@/lib/retrieval/search";
import { splitPastQuestions } from "@/lib/documents/past-paper";

const sourceSchema = z.object({ id: z.string(), document_id: z.string(), content: z.string(), section: z.string().nullable() });

export async function buildTopics(supabase: DbClient, userId: string, rebuild: boolean) {
  const existing = await supabase.from("topics").select("id").eq("user_id", userId).limit(1);
  checkDb(existing.error);
  if (existing.data?.length && !rebuild) throw new AppError("A topic map already exists. Use the explicit Rebuild button to replace it.", 409);

  if (existing.data?.length) {
    const submitted = await supabase.from("attempts").select("id").eq("user_id", userId).not("submitted_at", "is", null).limit(1);
    checkDb(submitted.error);
    if (submitted.data?.length) throw new AppError("Your topic map is linked to saved results. Rebuilding is disabled to preserve those results; you can regenerate quiz questions instead.", 409);
  }
  const docs = await supabase.from("documents").select("id,kind").eq("user_id", userId);
  checkDb(docs.error);
  const syllabusIds = (docs.data ?? []).filter((doc) => doc.kind === "syllabus").map((doc) => String(doc.id));
  if (!syllabusIds.length) throw new AppError("Upload a syllabus first, or load the sample data.");
  const sources = await supabase.from("chunks").select("id,document_id,content,section")
    .eq("user_id", userId).in("document_id", syllabusIds).limit(100);
  checkDb(sources.error);
  const passages = z.array(sourceSchema).parse(sources.data ?? []);
  if (!passages.length) throw new AppError("Your syllabus has no readable passages. Upload a text-based syllabus.");
  if (passages.reduce((n, p) => n + p.content.length, 0) > 16_000) throw new AppError("This syllabus is too large for one topic map. Use a shorter syllabus covering up to six topics.");

  // Retrieved the user's syllabus chunks; generate only its topic hierarchy.
  const tree = await structured(topicTreeSchema, prompts.topics, { passages }, false, 1800);
  const normalize = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const sourceText = normalize(passages.map((passage) => `${passage.section ?? ""} ${passage.content}`).join(" "));
  if (tree.topics.some((topic) => !sourceText.includes(normalize(topic.name)) || topic.subtopics.some((name) => !sourceText.includes(normalize(name))))) {
    throw new AppError("The generated map used names not found in your syllabus. Please try again.", 502);
  }
  const names = tree.topics.map((topic) => topic.name);
  if (new Set(names.map((name) => name.toLowerCase())).size !== names.length) {
    throw new AppError("The topic map contained duplicates. Please rebuild it.", 502);
  }
  const paperIds = (docs.data ?? []).filter((doc) => doc.kind === "past_paper").map((doc) => String(doc.id));
  const mapped: { document_id: string; text: string; topic: string }[] = [];
  for (const documentId of paperIds) {
    const result = await supabase.from("chunks").select("content").eq("user_id", userId).eq("document_id", documentId).limit(100);
    checkDb(result.error);
    const content = z.array(z.object({ content: z.string() })).parse(result.data ?? []);
    for (const question of splitPastQuestions(content.map((chunk) => chunk.content))) {
      // Notes bridge vocabulary such as "diaphragm" to the syllabus heading "Breathing in humans".
      const notes = await searchChunks(supabase, question, 3, ["notes"]);
      const syllabus = await searchChunks(supabase, `${question} ${notes.map((note) => note.section ?? "").join(" ")}`, 4, ["syllabus"]);
      const retrieved = [...syllabus, ...notes];
      if (!retrieved.length) { mapped.push({ document_id: documentId, text: question, topic: "none" }); continue; }
      const evidence = normalize(retrieved.map((passage) => `${passage.section ?? ""} ${passage.content}`).join(" "));
      const candidates = tree.topics.filter((topic) => [topic.name, ...topic.subtopics].some((name) => evidence.includes(normalize(name)))).map((topic) => topic.name);
      if (!candidates.length) { mapped.push({ document_id: documentId, text: question, topic: "none" }); continue; }
      // Retrieved notes and candidate syllabus passages; select only an evidence-backed topic name.
      const match = await structured(z.object({ topic: z.string() }), prompts.mapping, { question, candidates, passages: retrieved }, true);
      mapped.push({ document_id: documentId, text: question, topic: candidates.includes(match.topic) ? match.topic : "none" });
    }
  }

  if (existing.data?.length) {
    const removed = await supabase.from("topics").delete().eq("user_id", userId);
    checkDb(removed.error);
  }
  const parents = await supabase.from("topics").insert(tree.topics.map((topic) => ({
    user_id: userId, name: topic.name, weight: Math.max(1, mapped.filter((row) => row.topic === topic.name).length),
  }))).select("id,name,parent_id,weight");
  checkDb(parents.error);
  const topics = z.array(topicSchema).parse(parents.data ?? []);
  const children = tree.topics.flatMap((topic) => topic.subtopics.map((name) => ({
    user_id: userId, name, parent_id: topics.find((parent) => parent.name === topic.name)!.id, weight: 1,
  })));
  if (children.length) checkDb((await supabase.from("topics").insert(children)).error);
  checkDb((await supabase.from("past_questions").delete().eq("user_id", userId)).error);
  if (mapped.length) {
    checkDb((await supabase.from("past_questions").insert(mapped.map((row) => ({
      user_id: userId, document_id: row.document_id, text: row.text,
      topic_id: topics.find((topic) => topic.name === row.topic)?.id ?? null,
    })))).error);
  }
  return { mapped: mapped.filter((row) => row.topic !== "none").length, unmapped: mapped.filter((row) => row.topic === "none").length };
}
