import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { adminClient } from "@/lib/server/supabase";
import { getCurrentUserId } from "@/lib/server/session";

const body = z.object({ badgeIds: z.array(z.string().max(64)).min(1).max(200) });

// Marks badges as shown in the popup. Scoped to the caller's own rows and only touches unseen ones.
export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { error } = await adminClient()
    .from("earned_badges")
    .update({ seen_at: new Date().toISOString() })
    .eq("user_id", userId)
    .in("badge_id", parsed.data.badgeIds)
    .is("seen_at", null);
  if (error) {
    console.error("Failed to mark badges seen:", error.message);
    return NextResponse.json({ error: "Could not update" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
