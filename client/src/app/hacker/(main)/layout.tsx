"use client";

import useSWR from "swr";
import { redirect } from "next/navigation";

import { fetchMegateamsApi } from "@/lib/api";
import { isHacker } from "@/lib/is-role";
import { useMegateamsContext } from "@/hooks/use-megateams-context";

export default function HackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userIsLoading } = useMegateamsContext();
  const { isLoading: teamIsLoading } = useSWR("", fetchMegateamsApi);

  if (userIsLoading || teamIsLoading) return <></>;
  if (user == null || !isHacker(user)) return redirect("/");
  return children;
}
