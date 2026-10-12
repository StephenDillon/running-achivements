import { NextResponse } from "next/server";
import { signOutCurrent } from "@/lib/server/session";

// Ends the browser session only. The stored Strava connection is kept so background sync continues.
export async function POST() {
  await signOutCurrent();
  return NextResponse.json({ ok: true });
}
