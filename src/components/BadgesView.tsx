"use client";

import { useEffect, useState } from "react";
import BadgeGroupCard from "@/components/BadgeGroupCard";
import { badges, categories, groups } from "@/lib/badges";

// Untrusted display layer: earned state comes from the API, which derives it server-side from Strava data.
export default function BadgesView() {
  const [earned, setEarned] = useState<Record<string, string> | undefined>();
  const [signedIn, setSignedIn] = useState<boolean | undefined>();
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/v1/badges", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) return setSignedIn(false);
        if (!res.ok) return; // show the catalog without progress
        const data = (await res.json()) as { earned: { badgeId: string; earnedAt: string }[] };
        setEarned(Object.fromEntries(data.earned.map((e) => [e.badgeId, e.earnedAt])));
        setSignedIn(true);
      })
      .catch(() => {});
  }, []);

  const count = earned ? badges.filter((b) => earned[b.id]).length : 0;

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

      {visible.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {visible.map((g) => (
            <BadgeGroupCard key={g.id} group={g} earned={earned} />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-center text-foreground/60">No badges match &ldquo;{query}&rdquo;.</p>
      )}
    </div>
  );
}
