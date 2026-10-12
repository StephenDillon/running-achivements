import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name}`);
  return value;
}

// Read lazily so missing config fails the request, not the build.
export const env = {
  supabaseUrl: () => required("SUPABASE_URL"),
  supabaseServiceKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),
  dbSchema: () => required("DB_SCHEMA"),
  stravaClientId: () => required("NEXT_PUBLIC_STRAVA_CLIENT_ID"),
  stravaClientSecret: () => required("STRAVA_CLIENT_SECRET"),
  stravaRedirectUri: () => required("NEXT_PUBLIC_STRAVA_REDIRECT_URI"),
};
