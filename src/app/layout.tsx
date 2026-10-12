import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
            <span className="font-semibold tracking-tight">🏅 Running Achievements</span>
            <button
              disabled
              className="rounded-full bg-foreground/10 px-4 py-1.5 text-sm text-foreground/50"
            >
              Connect Strava (soon)
            </button>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-foreground/10 py-6 text-center text-sm text-foreground/50">
          Not affiliated with Strava.
        </footer>
      </body>
    </html>
  );
}
