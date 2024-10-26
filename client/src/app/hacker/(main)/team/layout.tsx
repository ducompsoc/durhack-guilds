"use client";

import * as React from "react"
import { redirect } from "next/navigation";

import { useMegateamsContext } from "@/hooks/use-megateams-context";

export default function HackerTeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { team, teamIsLoading } = useMegateamsContext();

  if (teamIsLoading) return <></>;
  if (team == null) return redirect("/hacker");
  return children;
}
