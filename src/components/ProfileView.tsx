"use client";

import { useEffect, useState } from "react";
import { fetchMe, type Me } from "@/lib/me";

export default function ProfileView() {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMe().then((m) => {
      if (!m) window.location.href = "/";
      else setMe(m);
    });
  }, []);

  if (!me) return <p className="text-foreground/50">Loading…</p>;

  async function disconnect() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/strava/disconnect", { method: "POST" });
      if (!res.ok) throw new Error();
      window.location.href = "/";
    } catch {
      setError("Could not disconnect. Please try again.");
      setBusy(false);
    }
  }

  const name = [me.firstName, me.lastName].filter(Boolean).join(" ") || "Runner";

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        {me.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={me.avatarUrl} alt="" className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <div className="h-20 w-20 rounded-full bg-foreground/10" />
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
          <p className="text-sm text-foreground/60">
            Member since {new Date(me.memberSince).toLocaleDateString()}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-foreground/10 p-6">
        <h2 className="font-semibold">Strava connection</h2>
        <p className="mt-1 text-sm text-foreground/70">
          Connected as athlete{" "}
          <a
            href={`https://www.strava.com/athletes/${me.stravaAthleteId}`}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            #{me.stravaAthleteId}
          </a>
          . We use it to read your activities and award badges.
        </p>

        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="mt-4 rounded-full border border-red-500/40 px-4 py-1.5 text-sm text-red-600 hover:bg-red-500/10"
          >
            Disconnect Strava
          </button>
        ) : (
          <div className="mt-4 rounded-lg bg-red-500/10 p-4 text-sm">
            <p>
              This revokes our access on Strava and <strong>permanently deletes your account and
              badges</strong> here. You can sign up again any time by reconnecting.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={disconnect}
                disabled={busy}
                className="rounded-full bg-red-600 px-4 py-1.5 text-white disabled:opacity-50"
              >
                {busy ? "Disconnecting…" : "Yes, disconnect"}
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={busy}
                className="rounded-full px-4 py-1.5 hover:bg-foreground/5"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      </section>
    </div>
  );
}
