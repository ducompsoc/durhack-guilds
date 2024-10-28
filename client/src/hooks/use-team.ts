import useSWR from "swr";

import { makeGuildsApiRequest } from "@/lib/api";

type TeamMember = {
  preferredNames: string
  points: number
  id: string
}

export type Team = {
  name: string
  guild_name: string
  join_code: string
  members: TeamMember[]
}

async function teamFetcher(url: string): Promise<Team | null> {
  const request = await makeGuildsApiRequest(url);
  const response = await fetch(request);

  if (response.status === 401) return null
  if (response.status === 404) return null
  if (!response.ok) throw new Error("Couldn't fetch team!");

  const unpacked = await response.json()
  return unpacked.data as Team;
}

export function useTeam() {
  return useSWR<Team | null, unknown | undefined>("/user/team", teamFetcher);
}
