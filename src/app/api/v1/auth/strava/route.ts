import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authorizeUrl } from "@/lib/server/strava";

const STATE_COOKIE = "ra_oauth_state";

// Starts the Strava OAuth flow. The random state is bound to this browser via a cookie (CSRF protection).
export async function GET() {
  const state = randomBytes(24).toString("hex");
  (await cookies()).set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return NextResponse.redirect(authorizeUrl(state));
}
