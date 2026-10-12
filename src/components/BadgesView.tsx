"use client";

import { useEffect, useState } from "react";
import BadgeGroupCard from "@/components/BadgeGroupCard";
import { badges, categories, groupsByCategory } from "@/lib/badges";

// Untrusted display layer: earned state comes from the API, which derives it server-side from Strava data.
export default function BadgesView() {
  const [earned, setEarned] = useState<Record<string, string> | undefined>();
  const [signedIn, setSignedIn] = useState<boolean | undefined>();

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

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Badges</h1>
      <p className="mt-2 max-w-2xl text-foreground/70">
        {earned ? (
          <>
            You&apos;ve earned <strong>{count}</strong> of {badges.length} badges. Each group is a ladder, from first
            finish to fastest time.
          </>
        ) : (
          <>{badges.length} badges in ladders, from first finish to fastest time.</>
        )}
      </p>
      {signedIn === false && (
        <p className="mt-3 rounded-lg bg-foreground/5 px-4 py-2 text-sm">
          Connect with Strava to track which badges you&apos;ve earned.
        </p>
      )}
      <p className="mt-3 text-xs text-foreground/50">★ marks a milestone badge.</p>

      {categories.map((cat) => (
        <section key={cat.id} className="mt-10">
          <h2 className="text-xl font-semibold">{cat.name}</h2>
          <p className="text-sm text-foreground/70">{cat.blurb}</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {groupsByCategory(cat.id).map((g) => (
              <BadgeGroupCard key={g.id} group={g} earned={earned} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
