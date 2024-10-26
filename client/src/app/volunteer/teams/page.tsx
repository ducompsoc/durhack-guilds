"use client";

import dynamic from "next/dynamic";
import { redirect } from "next/navigation";

import { useGuildsContext } from "@/hooks/use-guilds-context";
import { isVolunteer } from "@/lib/is-role";

const TeamsPage = dynamic(
  () => import("./teams-page").then(mod => mod.TeamsPage),
  { ssr: false, }
);

export default function Teams() {
  const { user, userIsLoading } = useGuildsContext();
  if (userIsLoading) return <></>;
  if (user == null || !isVolunteer(user)) return redirect("/");

  return <TeamsPage />;
}
