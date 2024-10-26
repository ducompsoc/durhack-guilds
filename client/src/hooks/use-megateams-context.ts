import * as React from "react";

import { MegateamsContextContext } from "@/components/megateams-context-provider";

export function useMegateamsContext() {
  const context = React.useContext(MegateamsContextContext)

  if (!context) {
    throw new Error("useMegateamsContext must be used within a <MegateamsContextProvider />")
  }

  return context
}
