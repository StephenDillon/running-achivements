import { NextResponse } from "next/server";
import { adminClient } from "@/lib/server/supabase";
import { getCurrentUserId } from "@/lib/server/session";

const noStore = { "Cache-Control": "no-store" };

// Current user's profile. Authorization: the user id comes from the verified session cookie, never the client.
export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });

  const { data, error } = await adminClient()
    .from("profiles")
    .select("first_name, last_name, avatar_url, strava_athlete_id, created_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });

  return NextResponse.json(
    {
      firstName: data.first_name,
      lastName: data.last_name,
      avatarUrl: data.avatar_url,
      stravaAthleteId: data.strava_athlete_id,
      memberSince: data.created_at,
    },
    { headers: noStore },
  );
}
