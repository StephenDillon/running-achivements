import assert from "node:assert/strict";
import { test } from "node:test";
import { badges } from "../badges.ts";
import { evaluateBadges, pickDetailCandidates, timeBadgeDistances, type RunActivity } from "./evaluate.ts";

const MI = 1609.344;
let nextId = 1;
function run(date: string, distanceM: number, movingTime = distanceM / 3, bestEfforts: RunActivity["bestEfforts"] = null): RunActivity {
  return { id: nextId++, startDate: `${date}T12:00:00Z`, startLocal: `${date}T07:00:00`, distanceM, movingTime, bestEfforts };
}
const earned = (runs: RunActivity[]) => new Map(evaluateBadges(runs, badges).map((a) => [a.badgeId, a]));

test("nothing earned with no runs", () => {
  assert.equal(evaluateBadges([], badges).length, 0);
});

test("distance badges use the first qualifying run, with GPS tolerance", () => {
  const short = run("2026-01-01", 4990); // 5K recorded as 4.99 km still counts
  const long = run("2026-02-01", 10 * MI);
  const e = earned([long, short]); // order shouldn't matter
  assert.equal(e.get("dist-5k")?.activityId, short.id);
  assert.equal(e.get("dist-10k")?.activityId, long.id);
  assert.equal(e.get("dist-10-mile")?.activityId, long.id);
  assert.equal(e.has("dist-half"), false);
});

test("time badges come from best efforts, not average pace", () => {
  const fast = run("2026-03-01", 8000, 2400, [{ name: "5k", elapsedTime: 1190 }]); // 19:50 within a longer run
  const e = earned([fast]);
  assert.ok(e.has("5k-sub-20") && e.has("5k-sub-25") && e.has("5k-sub-40"));
  assert.equal(e.has("5k-sub-18"), false);
  // Without detail data nothing time-based is awarded.
  assert.equal(earned([run("2026-03-01", 5000, 1000)]).has("5k-sub-20"), false);
});

test("effort names match regardless of Strava's capitalization", () => {
  const r = run("2026-03-01", 12000, 3600, [
    { name: "5K", elapsedTime: 1500 },
    { name: "10K", elapsedTime: 2990 },
    { name: "1 mile", elapsedTime: 400 },
    { name: "Half-Marathon", elapsedTime: 6000 },
  ]);
  const e = earned([r]);
  assert.ok(e.has("5k-sub-25") === false && e.has("5k-sub-30")); // 25:00 exactly is not under 25
  assert.ok(e.has("10k-sub-50") && e.has("mile-sub-7") && e.has("half-sub-2"));
});

test("a later, faster run awards the harder badge on its own date", () => {
  const a = run("2026-01-01", 5000, 1700, [{ name: "5k", elapsedTime: 1700 }]);
  const b = run("2026-06-01", 5000, 1150, [{ name: "5k", elapsedTime: 1150 }]);
  const e = earned([a, b]);
  assert.equal(e.get("5k-sub-30")?.activityId, a.id);
  assert.equal(e.get("5k-sub-20")?.activityId, b.id);
});

test("run streak needs consecutive local days", () => {
  const days = Array.from({ length: 7 }, (_, i) => run(`2026-04-0${i + 1}`, 3000));
  assert.ok(earned(days).has("cons-streak-7"));
  const gap = days.filter((_, i) => i !== 3);
  assert.equal(earned(gap).has("cons-streak-7"), false);
});

test("weeks are Monday-based and week mileage accumulates across runs", () => {
  // 2026-03-02 is a Monday. Sunday the 8th belongs to the same week.
  const week = [run("2026-03-02", 8 * MI), run("2026-03-04", 6 * MI), run("2026-03-06", 6 * MI), run("2026-03-08", 10 * MI)];
  const e = earned(week);
  assert.equal(e.get("train-week-20")?.activityId, week[2].id); // crossed 20 mi on the third run
  assert.equal(e.get("train-week-30")?.activityId, week[3].id);
  // Same miles split across Sunday/Monday do not combine.
  const split = [run("2026-03-01", 12 * MI), run("2026-03-02", 12 * MI)];
  assert.equal(earned(split).has("train-week-20"), false);
});

test("weekly runs streak, month and year totals, run count", () => {
  const runs: RunActivity[] = [];
  for (let w = 0; w < 4; w++) for (const d of [0, 2, 4]) {
    const date = new Date(Date.UTC(2026, 2, 2 + w * 7 + d)).toISOString().slice(0, 10); // from Mon 2026-03-02
    runs.push(run(date, 5 * MI));
  }
  const e = earned(runs);
  assert.ok(e.has("cons-3x-4"));
  assert.equal(e.has("cons-3x-12"), false);
  assert.ok(e.has("cons-month-50")); // 12 runs x 5 mi spans March/April; March alone has > 50 mi
  assert.equal(e.has("cons-runs-100"), false);
  assert.ok(e.has("cons-runs-1"));
});

test("detail candidates favour the fastest-looking runs per distance", () => {
  const slowLong = run("2026-01-01", 20000, 20000 / 2.5);
  const fastShort = run("2026-01-02", 5200, 5200 / 4.5);
  const tooShort = run("2026-01-03", 4000, 4000 / 6); // can't contain a 5K effort
  const ids = pickDetailCandidates([slowLong, fastShort, tooShort], [5000], 1);
  assert.deepEqual(ids, [fastShort.id]);
  assert.ok(timeBadgeDistances(badges).includes(5000));
});
