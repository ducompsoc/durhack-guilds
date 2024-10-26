import useSWR from "swr";

import { makeGuildsApiRequest } from "@/lib/api";

export type User = {
  id: string
  email: string
  preferred_name: string
  roles: string[]
  points: number
}

async function userFetcher(url: string): Promise<User | null> {
  const request = await makeGuildsApiRequest(url);
  const response = await fetch(request);

  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Couldn't fetch user!");

  return (await response.json()).data as User;
}

export function useUser() {
  return useSWR<User | null, unknown | undefined>("/user", userFetcher);
}
