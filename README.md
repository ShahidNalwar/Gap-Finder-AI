# GapFinder AI

Find what you don't know, then focus your revision where it matters.

## Current build: Slice 1

Implemented: email/password sign-up and sign-in, cookie-based Supabase SSR sessions,
protected workspace navigation, and sign-out. Upload, Topics, Quiz, Plan, Chat, and
Dashboard are **placeholders**, not implemented features yet.

Stack: Next.js App Router, strict TypeScript, Tailwind CSS, and Supabase Auth using
`@supabase/ssr`. Dependencies for later AI/PDF/test slices are installed but unused.

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
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is also accepted for projects using the legacy
public anon key. Never use a service-role or secret key here. Groq credentials
are not required until the AI slices.

In Supabase Authentication:

1. Enable email/password authentication.
2. For the immediate-signup demo flow, disable **Confirm email**.
3. If confirmation is enabled instead, allow
   `http://localhost:3000/auth/callback` as a redirect URL and set your local Site
   URL. The app exchanges the confirmation code for a cookie-based session.

Slice 1 needs no application tables. The supplied `supabase/schema.sql` will be
used in the next database step; it is unchanged in this slice.

## Checks

```sh
npm run build
npm run typecheck
```

Manual auth check:

1. Open `/upload` signed out: expect `/login`.
2. Create an account, or sign in to an existing confirmed account.
3. Expect `/upload`; reload and confirm that you remain signed in.
4. Visit each navigation link; expect a protected placeholder.
5. Sign out; `/upload` must redirect to `/login` again.
6. Signed-out `POST /api/auth/logout` must return HTTP 401.

Authentication is checked in the request proxy, the protected server layout,
and independently inside the logout API route. Auth responses are not publicly
cacheable. Sign-out affects the current session only.

No scoring or chunking tests exist yet; those arrive with their approved slices.
Live deployment and demo credentials are pending the release slice.

### Slice 1 verification

- Production build and strict TypeScript check pass.
- Signed-out access to all six workspace pages redirects to `/login`.
- Signed-out logout requests return HTTP 401.
- Invalid credentials display an inline error in the browser.
- Successful signup/login, reload persistence, and authenticated logout still
  require a real confirmed test account. Email confirmation is enabled on the
  configured Supabase project; no remote settings were changed.
