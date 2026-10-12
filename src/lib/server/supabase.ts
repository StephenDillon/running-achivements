import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

// Service-role client: bypasses RLS, so callers must scope every query to the authenticated user.
// Stateless on purpose (no persisted session) — a fresh client per use.
export function adminClient() {
  return createClient(env.supabaseUrl(), env.supabaseServiceKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: env.dbSchema() },
  });
}
