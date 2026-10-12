import { categories, type Group } from "@/lib/badges";

// Presentational: renders one ladder of badges. `earned` maps badge id -> ISO date earned.
// Server/client agnostic; the client wrapper supplies earned data from the API.
export default function BadgeGroupCard({ group, earned }: { group: Group; earned?: Record<string, string> }) {
  const category = categories.find((c) => c.id === group.category)!;
  const color = category.color;
  const done = group.badges.filter((b) => earned?.[b.id]).length;
  const next = earned ? group.badges.find((b) => !earned[b.id]) : undefined;
  const total = group.badges.length;

  return (
    <article className="rounded-2xl border border-foreground/10 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold">{group.name}</h3>
          <span className={`rounded-full px-2 py-0.5 text-xs ${category.tag}`}>{category.name}</span>
        </div>
        {earned && (
          <span className="shrink-0 text-sm text-foreground/60">
            {done} of {total}
          </span>
        )}
      </div>
      <p className="mt-0.5 text-sm text-foreground/70">{group.blurb}</p>

      {earned && (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-label={`${group.name} badges earned`}
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-foreground/10"
        >
          <div className={`h-full ${color}`} style={{ width: `${(done / total) * 100}%` }} />
        </div>
      )}

      <ol className="mt-4 flex flex-wrap gap-x-3 gap-y-4">
        {group.badges.map((badge) => {
          const isEarned = !!earned?.[badge.id];
          const isNext = next?.id === badge.id;
          return (
            <li key={badge.id} className="w-[4.5rem] text-center" title={badge.description}>
              <div className="relative mx-auto w-fit">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full text-xs font-bold leading-tight ${
                    isEarned
                      ? `${color} text-white shadow-inner ring-4 ring-foreground/10`
                      : isNext
                        ? "border-2 border-dashed border-foreground/60 text-foreground/80"
                        : "border-2 border-dashed border-foreground/20 text-foreground/40"
                  }`}
                >
                  {badge.emblem}
                </div>
                {isEarned && (
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-background text-xs text-emerald-600 ring-1 ring-foreground/20">
                    ✓
                  </span>
                )}
              </div>
              <p className={`mt-1.5 text-xs leading-tight ${isEarned ? "" : "text-foreground/60"}`}>{badge.name}</p>
            </li>
          );
        })}
      </ol>

      {next && (
        <p className="mt-4 rounded-lg bg-foreground/5 px-3 py-2 text-sm">
          <span className="font-medium">Next up:</span> {next.name} — {next.description}
        </p>
      )}
      {earned && !next && <p className="mt-4 text-sm font-medium">Complete — every badge earned!</p>}
    </article>
  );
}
