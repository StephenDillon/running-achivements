import "server-only";
import { env } from "./env";
import { adminClient } from "./supabase";

// activity:read_all includes private activities; "read" is basic profile.
export const STRAVA_SCOPE = "read,activity:read_all";

export type StravaAthlete = {
  id: number;
  firstname?: string;
  lastname?: string;
  profile?: string;
};

export type StravaTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number; // unix seconds
  athlete?: StravaAthlete;
};

export function authorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.stravaClientId(),
    redirect_uri: env.stravaRedirectUri(),
    response_type: "code",
    approval_prompt: "auto",
    scope: STRAVA_SCOPE,
    state,
  });
  return `https://www.strava.com/oauth/authorize?${params}`;
}

async function tokenRequest(body: Record<string, string>): Promise<StravaTokenResponse> {
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.stravaClientId(),
      client_secret: env.stravaClientSecret(),
      ...body,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Strava token request failed: ${res.status}`);
  return (await res.json()) as StravaTokenResponse;
}

export const exchangeCode = (code: string) =>
  tokenRequest({ code, grant_type: "authorization_code" });

export const refreshToken = (refresh_token: string) =>
  tokenRequest({ refresh_token, grant_type: "refresh_token" });

export async function saveConnection(
  userId: string,
  athleteId: number,
  t: StravaTokenResponse,
  scope?: string,
) {
  const { error } = await adminClient()
    .from("strava_connections")
    .upsert({
      user_id: userId,
      athlete_id: athleteId,
      access_token: t.access_token,
      refresh_token: t.refresh_token,
      expires_at: new Date(t.expires_at * 1000).toISOString(),
      ...(scope ? { scope } : {}),
      updated_at: new Date().toISOString(),
    });
  if (error) throw new Error("Failed to save Strava connection");
}

// For background sync jobs: returns a usable Strava access token for the user,
// refreshing (and persisting the rotated refresh token) when it is about to expire.
export async function getValidAccessToken(userId: string): Promise<string> {
  const db = adminClient();
  const { data, error } = await db
    .from("strava_connections")
    .select("athlete_id, access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .single();
  if (error || !data) throw new Error("No Strava connection for user");

  const expiresMs = new Date(data.expires_at).getTime();
  if (expiresMs - Date.now() > 5 * 60 * 1000) return data.access_token;

  const fresh = await refreshToken(data.refresh_token);
  await saveConnection(userId, data.athlete_id, fresh);
  return fresh.access_token;
}

// Revokes our access on Strava's side. Best-effort: callers delete local data regardless.
export async function deauthorize(accessToken: string) {
  const res = await fetch("https://www.strava.com/oauth/deauthorize", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Strava deauthorize failed: ${res.status}`);
}
