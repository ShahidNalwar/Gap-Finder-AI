# GapFinder AI

Find what you don't know, then focus your revision where it matters.

Upload → topic map → diagnostic quiz → **gap diagnosis** → revision plan → retest.
The diagnosis—not a chatbot—is the main output.

**Live deployment:** pending. **Demo credentials:** not created; use sign-up.

## Features

| Route | What it does |
|---|---|
| `/login` | Email/password signup, confirmation callback, cookie-based sessions |
| `/upload` | PDF/text upload, sample-data loading, document list, retrieval preview |
| `/topics` | Explicit topic-map build and past-paper frequency heatmap |
| `/quiz` | Cached source-grounded MCQs, verification counts, confidence choices |
| `/report/[attemptId]` | Weak/medium/strong diagnosis, blind spots, per-answer explanations and citations |
| `/plan` | Time-budgeted revision, grounded tips, priority/mastery changes after retakes |
| `/dashboard` | Topic mastery across the latest 20 submitted attempts and latest plan |
| `/chat` | Grounded helper (implemented last; see current status below) |

Stack: Next.js App Router, strict TypeScript, Tailwind CSS, Supabase Auth/Postgres/RLS
using `@supabase/ssr`, Vercel AI SDK with Groq, zod, pdf-parse, and Vitest.

## Architecture and grounding

```text
PDF/text → section-aware chunks → Postgres full-text retrieval → Groq
                                                     ├─ topic mapping
                                                     ├─ MCQs → quote checks → fast verifier
                                                     └─ revision tips / explanation helper
Answers + confidence → TypeScript scoring → gap report → TypeScript schedule
Retake → recomputed mastery/priority → updated plan + dashboard
```

| Step | Retrieval | Generation |
|---|---|---|
| Topic map | Own syllabus chunks | Up to six topic trees; names checked against syllabus |
| Past-paper mapping | Syllabus passages matching each exam question | Chooses an extracted candidate name or `none` |
| Quiz | Notes for topic + subtopics | Up to two MCQs with four options, grading text, chunk ID, quote |
| Verification | Exact cited chunk | Fast model checks answer uniqueness, explanation, grounding |
| Tips | Notes for the topic | Exactly two tips; never order, minutes, or priority |

Retrieval lives in `src/lib/retrieval/search.ts`; generation receives the returned
passages, never unrestricted material or external tools. Queries join keywords
with `or` so partial full-text matches work. Uploaded instructions are treated as
untrusted source data. Every generated output is zod-validated; invalid output is
retried once. Rate-limited calls get one short backoff and a friendly error.

Question acceptance requires a retrieved chunk ID, a whitespace-normalized exact
source quote, distinct options, appropriate misconception entries, and an
independent fast-model grounding pass. Counts shown in the UI describe the current
generation request; cached questions were verified when initially generated.

## Deterministic diagnosis and planning

- Correct + sure: **1** credit; correct + guessing: **0.5**; wrong: **0**.
- Wrong + sure also counts as a blind spot.
- Mastery = total credit / answers. Weak `< 0.4`, medium `< 0.7`, otherwise strong.
- Priority = `(1 - mastery) × max(1, examWeight) × (1 + 0.5 × blindSpotShare)`.
- Exam weight is mapped past-paper question count, minimum one.
- Untested topics have no mastery estimate and are not scheduled as invented weaknesses.
- Planning fits `days × hoursPerDay × 60`, rounded down to whole total minutes.
  Include highest-priority topics that can each receive at least 15 minutes.
  Allocate proportionally, enforcing that minimum, then distribute rounding remainders.
- Weak/medium topics consume the available budget; strong topics are scheduled
  when there are no tested weak/medium topics.
- The daily schedule preserves priority order and does not exceed daily capacity.
- Retakes reuse the last time budget and recompute the plan. If auto-update fails,
  the diagnosis stays saved and the report links to retry planning.
- MCQ correctness and report facts are recomputed from stored question indexes,
  not client-supplied `is_correct`. Grading makes no LLM call.

Constants and pure functions live in `src/lib/scoring/`. AI only adds wording/tips.
If tips fail, the calculated schedule is retained with source-section-based
fallback study actions.

## Run locally

Requires Node **20.19+** and npm. Supabase packages are pinned to Node-20-compatible
versions; keep the lockfile.

```sh
npm ci
npm run dev
```

Create an ignored `.env.local` (or use an existing `.env`) containing:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-public-publishable-key
GROQ_API_KEY=your-server-only-key
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_FAST_MODEL=llama-3.1-8b-instant
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is also accepted for projects using the legacy
public anon key. Never put a service-role or secret Supabase key in a public
variable. Groq model availability varies: verify IDs in your Groq console.
The configured account currently uses approved local overrides
`openai/gpt-oss-120b` and `openai/gpt-oss-20b`; these also need setting on Vercel.

In Supabase Authentication:

1. Enable email/password authentication.
2. For the immediate-signup demo flow, disable **Confirm email**.
3. If confirmation is enabled instead, allow
   `http://localhost:3000/auth/callback` as a redirect URL and set your local Site
   URL. The app exchanges the confirmation code for a cookie-based session.

### Database

- **New project:** run `supabase/schema.sql` once in the Supabase SQL Editor.
- **Existing project using the original schema:** run
  `supabase/migrations/001_attempt_integrity.sql` instead. It is rerunnable,
  backfills fixed question IDs from old answers, adds uniqueness, and prevents
  cascading deletion of answers.
- No service-role key is required. Every table has owner-based RLS.
- Rebuilding a topic map is always explicit. It is disabled after submitted
  attempts exist so the minimal schema can preserve historical results.
- Regenerating questions inserts new rows; it does not mutate prior question
  explanations or delete questions used by saved attempts.

## Checks

```sh
npm run build
npm run typecheck
npm test
```

Manual auth check:

1. Open `/upload` signed out: expect `/login`.
2. Create an account, or sign in to an existing confirmed account.
3. Expect `/upload`; reload and confirm that you remain signed in.
4. Visit each navigation link; expect a protected workspace page.
5. Sign out; `/upload` must redirect to `/login` again.
6. Signed-out `POST /api/auth/logout` must return HTTP 401.

Authentication is checked in the request proxy, the protected server layout,
and independently inside each API handler. Mutations require same-origin
requests. Auth responses are not publicly cacheable. Sign-out affects the
current session only.

## Evaluation and verification status

- **26 unit tests pass:** chunking, scoring, and planning only.
- Production build and strict TypeScript checks pass.
- All workspace pages redirect signed-out visitors to login; tested APIs return 401.
- Invalid-login errors were checked in-browser; successful login was reported by the user.
- Live Groq syllabus smoke check returned the expected four sample topics.
- Live Groq quiz smoke check: **1 generated, 1 accepted, 0 rejected** with a valid
  quote and independent grounding check. This small run is not a general accuracy benchmark.
- Actual pdf-parse extraction was verified with a text-based PDF buffer.
- Sample past-paper parsing found all ten questions.
- Expected sample exam counts: Photosynthesis 3, Respiration 3, Human Digestion 2,
  Transportation 2. Two questions per topic gives an eight-question sample quiz.
- Full authenticated upload → retake flow still needs checking after the migration
  is applied. No test student data was inserted by the coding agent.
- Chat refusal and deployment status are updated after the final helper slice.

## Two-minute demo

1. Sign in and click **Load sample data** on Upload.
2. Build Topics; show the tree and paper-frequency bars.
3. Prepare and start Quiz; deliberately mix sure/guessing and right/wrong answers.
4. Open the gap report; show reasons, blind spots, source quotes, and explanations.
5. Build a plan with five days and two hours/day.
6. Retake with improved answers; compare the updated plan and Dashboard.

## Limitations

- Text-based PDFs only; scanned PDFs need external OCR. Upload limit: 3 MB and
  200,000 extracted characters per document.
- Up to six main topics, twelve quiz questions, and forty extracted questions per
  past-paper document. Use Q1-style or numbered text questions; complex exam
  layouts can need cleanup.
- English keyword full-text retrieval, not semantic/vector search. Thin or
  unrelated notes can legitimately produce fewer/no verified questions.
- Generation is sequential to reduce rate-limit pressure. Serverless duration
  limits still depend on the deployment plan.
- Partial generation is saved by topic; retry uses already-accepted cached questions.
- Unfinished quiz answers are held in the browser component and are lost on reload.
- The simple owner-based policies are not an anti-cheating system: a user can
  inspect their own question rows via the database API. The application never
  sends correct indexes in the quiz-start response.
- Topic rebuild is blocked after submission; versioned syllabuses and stronger
  cross-owner relational constraints are intentionally outside this MVP.
- No live URL or demo password is claimed until deployment has been verified.

See [DEPLOYMENT.md](DEPLOYMENT.md) for release steps.
