import type { DeepPartial } from "@server/types/deep-partial"
import type { ConfigIn } from "./schema"

export default {
  origin: "https://guilds.durhack.com",
  csrf: {
    options: {
      cookieOptions: {
        name: "__Host-durhack-guilds.x-csrf-token",
        domain: undefined,
        path: "/",
        secure: true,
        sameSite: "strict",
      },
    },
  },
  session: {
    cookie: {
      name: "__Host-durhack-guilds-session",
      domain: undefined,
      path: "/",
      secure: true,
      sameSite: "lax",
    },
  },
  discord: {
    redirectUri: "https://guilds.durhack.com/api/discord/redirect",
  },
  jsonwebtoken: {
    issuer: "https://guilds.durhack.com",
    audience: "https://guilds.durhack.com",
  },
  keycloak: {
    realm: "durhack",
    redirectUris: ["https://guilds.durhack.com/api/auth/keycloak/redirect"],
  }
} satisfies DeepPartial<ConfigIn>
