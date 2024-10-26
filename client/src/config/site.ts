import { isDevelopment } from "@/lib/environment"

export const siteConfig = {
  name: "DurHack Guilds",
  description:
    "DurHack is an annual hackathon event hosted by Durham University Computing Society (compsoc.tech), which is a student society affiliated with Durham Students' Union.",
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
