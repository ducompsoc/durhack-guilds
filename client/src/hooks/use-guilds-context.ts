import * as React from "react";

import { GuildsContextContext } from "@/components/guilds-context-provider";

export function useGuildsContext() {
  const context = React.useContext(GuildsContextContext)

  if (!context) {
    throw new Error("useGuildsContext must be used within a <GuildsContextProvider />")
  }

  return context
}
