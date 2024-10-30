"use client";

import dynamic from "next/dynamic";
import { redirect } from "next/navigation";

import { isAdmin } from "@/lib/is-role";
import { useGuildsContext } from "@/hooks/use-guilds-context";

const Admin = dynamic(
  () => import("./admin-page").then(mod => mod.AdminPage),
  { ssr: false }
);

export default function AdminPage() {
  const { user, userIsLoading } = useGuildsContext();

  if (userIsLoading) return <></>;
  if (user == null) return redirect("/")
  if (!isAdmin(user)) return redirect("/volunteer");

  return <Admin />;
}
