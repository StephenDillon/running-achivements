import { Suspense } from "react";
import BadgesView from "@/components/BadgesView";

const authErrors: Record<string, string> = {
  denied: "Strava sign-in was cancelled.",
  state: "Sign-in could not be verified. Please try again.",
  scope: "Please allow access to your activities so we can award badges.",
  server: "Something went wrong signing you in. Please try again.",
};

async function AuthError({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const { auth_error } = await searchParams;
  const message = typeof auth_error === "string" ? authErrors[auth_error] : undefined;
  if (!message) return null;
  return (
    <p role="alert" className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-600">
      {message}
    </p>
  );
}

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <Suspense>
        <AuthError searchParams={searchParams} />
      </Suspense>
      <BadgesView />
    </div>
  );
}
