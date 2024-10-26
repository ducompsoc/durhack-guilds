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
import { useMegateamsContext } from "@/hooks/use-megateams-context";

export default function VolunteerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userIsLoading } = useMegateamsContext();
  if (userIsLoading) return <></>;
  if (user == null) return redirect("/")

  const isAdmin = getIsAdmin(user)
  const isVolunteer = isAdmin || getIsVolunteer(user)
  if (!isAdmin && !isVolunteer) return redirect("/");

  const tabs = [
    { icon: QrCodeIcon, path: "/volunteer" },
    {
      icon: ChartBarIcon,
      path: "/volunteer/leaderboard",
    },
    ...(isVolunteer
      ? [
          {
            icon: UserGroupIcon,
            path: "/volunteer/teams",
          },
          ...(isAdmin
            ? [
                {
                  icon: NewspaperIcon,
                  path: "/volunteer/challenges",
                },
              ]
            : []),
          {
            icon: ScaleIcon,
            path: "/volunteer/admin",
          },
        ]
      : []),
  ];

  return <TabbedPage tabs={tabs}>{children}</TabbedPage>;
}
