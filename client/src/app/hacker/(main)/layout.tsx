"use client";

import { redirect } from "next/navigation";

import { isHacker } from "@/lib/is-role";
import { useGuildsContext } from "@/hooks/use-guilds-context";

export default function HackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userIsLoading, teamIsLoading } = useGuildsContext();

  if (userIsLoading || teamIsLoading) return <></>;
  if (user == null || !isHacker(user)) return redirect("/");
  return children;
}
