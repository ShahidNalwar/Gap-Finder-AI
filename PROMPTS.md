# Build prompts for opencode (paste one at a time)

## Before you start
1. Create the repo folder, copy these files into the root: `AGENTS.md`, `PROBLEM_STATEMENT.md`, `.env.example`, `supabase/schema.sql`, `sample-data/`.
2. Run `supabase/schema.sql` in the Supabase SQL editor. In Supabase > Authentication, turn off "Confirm email" so demo accounts work instantly. Create the demo user there too.
3. Copy `.env.example` to `.env.local` and fill it in. Make sure `.env*` is in `.gitignore` BEFORE the first commit.
4. After every slice: run it, test it in the browser, then `git commit`. If a slice is broken, fix it before moving on.

Tip: start each new opencode session with "Read AGENTS.md first." The agent forgets between sessions.

---

## Prompt 0: kickoff (use Plan mode, no code)
```
Read AGENTS.md, PROBLEM_STATEMENT.md and supabase/schema.sql.
Do not write code yet. Give me:
1. A build plan in small slices, in the order of the core loop
2. The exact list of files you will create
3. The top 3 technical risks (for example Groq rate limits, PDF parsing in Next.js)
Ask me at most 3 questions, only if you are truly blocked.
```

## Slice 1: scaffold and auth
```
Create the Next.js app in this folder (App Router, TypeScript strict, Tailwind) with the folder structure from AGENTS.md.
Install: ai, @ai-sdk/groq, zod, @supabase/supabase-js, @supabase/ssr, pdf-parse, vitest.
Check the installed versions and the Supabase SSR docs before writing auth code.
Build: Supabase browser and server clients, email+password login/signup page, middleware (or equivalent) that redirects logged-out users to /login, a simple top nav (Upload, Topics, Quiz, Plan, Chat, Dashboard) and a logout button.
Done when: I can sign up, log in, reload and stay logged in, and /upload redirects to /login when logged out.
```

## Slice 2: upload, chunking, retrieval
```
Build the upload flow.
- /upload page: choose kind (syllabus / notes / past_paper), upload a .txt or .pdf, show the list of my documents.
- POST /api/upload: check the user, extract text (pdf.ts), insert a documents row, chunk the text (lib/retrieval/chunk.ts: ~800 chars, ~100 overlap, sentence-aware, set `section` from the nearest heading like "Chapter 1, Section 1.2", else "page N"), insert chunks.
- lib/retrieval/search.ts: calls the search_chunks RPC. It builds the query by joining keywords with " or ". Returns passages with id, section, content.
- Add a small debug page /debug/search where I type a query and see the retrieved chunks with their sections.
Write unit tests for chunk.ts.
Done when: uploading sample-data/notes.txt creates chunks, and searching "ammeter" returns the electric-current chunk with a correct section.
```

## Slice 3: topic map and past-paper mapping
```
Build the topic map.
- POST /api/topics/build: take the syllabus chunks, ask the LLM (generateObject + zod, prompt from APP_PROMPTS.md "Topic map") for a topic tree (topics + subtopics). Save to the topics table (replace the user's old tree).
- Then take the past_paper documents, split them into individual questions, and map each to ONE topic. Use retrieval first: for each past question, search the topic names / syllabus chunks, then ask the LLM to choose from the candidate topics only (prompt "Past-paper mapping"). Save to past_questions and set topics.weight = max(1, number of mapped questions).
- /topics page: show the topic tree and a simple exam-frequency heatmap (topic vs count).
Done when: with the sample data, I see 4 topics with subtopics and the weights match the number of past-paper questions per topic.
```

## Slice 4: quiz generation and grounding verifier
```
Build quiz generation.
- POST /api/quiz/generate: for each topic (max 6) and 2 questions per topic: RETRIEVE the best chunks for the topic (search.ts), then ask the main model to write questions using ONLY those chunks (prompt "Question generation" in APP_PROMPTS.md). Output via zod: question, 4 options, correct_index, explanation, per-option misconception, chunk_id, source_quote.
- Verifier: for every generated question call the fast model (prompt "Grounding verifier"). Also check in code that source_quote is a substring of the chunk (normalize whitespace). Reject questions that fail either check.
- Save accepted questions. Return counts {generated, accepted, rejected}.
- Do not regenerate if questions already exist for the topic, unless the user clicks "Regenerate".
Retry once on invalid output and on 429 with backoff.
Done when: the quiz has ~12 questions, every one has a chunk_id and a source_quote, and the UI can show "generated 14, rejected 2".
```

## Slice 5: quiz UI, confidence and evaluation
```
Build the quiz taking flow.
- /quiz: create an attempt, show one question at a time with 4 options and a "Sure / Guessing" toggle that must be chosen before the user can submit the answer.
- POST /api/quiz/submit: save answers, compute is_correct in code (compare indexes), mark the attempt submitted.
- After submit, show per question: right/wrong, the correct answer, the explanation, the misconception for the option the student picked, and a citation block with the section and the source_quote.
No LLM call is needed in grading. Show a loading state when the quiz is being generated.
Done when: I can finish a quiz and every wrong answer shows an explanation and a citation.
```

## Slice 6: scoring and gap report (tests first)
```
Implement lib/scoring/config.ts, mastery.ts and the gap report exactly as in the "Scoring spec" in AGENTS.md.
Write the pure functions and vitest tests FIRST (cases: all correct+sure, all wrong+sure -> blind spots, mixed, a topic with 1 answer, the thresholds 0.4 and 0.7 exactly).
Then build /report/[attemptId]: for every topic show a red/yellow/green badge, mastery %, the reason (built from facts in code: "3 of 4 wrong, 2 of them marked sure", plus the misconceptions picked), and a "Blind spots" section listing topics where the student was sure but wrong.
You may use the LLM only to rephrase the reason text. Keep numbers and labels from code.
Done when: tests pass and the report for my attempt matches a hand calculation.
```

## Slice 7: revision plan and progress dashboard
```
1. lib/scoring/plan.ts: implement the plan function from AGENTS.md as a pure function with vitest tests (time fits the budget, strong topics skipped, ordering by priority, min 15 minutes, "change vs previous plan").
2. POST /api/plan/generate: input days and hoursPerDay; compute the plan in code; then ask the LLM only for 2 tips per topic, using retrieved passages (prompt "Revision tips"). Save to plans.
3. /plan page: a form for days and hours/day, then the ordered plan with minutes per day, a "why first" line per topic (from the priority numbers), and the change vs the previous plan after a retake.
4. /dashboard: scores per topic across attempts (a simple line or bar chart, any lightweight library or plain SVG) and the latest plan summary.
Done when: after a second attempt with better answers, the plan reorders and the dashboard shows the improvement.
```

## Slice 8: explain-this-topic chat
```
Build /chat and POST /api/chat with streaming (check the AI SDK docs for the current streaming + useChat API).
For every user message: retrieve top 4 chunks via search.ts. If nothing relevant is returned, reply exactly "I couldn't find this in your uploaded material." and do NOT call the LLM. Otherwise answer only from the passages (prompt "Explain chat") and show citations (section names) under the answer.
Done when: "Explain photosynthesis" answers with citations, and "Who won the 1998 World Cup?" gets the refusal line.
```

## Slice 9: polish, deploy, README
```
1. Make a pass for loading/error states, empty states (no documents yet -> guide to /upload), and a clean mobile layout. No new features.
2. Add a "Load sample data" button on /upload that ingests the files from sample-data/ for the logged-in user (so judges can try the app in one click).
3. Fill README.md from README.template.md with real details.
4. Add a small "Eval" script or section: report generated/rejected question counts and the chat refusal check.
5. Review: list every place an API key or secret could leak and every route missing an auth check. Fix them.
Then give me a deploy checklist for Vercel (env vars, Supabase redirect URLs).
```

---

## Utility prompts

**Bug fix**
```
This is broken: <what you did, what you expected, what happened>.
Error message: <paste the full error>.
Find the root cause first, explain it in 2 sentences, then make the smallest fix. Do not refactor.
```

**Understand the code (for the interview)**
```
Explain how <feature> works end to end: which files, which functions, and where retrieval ends and generation begins. Use simple language, as if I must explain it to an interviewer.
```

**Pre-submit review**
```
Review the whole repo against the "Definition of done" in AGENTS.md. Give a checklist with pass/fail and the exact file and line for every failure. Also check: no secrets in git history, README accuracy, and that every LLM output is zod-validated.
```

**If Groq rate-limits you**
```
We hit Groq rate limits. Add a retry with exponential backoff (max 3 tries), reduce parallel LLM calls to 2 at a time, and cache anything that can be cached in the database. Show a friendly "busy, retrying" message in the UI.
```

## Demo script (2 minutes, use in the README or video)
1. Log in with the demo account, click "Load sample data".
2. Open Topics: show the tree and the exam-frequency heatmap.
3. Take the quiz: use "Guessing" on some and "Sure" on others, get a few wrong on purpose.
4. Open the gap report: point out red topics, reasons, and blind spots (sure but wrong).
5. Open Plan: set 5 days, 2 hours a day; point at the order and "why first".
6. Retake the quiz with better answers: show the plan changing and the dashboard improving.
7. Open Chat: ask one in-scope question (with citations) and one out-of-scope question (refusal).
