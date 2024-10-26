"use client"

import * as React from "react"
import type { KeyedMutator } from "swr";

import { type User, useUser } from "@/hooks/use-user";
import { type Team, useTeam } from "@/hooks/use-team";

type GuildContextProps = {
  user: User | null | undefined
  userError: unknown | undefined
  mutateUser: KeyedMutator<User | null>
  userIsLoading: boolean

  team: Team | null | undefined
  teamError: unknown | undefined
  mutateTeam: KeyedMutator<Team | null>
  teamIsLoading: boolean
}

export const GuildsContextContext = React.createContext<GuildContextProps | null>(null)

export function GuildsContextProvider({ children }: { children?: React.ReactNode }) {
  const { data: user, error: userError, mutate: mutateUser, isLoading: userIsLoading } = useUser()
  const { data: team, error: teamError, mutate: mutateTeam, isLoading: teamIsLoading } = useTeam()

  return (
    <GuildsContextContext.Provider
      value={{
        user,
        userError,
        mutateUser,
        userIsLoading,

        team,
        teamError,
        mutateTeam,
        teamIsLoading,
      }}
    >
      {children}
    </GuildsContextContext.Provider>
  )
}
