// Badge catalog. Definitions live in code (versioned, reviewable); earned badges reference `id`.
// Badges are organized into groups: ordered ladders from easiest to hardest (e.g. the 5K group).
// `rule` describes how the backend evaluator will award each badge from Strava run data (not built yet).

const MILE = 1609.344; // meters
const mi = (n: number) => n * MILE;
const km = (n: number) => n * 1000;
const HALF = 21097.5;
const MARATHON = 42195;
const mins = (m: number) => m * 60;
const hms = (h: number, m: number) => h * 3600 + m * 60;

export const categories = [
  { id: "speed", name: "Speed", blurb: "Break time barriers from the mile to the marathon.", color: "bg-sky-500", tag: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
  { id: "distance", name: "Distance", blurb: "Go farther than you ever have.", color: "bg-emerald-500", tag: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  { id: "training", name: "Marathon Training", blurb: "Long runs, big weeks and full training blocks.", color: "bg-violet-500", tag: "bg-violet-500/15 text-violet-700 dark:text-violet-300" },
  { id: "consistency", name: "Consistency", blurb: "Streaks, weekly habits and mileage over time.", color: "bg-amber-500", tag: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
] as const;

export type CategoryId = (typeof categories)[number]["id"];

export type Rule =
  // Fastest effort at a distance (Strava best efforts) strictly under maxSeconds ("sub-25" means < 25:00).
  | { type: "best_time"; distanceM: number; maxSeconds: number }
  // Longest single run at or over meters.
  | { type: "longest_run"; meters: number }
  // `count` separate runs of at least `meters`.
  | { type: "long_run_count"; meters: number; count: number }
  // Most distance in a single calendar week.
  | { type: "week_distance"; meters: number }
  // Consecutive days with at least one run.
  | { type: "streak_days"; days: number }
  // At least `runs` runs per week for `weeks` consecutive weeks.
  | { type: "weekly_runs_streak"; runs: number; weeks: number }
  // At least `meters` per week for `weeks` consecutive weeks.
  | { type: "weekly_distance_streak"; meters: number; weeks: number }
  // Distance in a single calendar month / year.
  | { type: "month_distance"; meters: number }
  | { type: "year_distance"; meters: number }
  // Total lifetime runs.
  | { type: "run_count"; count: number };

export type Badge = {
  id: string;
  name: string;
  description: string;
  emblem: string; // short text shown on the medal
  rule: Rule;
};

export type Group = {
  id: string;
  name: string;
  blurb: string;
  category: CategoryId;
  badges: Badge[]; // ordered easiest -> hardest
};

const b = (id: string, name: string, emblem: string, description: string, rule: Rule): Badge => ({
  id, name, emblem, description, rule,
});

// Time-goal badge, e.g. t("5k-sub-25", "Sub-25 5K", "<25", "Run a 5K in under 25 minutes.", km(5), mins(25))
const t = (id: string, name: string, emblem: string, description: string, distanceM: number, maxSeconds: number) =>
  b(id, name, emblem, description, { type: "best_time", distanceM, maxSeconds });

export const groups: Group[] = [
  // ── Speed ──────────────────────────────────────────────────────
  {
    id: "mile", name: "The Mile", category: "speed", blurb: "From your first mile to breaking six minutes.",
    badges: [
      b("dist-1-mile", "First Mile", "1 mi", "Run your first mile.", { type: "longest_run", meters: mi(1) }),
      t("mile-sub-10", "Sub-10 Mile", "<10:00", "Run a mile in under 10 minutes.", mi(1), mins(10)),
      t("mile-sub-9", "Sub-9 Mile", "<9:00", "Run a mile in under 9 minutes.", mi(1), mins(9)),
      t("mile-sub-8", "Sub-8 Mile", "<8:00", "Run a mile in under 8 minutes.", mi(1), mins(8)),
      t("mile-sub-7", "Sub-7 Mile", "<7:00", "Run a mile in under 7 minutes.", mi(1), mins(7)),
      t("mile-sub-6", "Sub-6 Mile", "<6:00", "Run a mile in under 6 minutes.", mi(1), mins(6)),
      t("mile-sub-5", "Sub-5 Mile", "<5:00", "Run a mile in under 5 minutes.", mi(1), mins(5)),
    ],
  },
  {
    id: "5k", name: "5K", category: "speed", blurb: "Finish one, then keep shaving time.",
    badges: [
      b("dist-5k", "5K Finisher", "5K", "Run 5 kilometers in one go.", { type: "longest_run", meters: km(5) }),
      t("5k-sub-40", "Sub-40 5K", "<40", "Run a 5K in under 40 minutes.", km(5), mins(40)),
      t("5k-sub-30", "Sub-30 5K", "<30", "Run a 5K in under 30 minutes.", km(5), mins(30)),
      t("5k-sub-25", "Sub-25 5K", "<25", "Run a 5K in under 25 minutes.", km(5), mins(25)),
      t("5k-sub-20", "Sub-20 5K", "<20", "Run a 5K in under 20 minutes.", km(5), mins(20)),
      t("5k-sub-18", "Sub-18 5K", "<18", "Run a 5K in under 18 minutes.", km(5), mins(18)),
    ],
  },
  {
    id: "10k", name: "10K", category: "speed", blurb: "Double the distance, double the fun.",
    badges: [
      b("dist-10k", "10K Finisher", "10K", "Run 10 kilometers in one go.", { type: "longest_run", meters: km(10) }),
      t("10k-sub-60", "Sub-60 10K", "<60", "Run a 10K in under an hour.", km(10), mins(60)),
      t("10k-sub-50", "Sub-50 10K", "<50", "Run a 10K in under 50 minutes.", km(10), mins(50)),
      t("10k-sub-45", "Sub-45 10K", "<45", "Run a 10K in under 45 minutes.", km(10), mins(45)),
      t("10k-sub-40", "Sub-40 10K", "<40", "Run a 10K in under 40 minutes.", km(10), mins(40)),
      t("10k-sub-35", "Sub-35 10K", "<35", "Run a 10K in under 35 minutes.", km(10), mins(35)),
    ],
  },
  {
    id: "half", name: "Half Marathon", category: "speed", blurb: "13.1 miles, and how fast you can do it.",
    badges: [
      b("dist-half", "Half Marathoner", "13.1", "Run 13.1 miles in one go.", { type: "longest_run", meters: HALF }),
      t("half-sub-2-30", "Sub-2:30 Half", "<2:30", "Run a half marathon in under 2:30.", HALF, hms(2, 30)),
      t("half-sub-2", "Sub-2:00 Half", "<2:00", "Break two hours for a half marathon.", HALF, hms(2, 0)),
      t("half-sub-1-45", "Sub-1:45 Half", "<1:45", "Run a half marathon in under 1:45.", HALF, hms(1, 45)),
      t("half-sub-1-30", "Sub-1:30 Half", "<1:30", "Run a half marathon in under 1:30.", HALF, hms(1, 30)),
      t("half-sub-1-20", "Sub-1:20 Half", "<1:20", "Run a half marathon in under 1:20.", HALF, hms(1, 20)),
    ],
  },
  {
    id: "marathon", name: "Marathon", category: "speed", blurb: "26.2 miles. Finish it, then chase the clock.",
    badges: [
      b("dist-marathon", "Marathoner", "26.2", "Run 26.2 miles in one go.", { type: "longest_run", meters: MARATHON }),
      t("marathon-sub-5", "Sub-5:00 Marathon", "<5:00", "Finish a marathon in under 5 hours.", MARATHON, hms(5, 0)),
      t("marathon-sub-4-30", "Sub-4:30 Marathon", "<4:30", "Finish a marathon in under 4:30.", MARATHON, hms(4, 30)),
      t("marathon-sub-4", "Sub-4:00 Marathon", "<4:00", "Break four hours for a marathon.", MARATHON, hms(4, 0)),
      t("marathon-sub-3-30", "Sub-3:30 Marathon", "<3:30", "Finish a marathon in under 3:30.", MARATHON, hms(3, 30)),
      t("marathon-sub-3", "Sub-3:00 Marathon", "<3:00", "Break three hours for a marathon.", MARATHON, hms(3, 0)),
    ],
  },

  // ── Distance ───────────────────────────────────────────────────
  {
    id: "long-distance", name: "Long Distance", category: "distance", blurb: "The big single runs between and beyond the race distances.",
    badges: [
      b("dist-10-mile", "Ten Miler", "10 mi", "Run 10 miles in one go.", { type: "longest_run", meters: mi(10) }),
      b("dist-20-mile", "Twenty Miler", "20 mi", "Run 20 miles in one go.", { type: "longest_run", meters: mi(20) }),
      b("dist-50k", "Ultra Runner", "50K", "Run 50 kilometers in one go.", { type: "longest_run", meters: km(50) }),
    ],
  },

  // ── Marathon training ──────────────────────────────────────────
  {
    id: "long-runs", name: "Long Run Habit", category: "training", blurb: "Repeat your long runs, the backbone of marathon prep.",
    badges: [
      b("train-long-10-x3", "Long Run Habit", "3×10", "Complete three runs of 10+ miles.", { type: "long_run_count", meters: mi(10), count: 3 }),
      b("train-long-16-x3", "Marathon Builder", "3×16", "Complete three runs of 16+ miles.", { type: "long_run_count", meters: mi(16), count: 3 }),
      b("train-long-20-x3", "Taper Ready", "3×20", "Complete three runs of 20+ miles.", { type: "long_run_count", meters: mi(20), count: 3 }),
    ],
  },
  {
    id: "peak-week", name: "Peak Week", category: "training", blurb: "Your biggest single week of mileage.",
    badges: [
      b("train-week-20", "20-Mile Week", "20/wk", "Run 20 miles in a single week.", { type: "week_distance", meters: mi(20) }),
      b("train-week-30", "30-Mile Week", "30/wk", "Run 30 miles in a single week.", { type: "week_distance", meters: mi(30) }),
      b("train-week-40", "40-Mile Week", "40/wk", "Run 40 miles in a single week.", { type: "week_distance", meters: mi(40) }),
      b("train-week-50", "50-Mile Week", "50/wk", "Run 50 miles in a single week.", { type: "week_distance", meters: mi(50) }),
      b("train-week-70", "70-Mile Week", "70/wk", "Run 70 miles in a single week.", { type: "week_distance", meters: mi(70) }),
    ],
  },
  {
    id: "training-blocks", name: "Training Blocks", category: "training", blurb: "Hold your weekly mileage for weeks on end.",
    badges: [
      b("train-block-base", "Base Builder", "8 wks", "Run 20+ miles a week for 8 weeks in a row.", { type: "weekly_distance_streak", meters: mi(20), weeks: 8 }),
      b("train-block-12", "Marathon Block", "12 wks", "Run 30+ miles a week for 12 weeks in a row.", { type: "weekly_distance_streak", meters: mi(30), weeks: 12 }),
      b("train-block-16", "Full Training Cycle", "16 wks", "Run 40+ miles a week for 16 weeks in a row.", { type: "weekly_distance_streak", meters: mi(40), weeks: 16 }),
    ],
  },

  // ── Consistency ────────────────────────────────────────────────
  {
    id: "streak", name: "Run Streak", category: "consistency", blurb: "Run every single day.",
    badges: [
      b("cons-streak-7", "Week Streak", "7d", "Run 7 days in a row.", { type: "streak_days", days: 7 }),
      b("cons-streak-30", "Month Streak", "30d", "Run 30 days in a row.", { type: "streak_days", days: 30 }),
      b("cons-streak-100", "Century Streak", "100d", "Run 100 days in a row.", { type: "streak_days", days: 100 }),
      b("cons-streak-365", "Year Streak", "365d", "Run every day for a year.", { type: "streak_days", days: 365 }),
    ],
  },
  {
    id: "weekly-rhythm", name: "Weekly Rhythm", category: "consistency", blurb: "Hit your runs per week, week after week.",
    badges: [
      b("cons-3x-4", "Getting Into It", "3×4", "Run 3+ times a week for 4 weeks in a row.", { type: "weekly_runs_streak", runs: 3, weeks: 4 }),
      b("cons-3x-12", "Habit Formed", "3×12", "Run 3+ times a week for 12 weeks in a row.", { type: "weekly_runs_streak", runs: 3, weeks: 12 }),
      b("cons-4x-12", "Four on the Floor", "4×12", "Run 4+ times a week for 12 weeks in a row.", { type: "weekly_runs_streak", runs: 4, weeks: 12 }),
      b("cons-5x-26", "Half-Year Grinder", "5×26", "Run 5+ times a week for 26 weeks in a row.", { type: "weekly_runs_streak", runs: 5, weeks: 26 }),
    ],
  },
  {
    id: "monthly-miles", name: "Monthly Mileage", category: "consistency", blurb: "Miles in a single calendar month.",
    badges: [
      b("cons-month-50", "50-Mile Month", "50/mo", "Run 50 miles in a calendar month.", { type: "month_distance", meters: mi(50) }),
      b("cons-month-100", "100-Mile Month", "100/mo", "Run 100 miles in a calendar month.", { type: "month_distance", meters: mi(100) }),
      b("cons-month-150", "150-Mile Month", "150/mo", "Run 150 miles in a calendar month.", { type: "month_distance", meters: mi(150) }),
      b("cons-month-200", "200-Mile Month", "200/mo", "Run 200 miles in a calendar month.", { type: "month_distance", meters: mi(200) }),
    ],
  },
  {
    id: "yearly-miles", name: "Yearly Mileage", category: "consistency", blurb: "Miles in a single calendar year.",
    badges: [
      b("cons-year-500", "500-Mile Year", "500/yr", "Run 500 miles in a calendar year.", { type: "year_distance", meters: mi(500) }),
      b("cons-year-1000", "1,000-Mile Year", "1K/yr", "Run 1,000 miles in a calendar year.", { type: "year_distance", meters: mi(1000) }),
      b("cons-year-2000", "2,000-Mile Year", "2K/yr", "Run 2,000 miles in a calendar year.", { type: "year_distance", meters: mi(2000) }),
    ],
  },
  {
    id: "total-runs", name: "Total Runs", category: "consistency", blurb: "Every run counts.",
    badges: [
      b("cons-runs-1", "First Run", "1", "Log your first run.", { type: "run_count", count: 1 }),
      b("cons-runs-100", "100 Runs", "100", "Log 100 runs.", { type: "run_count", count: 100 }),
      b("cons-runs-500", "500 Runs", "500", "Log 500 runs.", { type: "run_count", count: 500 }),
    ],
  },
];

export const badges = groups.flatMap((g) => g.badges);

export const badgeById = new Map(groups.flatMap((g) => g.badges.map((b) => [b.id, { badge: b, group: g }] as const)));
