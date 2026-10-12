"use client";

import { useEffect, useRef } from "react";
import { badgeById, categories } from "@/lib/badges";

export type NewBadge = { badgeId: string; earnedAt: string; activityId: number | null };

export default function NewBadgesModal({ badges, onClose }: { badges: NewBadge[]; onClose: () => void }) {
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    button.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const items = [...badges].sort((a, b) => b.earnedAt.localeCompare(a.earnedAt));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-badges-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-md flex-col rounded-2xl bg-background p-6 shadow-xl ring-1 ring-foreground/10"
      >
        <h2 id="new-badges-title" className="text-xl font-bold">
          🎉 {items.length === 1 ? "New badge earned!" : `${items.length} new badges earned!`}
        </h2>

        <ul className="mt-4 space-y-3 overflow-y-auto">
          {items.map((item) => {
            const entry = badgeById.get(item.badgeId);
            if (!entry) return null;
            const category = categories.find((c) => c.id === entry.group.category)!;
            return (
              <li key={item.badgeId} className="flex items-center gap-3">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xs font-bold leading-tight text-white shadow-inner ring-4 ring-foreground/10 ${category.color}`}
                >
                  {entry.badge.emblem}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold leading-snug">{entry.badge.name}</p>
                  <p className="text-sm text-foreground/70">{entry.badge.description}</p>
                  <p className="mt-0.5 text-xs text-foreground/50">
                    {new Date(item.earnedAt).toLocaleDateString()}
                    {item.activityId && (
                      <>
                        {" · "}
                        {/* Strava brand guidelines: exact text "View on Strava", styled as a link (bold, underlined, #FC5200). */}
                        <a
                          href={`https://www.strava.com/activities/${item.activityId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-[#FC5200] underline"
                        >
                          View on Strava
                        </a>
                      </>
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        <button
          ref={button}
          onClick={onClose}
          className="mt-6 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          Awesome!
        </button>
      </div>
    </div>
  );
}
