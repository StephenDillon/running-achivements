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
- Enable Supabase Row Level Security on every table as defense in depth; the API must still enforce access itself.
- Don't log secrets or tokens. Return generic errors to clients.

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
