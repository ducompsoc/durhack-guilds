"use client";

import * as React from "react";
import {
  ChartBarIcon,
  HomeIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

import { TabbedPage } from "@/components/tabbed-page";
import { useMegateamsContext } from "@/hooks/use-megateams-context";

export default function HackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { team, userIsLoading, teamIsLoading } = useMegateamsContext();

  if (userIsLoading || teamIsLoading) return <></>;
  const hasTeam = team !== null

  const tabs = [
    {
      icon: HomeIcon,
      path: "/hacker",
    },
    {
      icon: ChartBarIcon,
      path: "/hacker/leaderboard",
    },
    {
      icon: UserGroupIcon,
      path: "/hacker/team",
    },
  ];

  return (
    <TabbedPage tabs={tabs} showTabs={hasTeam}>
      {children}
    </TabbedPage>
  );
}
