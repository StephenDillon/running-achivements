// Pure badge evaluation: no I/O, no secrets, so it is unit-testable (npm test).
import type { Badge } from "../badges";

export type RunActivity = {
  id: number;
  startDate: string; // ISO instant
  startLocal: string; // runner's local wall-clock time, "YYYY-MM-DDTHH:mm:ss" (used only for day/week/month bucketing)
  distanceM: number;
  movingTime: number; // seconds
  bestEfforts: { name: string; elapsedTime: number }[] | null; // null = detail not fetched
};

export type Award = { badgeId: string; earnedAt: string; activityId: number };

// GPS rarely records exactly 5.000 km, so allow 0.5% under for "ran X distance" badges.
const DISTANCE_TOLERANCE = 0.995;

// Strava's best-effort names for the distances our time badges use. Strava capitalizes some of them
// inconsistently ("5K", "1 mile", "Half-Marathon"), so names are always compared case-insensitively.
const EFFORTS: [distanceM: number, name: string][] = [
  [1609, "1 mile"],
  [5000, "5k"],
  [10000, "10k"],
  [21097.5, "Half-Marathon"],
  [42195, "Marathon"],
];
const effortName = (distanceM: number) => EFFORTS.find(([d]) => Math.abs(d - distanceM) < 1)?.[1].toLowerCase();

const day = (r: RunActivity) => r.startLocal.slice(0, 10);
const dayNumber = (r: RunActivity) => Math.floor(Date.parse(`${day(r)}T00:00:00Z`) / 86_400_000);
// Monday-based week index (1970-01-05 was a Monday).
const weekIndex = (r: RunActivity) => Math.floor((dayNumber(r) + 3) / 7);

// First run at which the running total within each bucket reaches `target`, per bucket.
function bucketCrossings(runs: RunActivity[], key: (r: RunActivity) => string | number, target: number) {
  const totals = new Map<string | number, number>();
  const crossed = new Map<string | number, RunActivity>();
  for (const r of runs) {
    const k = key(r);
    const total = (totals.get(k) ?? 0) + r.distanceM;
    totals.set(k, total);
    // Half-meter slack: miles->meters conversion and float sums can land a hair under an exact target.
    if (total >= target - 0.5 && !crossed.has(k)) crossed.set(k, r);
  }
  return crossed;
}

// Given qualifying runs keyed by consecutive-able index, the run that completes a streak of `need`.
function streakCompletion(qualifying: Map<number, RunActivity>, need: number): RunActivity | undefined {
  const keys = [...qualifying.keys()].sort((a, b) => a - b);
  let streak = 0;
  for (let i = 0; i < keys.length; i++) {
    streak = i > 0 && keys[i] === keys[i - 1] + 1 ? streak + 1 : 1;
    if (streak >= need) return qualifying.get(keys[i]);
  }
  return undefined;
}

function evaluate(badge: Badge, runs: RunActivity[]): RunActivity | undefined {
  const rule = badge.rule;
  switch (rule.type) {
    case "best_time": {
      const name = effortName(rule.distanceM);
      if (!name) return undefined;
      return runs.find((r) =>
        r.bestEfforts?.some((e) => e.name.toLowerCase() === name && e.elapsedTime < rule.maxSeconds),
      );
    }
    case "longest_run":
      return runs.find((r) => r.distanceM >= rule.meters * DISTANCE_TOLERANCE);
    case "long_run_count":
      return runs.filter((r) => r.distanceM >= rule.meters * DISTANCE_TOLERANCE)[rule.count - 1];
    case "run_count":
      return runs[rule.count - 1];
    case "week_distance":
      return earliest(bucketCrossings(runs, weekIndex, rule.meters));
    case "month_distance":
      return earliest(bucketCrossings(runs, (r) => r.startLocal.slice(0, 7), rule.meters));
    case "year_distance":
      return earliest(bucketCrossings(runs, (r) => r.startLocal.slice(0, 4), rule.meters));
    case "streak_days": {
      const firstRunOfDay = new Map<number, RunActivity>();
      for (const r of runs) if (!firstRunOfDay.has(dayNumber(r))) firstRunOfDay.set(dayNumber(r), r);
      return streakCompletion(firstRunOfDay, rule.days);
    }
    case "weekly_runs_streak": {
      const perWeek = new Map<number, RunActivity[]>();
      for (const r of runs) perWeek.set(weekIndex(r), [...(perWeek.get(weekIndex(r)) ?? []), r]);
      const qualifying = new Map<number, RunActivity>();
      for (const [w, list] of perWeek) if (list.length >= rule.runs) qualifying.set(w, list[rule.runs - 1]);
      return streakCompletion(qualifying, rule.weeks);
    }
    case "weekly_distance_streak":
      return streakCompletion(
        bucketCrossings(runs, weekIndex, rule.meters) as Map<number, RunActivity>,
        rule.weeks,
      );
  }
}

function earliest(crossed: Map<string | number, RunActivity>): RunActivity | undefined {
  let best: RunActivity | undefined;
  for (const r of crossed.values()) if (!best || r.startDate < best.startDate) best = r;
  return best;
}

// Every badge the runs qualify for, dated by the activity that completed it.
export function evaluateBadges(runsIn: RunActivity[], badges: Badge[]): Award[] {
  const runs = [...runsIn].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const awards: Award[] = [];
  for (const badge of badges) {
    const run = evaluate(badge, runs);
    if (run) awards.push({ badgeId: badge.id, earnedAt: run.startDate, activityId: run.id });
  }
  return awards;
}

// Strava only returns best efforts from the per-activity detail call, which is rate limited, so we
// can't fetch it for every run. A run's best effort is at least as fast as its average pace, so the
// runs with the fastest average pace over a distance are the ones that can unlock a time badge.
export function pickDetailCandidates(runs: RunActivity[], distances: number[], perDistance = 8): number[] {
  const ids = new Set<number>();
  for (const d of distances) {
    runs
      .filter((r) => r.distanceM >= d && r.movingTime > 0)
      .map((r) => ({ id: r.id, estimate: (r.movingTime * d) / r.distanceM }))
      .sort((a, b) => a.estimate - b.estimate)
      .slice(0, perDistance)
      .forEach((c) => ids.add(c.id));
  }
  return [...ids];
}

export const timeBadgeDistances = (badges: Badge[]) => [
  ...new Set(badges.flatMap((b) => (b.rule.type === "best_time" ? [b.rule.distanceM] : []))),
];
