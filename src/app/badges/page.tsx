import type { Metadata } from "next";
import BadgesView from "@/components/BadgesView";

export const metadata: Metadata = { title: "Badges · Running Achievements" };

export default function BadgesPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <BadgesView />
    </div>
  );
}
