import "server-only";
import { cookies } from "next/headers";
import { adminClient } from "./supabase";

// Supabase session tokens live only in httpOnly cookies; browser JS never sees them.
const ACCESS = "ra_at";
const REFRESH = "ra_rt";
const ONE_YEAR = 60 * 60 * 24 * 365;

type Tokens = { access_token: string; refresh_token: string; expires_in: number };

const base = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function setSessionCookies(s: Tokens) {
  const jar = await cookies();
  jar.set(ACCESS, s.access_token, { ...base, maxAge: s.expires_in });
  // Long-lived: this is what keeps the user signed in across visits.
  jar.set(REFRESH, s.refresh_token, { ...base, maxAge: ONE_YEAR });
}

export async function clearSessionCookies() {
  const jar = await cookies();
  jar.delete(ACCESS);
  jar.delete(REFRESH);
}

// Mint a Supabase session for a Strava athlete whose identity we have just verified via OAuth.
// The synthetic email is never used for mail; it just gives each athlete one stable auth user.
export async function createSessionForAthlete(athleteId: number) {
  const db = adminClient();
  const email = `strava-${athleteId}@users.running-achievements.invalid`;

  // Creates the auth user on first login, returns the existing one afterwards.
  const { data, error } = await db.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { data: { strava_athlete_id: athleteId } },
  });
  if (error || !data.user) throw new Error("Failed to create auth user");

  const { data: verified, error: verifyError } = await adminClient().auth.verifyOtp({
    token_hash: data.properties.hashed_token,
    type: "magiclink",
  });
  if (verifyError || !verified.session) throw new Error("Failed to create session");

  return { userId: data.user.id, session: verified.session };
}

// Resolves the signed-in user from cookies, transparently refreshing an expired access token.
// Only call from route handlers (cookies can't be written from Server Components).
export async function getCurrentUserId(): Promise<string | null> {
  const jar = await cookies();
  const access = jar.get(ACCESS)?.value;
  const refresh = jar.get(REFRESH)?.value;
  if (!access && !refresh) return null;
  const db = adminClient();

  if (access) {
    const { data } = await db.auth.getUser(access);
    if (data.user) return data.user.id;
  }
  if (!refresh) return null;

  const { data, error } = await db.auth.refreshSession({ refresh_token: refresh });
  if (error || !data.session || !data.user) {
    await clearSessionCookies();
    return null;
  }
  await setSessionCookies(data.session);
  return data.user.id;
}

export async function signOutCurrent() {
  const jar = await cookies();
  const access = jar.get(ACCESS)?.value;
  if (access) await adminClient().auth.admin.signOut(access).catch(() => {});
  await clearSessionCookies();
}
