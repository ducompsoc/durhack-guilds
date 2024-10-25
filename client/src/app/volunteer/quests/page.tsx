"use client";

import { redirect } from "next/navigation";

import { isAdmin } from "@/lib/is-role";
import { useMegateamsContext } from "@/hooks/use-megateams-context";

export default function Challenges() {
  const { user, userIsLoading } = useMegateamsContext();

  if (userIsLoading) return <></>;
  if (!user) return redirect("/");
  if (!isAdmin(user)) return redirect("/volunteer");

  return (
    <div className="flex flex-col h-full">
      <p className="font-bold text-center mb-4">Quest/Challenge Admin</p>
    </div>
  );
}
