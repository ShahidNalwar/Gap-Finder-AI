# Release checklist

## Supabase

- [ ] For a new database run `supabase/schema.sql` once.
- [ ] For an existing original database run `supabase/migrations/001_attempt_integrity.sql`.
- [ ] Keep RLS enabled on every application table.
- [ ] Enable email/password Auth and create a demo student account.
- [ ] If confirmation is enabled, confirm the account before sharing it.
- [ ] Set Site URL to the final HTTPS Vercel origin.
- [ ] Allow `https://YOUR-DOMAIN/auth/callback` (and local callback URLs for development).

## GitHub / Vercel

- [ ] Create a GitHub repository and push the local commits. No remote is configured automatically.
- [ ] Import it into Vercel as a Next.js project using the repository root.
- [ ] Use a supported Node version (20.19+; Node 22 LTS recommended for deployment).
- [ ] Set build command to `npm run build`; retain the lockfile.
- [ ] Set the following environment variables for the intended deployment environments:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
  - `GROQ_API_KEY` (server-only)
  - `GROQ_MODEL` (currently approved: `openai/gpt-oss-120b`)
  - `GROQ_FAST_MODEL` (currently approved: `openai/gpt-oss-20b`)
- [ ] Do not add a Supabase service-role key. Do not commit `.env*`.
- [ ] Confirm the Vercel plan permits the configured 300-second AI routes; reduce
  material size or split work further if the platform's limit is lower.
- [ ] Deploy, then update Supabase's final callback URL and redeploy if public env values change.

## Verify in a private window

- [ ] Signed-out `/upload` redirects to `/login`.
- [ ] Demo login works; reloading keeps the session.
- [ ] Load sample → build topics → verify four topics and counts 3/3/2/2.
- [ ] Generate quiz → inspect generated/rejected counts and citations.
- [ ] Submit mixed-confidence answers → verify labels, blind spots, misconceptions.
- [ ] Build plan → ensure order and minutes fit five days × two hours/day.
- [ ] Retake → verify plan/mastery changes and Dashboard history.
- [ ] Explain an in-scope topic with citations; ask an out-of-scope question and verify refusal.
- [ ] Sign out → protected pages and APIs are unavailable.
- [ ] Add the verified live URL and public demo credentials to README.md.

The coding agent has not provisioned a GitHub/Vercel project, changed remote
Supabase settings, or created a demo account. Those external release steps remain pending.
