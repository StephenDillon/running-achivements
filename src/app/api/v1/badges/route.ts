import { NextResponse } from "next/server";
import { adminClient } from "@/lib/server/supabase";
import { getCurrentUserId } from "@/lib/server/session";

const noStore = { "Cache-Control": "no-store" };

// Badges the signed-in user has earned. Only the backend writes earned_badges; the client can't award itself badges.
export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });

  const { data, error } = await adminClient()
    .from("earned_badges")
    .select("badge_id, earned_at")
    .eq("user_id", userId);
  if (error) {
    console.error("Failed to load earned badges:", error.message);
    return NextResponse.json({ error: "Could not load badges" }, { status: 500, headers: noStore });
  }

  return NextResponse.json(
    { earned: data.map((r) => ({ badgeId: r.badge_id, earnedAt: r.earned_at })) },
    { headers: noStore },
  );
}
