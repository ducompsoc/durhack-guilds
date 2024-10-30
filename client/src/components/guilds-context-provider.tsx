"use client"

import * as React from "react"
import type { KeyedMutator } from "swr";

import { type User, useUser } from "@/hooks/use-user";
import { type Team, useTeam } from "@/hooks/use-team";

type GuildContextProps = {
  user: User | null | undefined
  mutateUser: KeyedMutator<User | null>
  userIsLoading: boolean

  team: Team | null | undefined
  mutateTeam: KeyedMutator<Team | null>
  teamIsLoading: boolean
}

export const GuildsContextContext = React.createContext<GuildContextProps | null>(null)

export function GuildsContextProvider({ children }: { children?: React.ReactNode }) {
  const { data: user, error: userError, mutate: mutateUser, isLoading: userIsLoading } = useUser()
  const { data: team, error: teamError, mutate: mutateTeam, isLoading: teamIsLoading } = useTeam()

  // throw the error to the nearest error boundary (error.tsx in app directory)
  if (userError != null) throw userError
  if (teamError != null) throw teamError

  return (
    <GuildsContextContext.Provider
      value={{
        user,
        mutateUser,
        userIsLoading,

        team,
        mutateTeam,
        teamIsLoading,
      }}
    >
      {children}
    </GuildsContextContext.Provider>
  )
}
