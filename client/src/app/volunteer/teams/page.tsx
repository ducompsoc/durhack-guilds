"use client";

import dynamic from "next/dynamic";
import { redirect } from "next/navigation";

import { useMegateamsContext } from "@/hooks/use-megateams-context";
import { isVolunteer } from "@/lib/is-role";

const TeamsPage = dynamic(
  () => import("./teams-page").then(mod => mod.TeamsPage),
  { ssr: false, }
);

export default function Teams() {
  const { user, userIsLoading } = useMegateamsContext();
  if (userIsLoading) return <></>;
  if (user == null || !isVolunteer(user)) return redirect("/");

  return <TeamsPage />;
}
