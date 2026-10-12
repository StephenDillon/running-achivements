import { Suspense } from "react";
import { categories, tiers } from "@/lib/badges";

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
        <div className="mt-6 flex justify-center gap-2">
          {tiers.map((t) => (
            <span key={t} className="rounded-full border border-foreground/15 px-3 py-1 text-xs">
              {t}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-4 sm:grid-cols-2">
        {categories.map((c) => (
          <article key={c.name} className="rounded-2xl border border-foreground/10 p-6">
            <h2 className="text-xl font-semibold">{c.name}</h2>
            <p className="mt-1 text-sm text-foreground/70">{c.blurb}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {c.examples.map((e) => (
                <li key={e} className="rounded-md bg-foreground/5 px-2.5 py-1 text-xs">
                  {e}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
