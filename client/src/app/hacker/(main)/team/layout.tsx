"use client";

import * as React from "react"
import { redirect } from "next/navigation";

import { useGuildsContext } from "@/hooks/use-guilds-context";

export default function HackerTeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { team, teamIsLoading } = useGuildsContext();

  if (teamIsLoading) return <></>;
  if (team == null) return redirect("/hacker");
  return children;
}
