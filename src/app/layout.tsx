import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import AuthButton from "@/components/AuthButton";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Running Achievements",
  description: "Earn badges for your biggest running milestones, powered by Strava.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-foreground/10">
          <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-3">
            <Link href="/" className="font-semibold tracking-tight hover:opacity-80">
              🏅 Running Achievements
            </Link>
            <AuthButton />
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-foreground/10 py-6 text-center text-sm text-foreground/50">
          <div className="flex flex-col items-center gap-3">
            {/* Official "Powered by Strava" logo, unmodified (Strava brand guidelines §1.2).
                Black on the light theme, white on the dark theme. */}
            <picture>
              <source
                media="(prefers-color-scheme: dark)"
                srcSet="/strava/powered-by-strava-white.svg"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/strava/powered-by-strava-black.svg"
                alt="Powered by Strava"
                width={237}
                height={24}
              />
            </picture>
            <span>Not affiliated with or endorsed by Strava.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
