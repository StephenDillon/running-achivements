import { NextResponse } from "next/server";
import { adminClient } from "@/lib/server/supabase";
import { getCurrentUserId } from "@/lib/server/session";

const noStore = { "Cache-Control": "no-store" };

// Badges the signed-in user has earned. Only the backend writes earned_badges; the client can't award itself badges.
export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });

  const db = adminClient();
  const [earned, sync] = await Promise.all([
    db.from("earned_badges").select("badge_id, earned_at, strava_activity_id, seen_at").eq("user_id", userId),
    db.from("sync_state").select("status, history_complete, last_synced_at").eq("user_id", userId).maybeSingle(),
  ]);
  if (earned.error) {
    console.error("Failed to load earned badges:", earned.error.message);
    return NextResponse.json({ error: "Could not load badges" }, { status: 500, headers: noStore });
  }

  return NextResponse.json(
    {
      earned: earned.data.map((r) => ({
        badgeId: r.badge_id,
        earnedAt: r.earned_at,
        activityId: r.strava_activity_id,
        seen: r.seen_at !== null, // false = show in the "new badges" popup
      })),
      sync: sync.data
        ? { status: sync.data.status, historyComplete: sync.data.history_complete, lastSyncedAt: sync.data.last_synced_at }
        : null,
    },
    { headers: noStore },
  );
}
