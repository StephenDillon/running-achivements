# Auth Design

Strava is the only identity provider. Supabase Auth owns the session. The browser never talks to Supabase.

## Flow
1. `GET /api/v1/auth/strava` — sets a random `state` cookie, redirects to Strava (`scope=read,activity:read_all`).
2. Strava redirects to `GET /api/v1/auth/callback?code&state&scope`:
   - verify `state` against cookie; require an activity scope was granted;
   - exchange `code` for tokens (client secret is server-side only);
   - `generateLink` (magiclink) for the synthetic email `strava-<athleteId>@users.running-achievements.invalid` — creates the Supabase user on first login, reuses it after — then `verifyOtp` server-side to get a Supabase session;
   - upsert `profiles` (name, avatar from Strava) and `strava_connections` (tokens);
   - store the Supabase access/refresh tokens in **httpOnly** cookies (`ra_at`, `ra_rt`), refresh cookie lives 1 year.
3. `GET /api/v1/me` — user from the verified cookie (never from client input); refreshes the Supabase session transparently when the access token expired. So returning visitors stay signed in without touching Strava.
4. `POST /api/v1/auth/logout` — ends the browser session only. The Strava connection is kept for background sync.

## Two separate tokens
- **Supabase session** (cookies): proves who the user is to *our* API. Refreshed automatically.
- **Strava tokens** (`strava_connections` table, service-role only): used by the backend to call Strava. Access tokens last ~6h; the refresh token rotates on each refresh. `getValidAccessToken(userId)` in `src/lib/server/strava.ts` refreshes and persists them, so background jobs (Vercel Cron / Strava webhooks) can sync with no user present.

## Notes / TODO
- Strava gives no email, hence the synthetic one.
- Tokens are plaintext in the DB behind service-role-only access; consider encryption (e.g. Supabase Vault) before launch.
- Strava apps start in single-athlete mode; request a higher athlete limit from Strava before opening to others.
- Strava "Authorization Callback Domain" must be `localhost` locally and the Vercel domain in production.
- Disconnect/delete-account flow (call Strava deauthorize, delete rows) not built yet.
