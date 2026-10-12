import "server-only";
import { badges } from "../badges";
import { evaluateBadges, pickDetailCandidates, timeBadgeDistances, type RunActivity } from "./evaluate";
import { adminClient } from "./supabase";
import { getValidAccessToken } from "./strava";
import { getBestEfforts, listActivities, RateLimitError, StravaAuthError } from "./strava-api";

const RUN_TYPES = ["Run", "TrailRun"];
const BUDGET_MS = 40_000; // stay well inside the serverless function limit; the client calls again if more remains
const DETAIL_BATCH = 15; // detail calls per request (Strava allows ~100 requests / 15 min)
const MIN_RESYNC_MS = 90_000; // don't hit Strava again if we synced very recently
const LOCK_MS = 2 * 60_000;

export type SyncResult = {
  more: boolean; // true = call again to continue
  busy?: boolean; // another request is already syncing this user
  skipped?: boolean; // synced very recently
  status: "ok" | "rate_limited" | "reauth" | "error";
  historyComplete: boolean;
  activityCount: number;
};

// Resumable sync for one user:
//   1. activities: page through the athlete's list (full history the first time, only new ones afterwards)
//   2. details:    fetch best efforts for the few runs that could unlock a time badge
//   3. evaluate:   award any newly qualifying badges (never revoked)
// Safe to call repeatedly; each call does a bounded amount of work and reports whether `more` remains.
export async function syncUser(userId: string): Promise<SyncResult> {
  const db = adminClient();
  const deadline = Date.now() + BUDGET_MS;

  await db.from("sync_state").upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });

  // Claim the lock atomically; fails if another request is mid-sync (and its lock hasn't expired).
  const lockExpiry = new Date(Date.now() - LOCK_MS).toISOString();
  const { data: state } = await db
    .from("sync_state")
    .update({ status: "running", locked_at: new Date().toISOString() })
    .eq("user_id", userId)
    .or(`status.neq.running,locked_at.lt.${lockExpiry}`)
    .select("history_complete, next_page, last_synced_at")
    .maybeSingle();

  const count = async () =>
    (await db.from("activities").select("*", { count: "exact", head: true }).eq("user_id", userId)).count ?? 0;

  if (!state) {
    return { more: true, busy: true, status: "ok", historyComplete: false, activityCount: await count() };
  }

  const finish = (status: string, error?: string) =>
    db.from("sync_state").update({ status, error_message: error ?? null, locked_at: null }).eq("user_id", userId);

  if (state.history_complete && state.last_synced_at && Date.now() - Date.parse(state.last_synced_at) < MIN_RESYNC_MS) {
    await finish("idle");
    return { more: false, skipped: true, status: "ok", historyComplete: true, activityCount: await count() };
  }

  try {
    const token = await getValidAccessToken(userId);
    let historyComplete: boolean = state.history_complete;

    // 1. Activities --------------------------------------------------------
    // After the first full pull, only ask for activities since the newest one we have (minus a day of overlap).
    let after: number | undefined;
    let page: number = state.next_page;
    if (state.history_complete) {
      const { data: newest } = await db
        .from("activities")
        .select("start_date")
        .eq("user_id", userId)
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      after = newest ? Math.floor(Date.parse(newest.start_date) / 1000) - 86_400 : undefined;
      page = 1;
    }

    for (;;) {
      const batch = await listActivities(token, page, after);
      if (batch.length) {
        const { error } = await db.from("activities").upsert(
          batch.map((a) => ({
            user_id: userId,
            strava_id: a.id,
            name: a.name ?? null,
            sport_type: a.sport_type ?? a.type ?? null,
            start_date: a.start_date,
            start_local: a.start_date_local,
            distance_m: a.distance,
            moving_time_s: a.moving_time,
            elapsed_time_s: a.elapsed_time,
          })),
          { onConflict: "user_id,strava_id" },
        );
        if (error) throw new Error(`Saving activities failed: ${error.message}`);
      }
      if (batch.length < 200) {
        historyComplete = true;
        await db.from("sync_state").update({ history_complete: true, next_page: 1 }).eq("user_id", userId);
        break;
      }
      page += 1;
      await db.from("sync_state").update({ next_page: page }).eq("user_id", userId);
      if (Date.now() > deadline) {
        await finish("idle");
        return { more: true, status: "ok", historyComplete: false, activityCount: await count() };
      }
    }

    // 2. Details for runs that could unlock a time badge ------------------
    const runs = await loadRuns(userId);
    const missing = pickDetailCandidates(runs, timeBadgeDistances(badges)).filter(
      (id) => runs.find((r) => r.id === id)?.bestEfforts === null,
    );
    for (const id of missing.slice(0, DETAIL_BATCH)) {
      if (Date.now() > deadline) break;
      const efforts = await getBestEfforts(token, id);
      await db
        .from("activities")
        .update({ best_efforts: efforts, detail_fetched_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("strava_id", id);
    }
    if (missing.length > DETAIL_BATCH) {
      await finish("idle");
      return { more: true, status: "ok", historyComplete, activityCount: await count() };
    }

    // 3. Evaluate and award ------------------------------------------------
    const awards = evaluateBadges(await loadRuns(userId), badges);
    if (awards.length) {
      const { error } = await db.from("earned_badges").upsert(
        awards.map((a) => ({
          user_id: userId,
          badge_id: a.badgeId,
          strava_activity_id: a.activityId,
          earned_at: a.earnedAt,
        })),
        { onConflict: "user_id,badge_id", ignoreDuplicates: true }, // never overwrite or re-notify existing awards
      );
      if (error) throw new Error(`Saving badges failed: ${error.message}`);
    }

    await db
      .from("sync_state")
      .update({ status: "idle", error_message: null, locked_at: null, last_synced_at: new Date().toISOString() })
      .eq("user_id", userId);
    return { more: false, status: "ok", historyComplete: true, activityCount: await count() };
  } catch (err) {
    const base = { more: false, historyComplete: state.history_complete as boolean, activityCount: await count() };
    if (err instanceof RateLimitError) {
      await finish("rate_limited");
      return { ...base, status: "rate_limited" };
    }
    if (err instanceof StravaAuthError) {
      await finish("reauth"); // user revoked access on Strava's side; they need to reconnect
      return { ...base, status: "reauth" };
    }
    console.error("Sync failed:", err instanceof Error ? err.message : err);
    await finish("error", "sync failed");
    return { ...base, status: "error" };
  }
}

// All of a user's runs. PostgREST caps responses at 1000 rows, so page through.
async function loadRuns(userId: string): Promise<RunActivity[]> {
  const db = adminClient();
  const runs: RunActivity[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from("activities")
      .select("strava_id, start_date, start_local, distance_m, moving_time_s, best_efforts")
      .eq("user_id", userId)
      .in("sport_type", RUN_TYPES)
      .order("start_date", { ascending: true })
      .range(from, from + 999);
    if (error) throw new Error(`Loading activities failed: ${error.message}`);
    for (const r of data) {
      runs.push({
        id: r.strava_id,
        startDate: r.start_date,
        startLocal: r.start_local,
        distanceM: r.distance_m,
        movingTime: r.moving_time_s,
        bestEfforts: r.best_efforts,
      });
    }
    if (data.length < 1000) return runs;
  }
}
