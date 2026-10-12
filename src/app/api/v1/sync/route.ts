import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/server/session";
import { syncUser } from "@/lib/server/sync";

export const maxDuration = 60;

// Runs one bounded chunk of the user's Strava sync. The client calls this repeatedly while `more` is true.
// The user id comes from the verified session, so a caller can only ever sync their own account.
export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await syncUser(userId);
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
