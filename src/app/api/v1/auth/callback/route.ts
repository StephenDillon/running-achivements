import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { adminClient } from "@/lib/server/supabase";
import { createSessionForAthlete, setSessionCookies } from "@/lib/server/session";
import { exchangeCode, saveConnection } from "@/lib/server/strava";

const STATE_COOKIE = "ra_oauth_state";

// Strava redirects here after the user approves. Verifies state, exchanges the code
// (client secret stays server-side), links the Strava athlete to a Supabase user, and starts a session.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const fail = (reason: string) => NextResponse.redirect(`${origin}/?auth_error=${reason}`);

  const jar = await cookies();
  const expectedState = jar.get(STATE_COOKIE)?.value;
  jar.delete(STATE_COOKIE);

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (searchParams.get("error") || !code) return fail("denied");
  if (!state || !expectedState || state !== expectedState) return fail("state");

  // The user can untick scopes on Strava's consent screen; we need to read activities.
  const granted = (searchParams.get("scope") ?? "").split(",");
  if (!granted.some((s) => s === "activity:read" || s === "activity:read_all")) {
    return fail("scope");
  }

  try {
    const token = await exchangeCode(code);
    const athlete = token.athlete;
    if (!athlete?.id) throw new Error("Strava response missing athlete");

    const { userId, session } = await createSessionForAthlete(athlete.id);

    const { error } = await adminClient()
      .from("profiles")
      .upsert({
        user_id: userId,
        strava_athlete_id: athlete.id,
        first_name: athlete.firstname ?? null,
        last_name: athlete.lastname ?? null,
        avatar_url: athlete.profile ?? null,
        updated_at: new Date().toISOString(),
      });
    if (error) throw new Error("Failed to save profile");

    await saveConnection(userId, athlete.id, token, granted.join(","));
    await setSessionCookies(session);
    return NextResponse.redirect(`${origin}/`);
  } catch (err) {
    console.error("Strava auth callback failed:", err instanceof Error ? err.message : err);
    return fail("server");
  }
}
