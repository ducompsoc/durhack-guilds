import { isDevelopment } from "@/lib/environment"

export const siteConfig = {
  name: "DurHack Guilds",
  description:
    "DurHack Guilds allows you to collect points for your teams and win stash!",
  openGraphImage: "/opengraph-image.png",
  url: "https://guilds.durhack.com",
  themeColor: "#65c7f0",
  sessionCookieName: "__Host-durhack-guilds-session",
}

if (isDevelopment) {
  Object.assign(siteConfig, {
    url: "http://guilds.durhack-dev.com",
    sessionCookieName: "durhack-guilds-session",
  })
}
