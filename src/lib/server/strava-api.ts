import "server-only";

export class RateLimitError extends Error {}
export class StravaAuthError extends Error {}
class HttpError extends Error {
  constructor(readonly status: number) {
    super(`Strava API ${status}`);
  }
}

export type SummaryActivity = {
  id: number;
  name?: string;
  sport_type?: string;
  type?: string;
  start_date: string;
  start_date_local: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
};

async function get<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`https://www.strava.com/api/v3${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (res.status === 429) throw new RateLimitError();
  if (res.status === 401) throw new StravaAuthError();
  if (!res.ok) throw new HttpError(res.status);
  return (await res.json()) as T;
}

// One page (max 200) of the athlete's activities, newest first. `after` is a unix timestamp.
export const listActivities = (accessToken: string, page: number, after?: number) =>
  get<SummaryActivity[]>(
    `/athlete/activities?per_page=200&page=${page}${after ? `&after=${after}` : ""}`,
    accessToken,
  );

// Best efforts (fastest 1 mile / 5k / 10k / ... inside the run) only come from the detail endpoint.
export async function getBestEfforts(accessToken: string, activityId: number) {
  try {
    const detail = await get<{ best_efforts?: { name: string; elapsed_time: number }[] }>(
      `/activities/${activityId}`,
      accessToken,
    );
    return (detail.best_efforts ?? []).map((e) => ({ name: e.name, elapsedTime: e.elapsed_time }));
  } catch (err) {
    // Deleted or inaccessible activity: record "no efforts" so we don't retry it forever.
    if (err instanceof HttpError && (err.status === 403 || err.status === 404)) return [];
    throw err;
  }
}
