# GapFinder AI: instructions for the coding agent

## What we are building
A web app that finds what a student does NOT know.
Flow: upload syllabus, notes and past papers -> topic map -> diagnostic quiz grounded in the uploaded material (with citations) -> answer evaluation -> gap report (weak / medium / strong, with reasons) -> prioritized revision plan that updates after every attempt.

The main output is the DIAGNOSIS, not a chatbot. Chat is only a helper.
Full problem statement: see PROBLEM_STATEMENT.md.

Deliverables: clean GitHub repo + live Vercel deployment + demo login in the README.
The deadline is very close. A working end-to-end flow beats polish. Do not gold-plate.

## Required features
1. Upload syllabus / notes / past papers (PDF or text)
2. Topic map built from the syllabus (+ past-paper questions mapped to topics)
3. Diagnostic quiz from the material, each question cites its source section
4. Gap report: weak / medium / strong per topic, with reasons
5. Personalized revision plan, ordered by priority and the student's available time
6. "Explain this topic" assistant that answers ONLY from uploaded material
7. Progress dashboard across attempts
8. Login with demo credentials, saved student data

Mandatory AI features: RAG with citations, grounded question generation, answer evaluation with explanations, gap analysis, adaptive plan generation, and a README section explaining where retrieval is used, where generation is used, and how they are kept separate.

## Stack (do not change without asking me)
- Next.js (App Router) + TypeScript (strict) + Tailwind
- Supabase: Auth + Postgres (RLS on every table). Use `@supabase/ssr`.
- Vercel AI SDK (`ai`, `@ai-sdk/groq`) + zod for structured output
- LLM: Groq. Main model from env `GROQ_MODEL` (default `llama-3.3-70b-versatile`), fast model from `GROQ_FAST_MODEL` (default `llama-3.1-8b-instant`). Model names change; verify in the Groq console if a call fails.
- Retrieval: Postgres full-text search (`search_chunks` function in `supabase/schema.sql`). No vector DB unless I ask.
- PDF text: `pdf-parse` (if its import errors in Next.js, switch to `unpdf`).
- Deploy: Vercel

IMPORTANT: AI SDK and Supabase APIs differ between versions. Before writing code that uses them, check the installed version in `package.json` and the official docs (https://ai-sdk.dev, https://supabase.com/docs). Do NOT guess function names or import paths.

## Golden rules
1. **Retrieval and generation are separate steps.**
   - Retrieval = `lib/retrieval/search.ts` fetches passages from the student's own chunks.
   - Generation = the LLM is given ONLY those passages and told to use nothing else.
   - Put a short comment at each LLM call stating what was retrieved and what is being generated.
2. **Scoring is code, not LLM.** Mastery, weak/medium/strong labels, priority and time allocation are plain TypeScript functions in `lib/scoring/` with unit tests. The LLM may only write wording.
3. **Every question stores its source** (`chunk_id` + `source_quote`). No source = question is discarded.
4. **Grounding verifier:** after generating questions, run a second cheap LLM check (fast model). Questions with `grounded=false` are rejected and counted. Show "generated X, rejected Y" in the UI.
5. **Validate all LLM output with zod.** On invalid output, retry once, then fail with a friendly error.
6. **Chat never answers from model memory.** If retrieval returns nothing useful, reply exactly: "I couldn't find this in your uploaded material."
7. **Secrets:** never commit `.env*`. Never expose the Supabase service-role key (we do not need it). Only `NEXT_PUBLIC_*` values go to the browser.
8. **Every API route checks the logged-in user.** RLS is the second layer.
9. **Rate limits:** the Groq free tier is limited. Generate quiz questions once and cache them in the DB. Cap at ~6 topics and ~12 questions per quiz. Retry on 429 with a short backoff.

## Scoring spec (implement exactly; keep constants in `lib/scoring/config.ts`)
Per answer, with `confidence` in {sure, guessing}:
- correct + sure       -> 1.0 credit
- correct + guessing   -> 0.5 credit
- wrong + guessing     -> 0 credit
- wrong + sure         -> 0 credit AND counts as a "blind spot"

`mastery(topic) = totalCredit / numberOfAnswers` (0..1).
Labels: `weak` if mastery < 0.4, `medium` if < 0.7, else `strong`.
`blindSpotShare = blindSpotAnswers / numberOfAnswers`.
`priority = (1 - mastery) * examWeight * (1 + 0.5 * blindSpotShare)`.
`examWeight` = number of past-paper questions mapped to the topic (minimum 1).

Plan: input = gap report + `days` + `hoursPerDay`.
- Total minutes = days * hoursPerDay * 60.
- Skip strong topics unless time remains.
- Allocate minutes proportional to priority, minimum 15 minutes per included topic, ordered by priority descending, spread across days.
- On a new attempt, recompute and also return the change vs the previous plan (topic moved up/down, mastery delta).
- The LLM only adds 2 concrete tips per topic, based on retrieved passages. It must not change order or minutes.

Gap-report reasons are built from facts in code (counts, blind spots, the misconception text of wrong options picked). The LLM may only rephrase them.

## Evaluation
MCQ correctness is deterministic (compare indexes). Explanations and per-option misconceptions are generated WITH the question and stored, so grading needs no extra LLM call. On a wrong answer show: the correct answer, why, the misconception of the chosen option, and the source quote.

## Folder structure
```
src/
  app/
    login/page.tsx
    dashboard/page.tsx        progress across attempts
    upload/page.tsx
    topics/page.tsx           topic map + past-paper heatmap
    quiz/page.tsx
    report/[attemptId]/page.tsx
    plan/page.tsx
    chat/page.tsx
    api/
      upload/route.ts
      topics/build/route.ts
      quiz/generate/route.ts
      quiz/submit/route.ts
      plan/generate/route.ts
      chat/route.ts
  lib/
    supabase/{client.ts,server.ts}
    ai/{model.ts,schemas.ts,prompts.ts}
    retrieval/{chunk.ts,search.ts}
    scoring/{config.ts,mastery.ts,plan.ts,*.test.ts}
    pdf.ts
  components/
supabase/schema.sql
sample-data/
```
Use `export const runtime = "nodejs"` on routes that parse PDFs.

## Retrieval details
- Chunk into ~800 characters with ~100 overlap, split on paragraph/sentence boundaries. Save `section` (nearest heading such as "Chapter 1, Section 1.2", else "page N").
- `search_chunks(q, k, kinds)` uses `websearch_to_tsquery`, which ANDs words by default. In app code build the query by joining keywords with ` or ` so partial matches still return results.
- For a topic, the query = topic name + subtopic names.
- LLM prompt text lives in `lib/ai/prompts.ts`; use the wording in APP_PROMPTS.md as the starting point.

## Coding conventions
- TypeScript strict, no `any`. Small files. Short comments explaining WHY.
- Show loading and error states on every action that calls an LLM.
- No dead code, no leftover console.log.
- Commit after every working slice with a clear message.

## Definition of done
- [ ] A fresh account can: upload sample data, build topics, take the quiz, see the gap report, get a plan, retake and see the plan change
- [ ] Every question shows a citation and the source quote
- [ ] Chat refuses when nothing is retrieved
- [ ] Unit tests for scoring and plan pass
- [ ] Deployed on Vercel, env vars set, demo login works in a private window
- [ ] README complete (see README.template.md)

## Do NOT
- Do not add features not listed unless asked (no teacher view, reminders, payments).
- Do not use LLM memory to write quiz questions or chat answers.
- Do not paste secrets into code, logs or chat.
- Do not rewrite working files unless asked; make minimal edits.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
