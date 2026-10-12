// Placeholder category list for the skeleton UI. Real badge data will come from the API.
export const categories = [
  { name: "Speed", blurb: "Fast times at standard distances.", examples: ["7:00 mile", "Sub-25 5K", "Sub-50 10K"] },
  { name: "Distance", blurb: "Go long, one run at a time.", examples: ["10K", "Half marathon", "Marathon"] },
  { name: "Consistency", blurb: "Show up week after week.", examples: ["30-day streak", "100 miles in a month"] },
  { name: "Terrain", blurb: "Climbs and trails.", examples: ["1,000 ft gain", "Trail ultra"] },
] as const;

export const tiers = ["Bronze", "Silver", "Gold", "Platinum"] as const;
