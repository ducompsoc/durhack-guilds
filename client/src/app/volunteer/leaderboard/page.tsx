"use client";

import dynamic from "next/dynamic";

const Leaderboard = dynamic(
  () => import("@/components/leaderboard/leaderboard"),
  {
    ssr: false,
  }
);

export default function LeaderboardPage() {
  return <Leaderboard />;
}
