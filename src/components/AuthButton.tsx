"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { fetchMe, logout, type Me } from "@/lib/me";

// Untrusted display layer: asks the API who we are; all auth decisions happen server-side.
export default function AuthButton() {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMe().then(setMe);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (me === undefined) return <div className="h-12 w-[237px]" />;

  if (!me) {
    return (
      <a href="/api/v1/auth/strava" aria-label="Connect with Strava">
        {/* Official Strava button, unmodified; must stay 48px tall per Strava brand guidelines. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/strava/connect-with-strava.svg" alt="Connect with Strava" width={237} height={48} />
      </a>
    );
  }

  const initial = me.firstName?.[0] ?? "?";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-foreground/10 text-sm font-medium ring-offset-2 hover:ring-2 hover:ring-foreground/20"
      >
        {me.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={me.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-2 w-44 overflow-hidden rounded-xl border border-foreground/10 bg-background py-1 text-sm shadow-lg"
        >
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 hover:bg-foreground/5"
          >
            Profile
          </Link>
          <button
            role="menuitem"
            onClick={logout}
            className="block w-full px-4 py-2 text-left hover:bg-foreground/5"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
