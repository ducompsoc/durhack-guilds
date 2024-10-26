"use client"

import * as React from "react"
import type { KeyedMutator } from "swr";

import { type User, useUser } from "@/hooks/use-user";
import { type Team, useTeam } from "@/hooks/use-team";

type MegateamContextProps = {
  user: User | null | undefined
  userError: unknown | undefined
  mutateUser: KeyedMutator<User | null>
  userIsLoading: boolean

  team: Team | null | undefined
  teamError: unknown | undefined
  mutateTeam: KeyedMutator<Team | null>
  teamIsLoading: boolean
}

export const MegateamsContextContext = React.createContext<MegateamContextProps | null>(null)

export function MegateamsContextProvider({ children }: { children?: React.ReactNode }) {
  const { data: user, error: userError, mutate: mutateUser, isLoading: userIsLoading } = useUser()
  const { data: team, error: teamError, mutate: mutateTeam, isLoading: teamIsLoading } = useTeam()

  return (
    <MegateamsContextContext.Provider
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
    </MegateamsContextContext.Provider>
  )
}
