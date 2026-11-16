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
| `/plan/[planId]/print` | Printable revision sheet: daily checklists, mistakes, saved tips, and source quotes |
| `/dashboard` | Topic mastery across the latest 20 submitted attempts and latest plan |
| `/chat` | Explain-this-topic helper using only own material, with citations and exact refusal |

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
| Past-paper mapping | Matching notes bridge question vocabulary to candidate syllabus passages | Chooses an evidence-backed extracted candidate name or `none` |
| Quiz | Notes for topic + subtopics | Up to two MCQs with four options, grading text, chunk ID, quote |
| Verification | Exact cited chunk | Fast model checks answer uniqueness, explanation, grounding |
| Tips | Notes for the topic | Exactly two tips; never order, minutes, or priority |
| Chat | Top four syllabus/notes passages for the question | Validated explanation + cited chunk IDs, or exact refusal |

Retrieval lives in `src/lib/retrieval/search.ts`; generation receives the returned
passages, never unrestricted material or external tools. Queries join keywords
with `or` so partial full-text matches work. Uploaded instructions are treated as
untrusted source data. Every generated output is zod-validated; invalid output is
retried once. Calls share a paced queue within each server process. Rate-limited
calls honor Groq's Retry-After (or token-reset) header with at most three total
attempts. Long cooldowns and daily quotas produce actionable messages rather
than repeatedly retrying; saved material is unchanged.
Topic-note retrieval is shared by quizzes and plans: it includes subtopics,
checks section headings when body keywords miss, and reuses the current topic's
verified quiz-source chunks when planning. This applies to every topic, not a
hard-coded sample subject. Genuinely unavailable evidence is reported without
inventing tips or asking students to re-upload material merely because a label
didn't match.

Question acceptance requires a retrieved chunk ID, a whitespace-normalized exact
source quote, distinct options, appropriate misconception entries, and an
independent fast-model grounding pass. Counts shown in the UI describe the current
generation request; cached questions were verified when initially generated.
During a quiz only the source section is visible. Answer-revealing quotes and
grading fields are excluded from the quiz-start response and shown in the
submitted answer review instead.
If a topic has fewer than two accepted questions, generation makes at most one
targeted repair attempt using rejection feedback and the same retrieved evidence.
Both rounds count toward generated/rejected totals; nothing bypasses verification.
Previously verified questions remain available when regeneration fails. The UI
shows rejection categories without exposing answer text before submission.

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
GROQ_MODEL=openai/gpt-oss-120b
GROQ_FAST_MODEL=openai/gpt-oss-20b
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is also accepted for projects using the legacy
public anon key. Never put a service-role or secret Supabase key in a public
variable. Groq model availability varies: verify IDs in your Groq console.
The configured account currently uses approved local overrides
`openai/gpt-oss-120b` and `openai/gpt-oss-20b`; these also need setting on Vercel.
These are also the code defaults: the 120B production model handles generation,
and the faster, cheaper 20B production model handles verification, mapping, and
tips. Newer preview models are not automatically selected; model changes do not
remove account-level API quotas.

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

- **27 unit tests pass:** chunking, scoring, and planning only.
- Production build and strict TypeScript checks pass.
- All workspace pages redirect signed-out visitors to login; tested APIs return 401.
- Invalid-login errors were checked in-browser; successful login was reported by the user.
- Historical live Groq checks on the original Biology fixture returned its four topics.
- Two historical live Groq quiz smoke checks on that fixture: **3 generated, 3 accepted, 0 rejected** in total,
  with valid quotes and independent grounding checks. These small runs are not a general accuracy benchmark.
- Actual pdf-parse extraction was verified with a text-based PDF buffer.
- Sample past-paper parsing found all ten questions.
- The Electricity v2 fixture check preserved all four outline topics and ten
  note sections, parsed all ten complete paper questions, and verified fresh
  loading, duplicate avoidance, and protection of old material using a local
  database stub. No remote student records or AI quota were used.
- Isolated retrieval checks covered heading-only sources for Photosynthesis,
  Respiration, Human Digestion, Transportation, Algebra, and Cell Division,
  plus exact-citation fallback and genuinely missing material. Plan retrieval
  keeps citations scoped to the current topic and leaves scores/minutes unchanged.
- Revision-sheet checks verified owner-scoped plan loading, rejection of foreign
  and invalid plan IDs, daily checklist rendering, visible/escaped source quotes,
  and PDF layout using a synthetic sample. Export makes no AI calls or database writes.
- UI uses shared page headers, accessible decorative icons, visible keyboard
  focus, reduced-motion support, and responsive cards/navigation. Plan/report
  sample layouts were checked at 390px and 1440px without page overflow.
  Login's browser accessibility and best-practices audits scored 100 in the local check.
- Current sample exam counts: Electric Current 2, Potential Difference and
  Resistance 3, Series and Parallel Circuits 3, Electrical Power and Energy 2.
  Two questions per topic gives an eight-question sample quiz. Live AI mapping
  and generation on this new fixture still need a signed-in end-to-end check.
- Full authenticated upload → retake flow still needs checking after the migration
  is applied. No test student data was inserted by the coding agent.
- Chat streams progress and the final validated answer, not unvalidated model tokens.
  Empty retrieval returns exactly `I couldn't find this in your uploaded material.`
  without an LLM call; irrelevant retrieved passages must also trigger refusal.
- Isolated chat smoke checks passed: empty-retrieval stub made **zero model calls**;
  live in-scope generation cited the supplied passage; an unrelated question was
  refused even when a science passage was supplied. These checks did not insert
  database rows or exercise a signed-in HTTP session.
- Deployment remains pending the external setup in DEPLOYMENT.md.

## Two-minute demo

1. Sign in with a fresh test account and click **Load sample data** on Upload.
2. Build Topics; show the tree and paper-frequency bars.
3. Prepare and start Quiz; deliberately mix sure/guessing and right/wrong answers.
4. Open the gap report; show reasons, blind spots, source quotes, and explanations.
5. Build a plan with five days and two hours/day.
6. Retake with improved answers; compare the updated plan and Dashboard.
7. Ask Chat for an in-scope explanation, then ask an unrelated question to show refusal.

### New sample: Electricity and Circuits (v2)

The bundled sample is now **Class 10 Physics**, not the original Biology pack.
It covers current, voltage/resistance, series/parallel circuits, and power/energy.
See [sample-data/README.md](sample-data/README.md) for expected topic weights,
past-paper answers, retrieval queries, and chat checks.

Use a **fresh test account**. The loader gives this version distinct document
names and refuses to combine it with an account's existing material. Previously
uploaded Biology documents, quiz questions, attempts, and plans remain untouched;
changing these local fixture files does not replace saved student data.

## Keep an offline revision sheet

On a saved plan, click **Print / Save as PDF** to open its revision sheet in a new
tab. Click the print button there and choose **Save as PDF** (or a printer).
The sheet includes a daily checklist, prioritized topic guides, mastery and
mistake facts, saved revision tips, correct answers/explanations, and visible
source quotes. Navigation and print controls are excluded from the printed copy.

The sheet uses the exact saved plan ID and its submitted attempt, not whichever
plan is newest. Its dates identify the snapshot; save a new sheet after a retake.
It requires sign-in, respects ownership/RLS, makes no additional AI calls, and
does not change your scores, minutes, or uploaded material. Checkboxes can be
ticked on the page or paper; page checkmarks are not persisted.

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
