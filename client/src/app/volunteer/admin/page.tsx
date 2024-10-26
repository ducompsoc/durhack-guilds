"use client";

import dynamic from "next/dynamic";
import { redirect } from "next/navigation";

import { isAdmin } from "@/lib/is-role";
import { useMegateamsContext } from "@/hooks/use-megateams-context";

const Admin = dynamic(
  () => import("./admin-page").then(mod => mod.AdminPage),
  { ssr: false }
);

export default function AdminPage() {
  const { user, userIsLoading } = useMegateamsContext();

  if (userIsLoading) return <></>;
  if (user == null) return redirect("/")
  if (!isAdmin(user)) return redirect("/volunteer");

  return <Admin />;
}
