import { PHASE_DEVELOPMENT_SERVER } from "next/constants"

export const siteConfig = {
  url: "https://megateams.durhack.com",
}

if (PHASE_DEVELOPMENT_SERVER) {
  Object.assign(siteConfig, {
    url: "http://megateams.durhack-dev.com",
  })
}
