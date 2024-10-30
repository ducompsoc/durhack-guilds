"use client";

import * as React from "react"
import {
  ChartBarIcon,
  NewspaperIcon,
  QrCodeIcon,
  ScaleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { redirect } from "next/navigation";

import { TabbedPage } from "@/components/tabbed-page";
import { isAdmin as getIsAdmin, isVolunteer as getIsVolunteer } from "@/lib/is-role";
import { useGuildsContext } from "@/hooks/use-guilds-context";

export default function VolunteerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userIsLoading } = useGuildsContext();
  if (userIsLoading) return <></>;
  if (user == null) return redirect("/")

  const isAdmin = getIsAdmin(user)
  const isVolunteer = isAdmin || getIsVolunteer(user)
  if (!isAdmin && !isVolunteer) return redirect("/");

  function getVolunteerTabs() {
    if (!isVolunteer) return []
    return [
      {
        icon: UserGroupIcon,
        path: "/volunteer/teams",
      }
    ]
  }

  function getAdminTabs() {
    if (!isAdmin) return []
    return [
      {
        icon: NewspaperIcon,
        path: "/volunteer/quests",
      },
      {
        icon: ScaleIcon,
        path: "/volunteer/admin",
      }
    ]
  }

  const tabs = [
    { icon: QrCodeIcon, path: "/volunteer" },
    {
      icon: ChartBarIcon,
      path: "/volunteer/leaderboard",
    },
    ...getVolunteerTabs(),
    ...getAdminTabs(),
  ];

  return <TabbedPage tabs={tabs}>{children}</TabbedPage>;
}
