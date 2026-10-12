import { Suspense } from "react";
import Link from "next/link";
import BadgeGroupCard from "@/components/BadgeGroupCard";
import { badges, groups } from "@/lib/badges";

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
    <p role="alert" className="mb-8 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-600">
      {message}
    </p>
  );
}

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-16">
      <Suspense>
        <AuthError searchParams={searchParams} />
      </Suspense>
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Turn your miles into milestones.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-foreground/70">
          Connect Strava and earn badges for the runs that matter — from your first fast mile to
          the full marathon.
        </p>
        <Link
          href="/badges"
          className="mt-8 inline-block rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          Browse all {badges.length} badges
        </Link>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-semibold">Ladders to climb</h2>
        <p className="mt-1 text-sm text-foreground/70">
          Every distance is a ladder: finish it, then break 40, 30, 25 minutes and beyond.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {["mile", "5k", "half", "marathon"].map((id) => (
            <BadgeGroupCard key={id} group={groups.find((g) => g.id === id)!} />
          ))}
        </div>
        <Link href="/badges" className="mt-4 inline-block text-sm underline">
          See all {groups.length} groups
        </Link>
      </section>
    </div>
  );
}
