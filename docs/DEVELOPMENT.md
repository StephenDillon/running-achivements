# Development Rules

These rules apply to every human and AI contributor. Follow them over convenience.

## Workflow
- Work **directly on `main`**. No feature branches or PRs for now.
- **Do not `git push`.** The owner reviews all code changes locally before anything is pushed. Commit only when asked.
- Keep changes small and reviewable; don't mix unrelated edits.

## Security model (non-negotiable)
- **The frontend is untrusted.** Assume anything running in the browser can be inspected, modified, or replayed.
- **All data is read and written through REST APIs** (Next.js route handlers under `src/app/api/`). Components never talk to the database or Strava directly.
- **The API layer owns auth and enforcement**: authenticate the caller, authorize every resource access (a user can only touch their own data), and validate all input (e.g. with zod). Never trust IDs, roles, or badge/earned state sent by the client.
- **All secrets and API keys stay on the backend.** Only variables prefixed `NEXT_PUBLIC_` reach the browser, and those must be safe to be public. Never put the Supabase service-role key, Strava client secret, or any user tokens in client code or `NEXT_PUBLIC_*`.
- Server-only modules must `import "server-only"` so the build fails if they are bundled for the client.
- **Supabase is backend-only.** The browser has no Supabase URL or anon key; env vars are `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (no `NEXT_PUBLIC_` variants). The service-role key bypasses RLS, so every query must be scoped to the authenticated user in API code.
- **All tables live in the schema named by `DB_SCHEMA`** (e.g. `ra_local`), which keeps this app's data separate from other projects sharing the same Supabase DB. Create the Supabase client with that schema (`db: { schema: process.env.DB_SCHEMA }`), never write to `public`, and add the schema to Supabase's "Exposed schemas" API setting. Use a different schema name per environment.
- Enable Supabase Row Level Security on every table as defense in depth; the API must still enforce access itself.
- Don't log secrets or tokens. Return generic errors to clients.

## Strava brand guidelines (required by the Strava API agreement)
Full rules: https://developers.strava.com/guidelines/
- Use only the official, unmodified assets in `public/strava/` (never recreate, recolor, crop or animate them). The "Powered by Strava" logo stays in the footer on every page; the login control must be the official "Connect with Strava" button (48px tall).
- Strava's logo must be visually separate from, and less prominent than, our app name/logo. Never use it as our icon, put "Strava" in our app name, or imply Strava endorses or built this app.
- Any link back to original Strava data (e.g. an activity) must use the exact text **View on Strava**, legible, and styled bold, underlined, or `#FC5200`.
- Refer to the company as "Strava" in plain, truthful text.

## Stack & conventions
- Next.js App Router, TypeScript (strict), Tailwind CSS, Supabase Postgres, deployed on Vercel.
- **This Next.js version is newer than most training data.** Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code.
- Path alias `@/*` → `src/*`.
- Layout: `src/app` (routes, `api/` handlers), `src/components` (UI only), `src/lib` (shared logic; server-only code clearly marked).
- Server Components by default; add `"use client"` only when needed.
- Environment variables: document every one in `.env.example` (no real values). Real values go in `.env.local` and Vercel project settings — never committed.

## Checks before handing work back
```bash
npm run lint
npm run build
```
