"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BadgeGroupCard from "@/components/BadgeGroupCard";
import NewBadgesModal, { type NewBadge } from "@/components/NewBadgesModal";
import { badges, categories, groups } from "@/lib/badges";

type EarnedRow = NewBadge & { seen: boolean };
type SyncResponse = {
  more: boolean;
  busy?: boolean;
  status: "ok" | "rate_limited" | "reauth" | "error";
  historyComplete: boolean;
  activityCount: number;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Untrusted display layer: earned state and sync both happen on the backend; this only shows the results.
export default function BadgesView() {
  const [earned, setEarned] = useState<EarnedRow[] | undefined>();
  const [signedIn, setSignedIn] = useState<boolean | undefined>();
  const [sync, setSync] = useState<SyncResponse | undefined>();
  const [syncing, setSyncing] = useState(false);
  const [popup, setPopup] = useState<NewBadge[]>([]);
  const [query, setQuery] = useState("");
  const started = useRef(false);

  const loadBadges = useCallback(async (showPopup: boolean) => {
    const res = await fetch("/api/v1/badges", { cache: "no-store" });
    if (res.status === 401) return setSignedIn(false);
    if (!res.ok) return; // show the catalog without progress
    const data = (await res.json()) as { earned: EarnedRow[] };
    setEarned(data.earned);
    setSignedIn(true);
    // Anything not yet shown (even from a previous visit), but only once the sync has settled.
    if (showPopup) setPopup(data.earned.filter((e) => !e.seen));
  }, []);

  // On every visit: load what's earned, then pull new Strava activities (the first visit pulls the whole history).
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      await loadBadges(false).catch(() => {});
      setSyncing(true);
      try {
        for (;;) {
          const res = await fetch("/api/v1/sync", { method: "POST" });
          if (!res.ok) break; // 401 when signed out
          const result = (await res.json()) as SyncResponse;
          setSync(result);
          if (!result.more) break;
          await sleep(result.busy ? 2000 : 200);
        }
      } catch {
        // network hiccup: the next visit retries
      } finally {
        setSyncing(false);
        await loadBadges(true).catch(() => {});
      }
    })();
  }, [loadBadges]);

  const closePopup = useCallback(() => {
    const ids = popup.map((b) => b.badgeId);
    setPopup([]);
    setEarned((rows) => rows?.map((r) => (ids.includes(r.badgeId) ? { ...r, seen: true } : r)));
    fetch("/api/v1/badges/seen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ badgeIds: ids }),
    }).catch(() => {}); // if this fails the popup simply shows again next visit
  }, [popup]);

  const earnedMap = earned && Object.fromEntries(earned.map((e) => [e.badgeId, e.earnedAt]));
  const count = earned?.length ?? 0;

  const q = query.trim().toLowerCase();
  const visible = groups.filter((g) => {
    if (!q) return true;
    const category = categories.find((c) => c.id === g.category)!.name;
    const haystack = [g.name, category, g.blurb, ...g.badges.flatMap((b) => [b.name, b.description, b.emblem])];
    return haystack.some((text) => text.toLowerCase().includes(q));
  });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search badges (e.g. 5K, marathon, streak)"
          aria-label="Search badges"
          className="min-w-0 flex-1 rounded-full border border-foreground/15 bg-transparent px-4 py-2 text-sm outline-none focus:border-foreground/40"
        />
        {earned && (
          <span className="text-sm text-foreground/60">
            {count} of {badges.length} earned
          </span>
        )}
      </div>

      {signedIn === false && (
        <p className="mt-3 rounded-lg bg-foreground/5 px-4 py-2 text-sm">
          Connect with Strava to track which badges you&apos;ve earned.
        </p>
      )}
      {syncing && (
        <p role="status" className="mt-3 rounded-lg bg-foreground/5 px-4 py-2 text-sm">
          {sync?.historyComplete === false
            ? `Syncing your Strava history… ${sync.activityCount} activities so far`
            : "Checking Strava for new activities…"}
        </p>
      )}
      {!syncing && sync?.status === "rate_limited" && (
        <p role="status" className="mt-3 rounded-lg bg-foreground/5 px-4 py-2 text-sm">
          Strava is limiting requests right now. We&apos;ll pick up where we left off on your next visit.
        </p>
      )}
      {!syncing && sync?.status === "reauth" && (
        <p role="alert" className="mt-3 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-600">
          Strava access was revoked. Log out and connect with Strava again to resume syncing.
        </p>
      )}
      {!syncing && sync?.status === "error" && (
        <p role="alert" className="mt-3 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-600">
          Couldn&apos;t sync with Strava. We&apos;ll try again next time you visit.
        </p>
      )}

      {visible.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {visible.map((g) => (
            <BadgeGroupCard key={g.id} group={g} earned={earnedMap} />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-center text-foreground/60">No badges match &ldquo;{query}&rdquo;.</p>
      )}

      {popup.length > 0 && <NewBadgesModal badges={popup} onClose={closePopup} />}
    </div>
  );
}
