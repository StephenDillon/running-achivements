import type { Metadata } from "next";
import ProfileView from "@/components/ProfileView";

export const metadata: Metadata = { title: "Profile · Running Achievements" };

export default function ProfilePage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <ProfileView />
    </div>
  );
}
