# GapFinder AI: find what the student doesn't know

> One-line pitch: upload your syllabus, notes and past papers; the app tests you, finds your weak and blind-spot topics, and builds a revision plan that updates as you improve.

**Live demo:** <VERCEL_URL>
**Demo login:** email `<demo email>` / password `<demo password>` (click "Load sample data" on the Upload page)

## What it does
Upload -> topic map -> diagnostic quiz (with citations) -> gap report -> revision plan -> re-test -> plan updates.
The main output is a diagnosis (gap report), not a chat.

## Features
| Feature | Where |
|---|---|
| Upload syllabus / notes / past papers (PDF or text) | /upload |
| Topic map + past-paper exam-frequency heatmap | /topics |
| Diagnostic quiz with source citations and confidence ("sure" / "guessing") | /quiz |
| Gap report: weak / medium / strong, reasons, blind spots | /report/[id] |
| Revision plan by priority and available time, with "what changed" | /plan |
| Explain-this-topic chat (answers only from your material) | /chat |
| Progress dashboard across attempts | /dashboard |

## Architecture
<insert a simple diagram: Upload -> Chunks (Postgres) -> Retrieval (full-text search) -> LLM (Groq) -> Quiz / Chat; Answers -> Scoring (code) -> Gap report -> Plan (code) -> LLM tips>

Stack: Next.js (App Router) + TypeScript + Tailwind, Supabase (Auth, Postgres, RLS), Vercel AI SDK with Groq, deployed on Vercel.

## Where retrieval is used, where generation is used, and how they are kept separate
| Step | Retrieval (finds passages from the student's own material) | Generation (LLM) |
|---|---|---|
| Topic map | syllabus chunks | builds the topic tree from them |
| Past-paper mapping | candidate topics via search | picks one candidate |
| Quiz questions | best chunks per topic | writes questions from ONLY those chunks, with the chunk id and an exact source quote |
| Grounding check | the cited chunk | second model verifies the question is answerable from that chunk alone |
| Explain chat | top chunks for the message | answers only from them; if nothing is retrieved, the LLM is not called and a refusal is returned |
| Revision tips | chunks for the weak topic | writes 2 tips |

Separation rule: retrieval code (`lib/retrieval`) returns passages; generation code (`lib/ai`) only receives those passages. The model is told to use nothing else, every question stores its `chunk_id` and `source_quote`, and a question without a verifiable source is discarded.

## How the diagnosis is calculated (no LLM involved)
- Credit per answer: correct+sure = 1, correct+guessing = 0.5, wrong = 0. Wrong+sure is also counted as a **blind spot**.
- Topic mastery = credit / answers. Weak < 0.4, medium < 0.7, strong otherwise.
- Priority = (1 - mastery) x exam weight x (1 + 0.5 x blind-spot share).
- The plan allocates the student's available minutes in proportion to priority (minimum 15 min per topic, strong topics skipped).
The LLM only phrases reasons and adds tips; it never changes numbers, labels or order.

## What makes it different
- **Confidence-aware gaps:** "sure but wrong" is surfaced as a blind spot, the gap the student doesn't know they have.
- **Grounding verifier:** generated questions are rejected if they aren't supported by the cited passage (the UI shows generated vs rejected counts).
- **Transparent plan:** each item says why it is first, and a retake shows what moved.

## Evaluation
<fill with real numbers from your tests: questions generated / rejected, % of questions with valid citation, chat refusal on out-of-scope questions, unit tests passing>

## Run locally
```bash
git clone <repo>
cd <repo>
npm install
cp .env.example .env.local   # fill in the values
# run supabase/schema.sql in the Supabase SQL editor
npm run dev
npm test
```

### Environment variables
| Name | Purpose |
|---|---|
| GROQ_API_KEY | LLM access |
| GROQ_MODEL / GROQ_FAST_MODEL | main and verifier models |
| NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase project |

## Limitations and next steps
- Retrieval uses Postgres full-text search for speed; hybrid search with embeddings is the next upgrade.
- Single subject per account; class-level teacher analytics, spaced-repetition reminders and LMS integration are future work.
- Free-tier LLM rate limits can slow quiz generation; generated questions are cached.
