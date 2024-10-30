import { isDevelopment } from "@/lib/environment"

export const siteConfig = {
  name: "DurHack Guilds",
  description:
    "DurHack Guilds allows you to collect points for your teams and win stash!",
  openGraphImage: "/opengraph-image.png",
  url: "https://guilds.durhack.com",
  themeColor: "#b3824b",
  sessionCookieName: "__Host-durhack-guilds-session",
}

if (isDevelopment) {
  Object.assign(siteConfig, {
    url: "http://guilds.durhack-dev.com",
    sessionCookieName: "durhack-guilds-session",
  })
}
