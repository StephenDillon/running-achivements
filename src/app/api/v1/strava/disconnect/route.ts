import { NextResponse } from "next/server";
import { adminClient } from "@/lib/server/supabase";
import { clearSessionCookies, getCurrentUserId } from "@/lib/server/session";
import { deauthorize, getValidAccessToken } from "@/lib/server/strava";

// Disconnects Strava and deletes the account. Strava is our only login, and Strava's API terms
// require removing a user's data once they revoke access. Deleting the auth user cascades to
// profiles and strava_connections.
export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await deauthorize(await getValidAccessToken(userId));
  } catch (err) {
    // Token may already be revoked on Strava's side; still delete our copy.
    console.error("Strava deauthorize failed:", err instanceof Error ? err.message : err);
  }

  const { error } = await adminClient().auth.admin.deleteUser(userId);
  if (error) {
    console.error("Account deletion failed:", error.message);
    return NextResponse.json({ error: "Could not disconnect. Please try again." }, { status: 500 });
  }

  await clearSessionCookies();
  return NextResponse.json({ ok: true });
}
