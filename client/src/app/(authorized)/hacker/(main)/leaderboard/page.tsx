"use client";

import dynamic from "next/dynamic";

const Leaderboard = dynamic(
  () => import("@/components/leaderboard"),
  {
    ssr: false,
  }
);

export default function LeaderboardPage() {
  return <Leaderboard />;
}
