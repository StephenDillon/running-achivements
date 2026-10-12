export type Me = {
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  stravaAthleteId: number;
  memberSince: string;
};

// Returns null when signed out. The API is the source of truth; this is display only.
export async function fetchMe(): Promise<Me | null> {
  try {
    const res = await fetch("/api/v1/me", { cache: "no-store" });
    return res.ok ? ((await res.json()) as Me) : null;
  } catch {
    return null;
  }
}

// Full page load so every component (header included) re-reads auth state.
export async function logout() {
  await fetch("/api/v1/auth/logout", { method: "POST" });
  window.location.href = "/";
}
