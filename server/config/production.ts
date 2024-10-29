import { TokenType } from "@durhack/token-vault/lib"

import type { DeepPartial } from "@server/types/deep-partial"
import type { ConfigIn } from "@server/config/schema"

export default {
  origin: "https://megateams.durhack.com",
  csrf: {
    options: {
      cookieOptions: {
        name: "__Host-durhack-megateams.x-csrf-token",
        path: "/",
        secure: true,
        sameSite: "strict",
      },
    },
  },
  session: {
    cookie: {
      name: "__Host-durhack-megateams-session",
      path: "/",
      secure: true,
      sameSite: "lax",
    },
  },
  discord: {
    redirectUri: "https://megateams.durhack.com/api/discord/redirect",
  },
  jsonwebtoken: {
    issuer: "https://megateams.durhack.com",
    audience: "https://megateams.durhack.com",
    authorities: [
      {
        for: TokenType.accessToken,
        algorithm: "eddsa",
        publicKeyFilePath: "keys/accessToken.pub",
        privateKeyFilePath: "keys/accessToken.key",
      }
    ],
  },
  keycloak: {
    realm: "durhack",
    redirectUris: ["https://megateams.durhack.com/api/auth/keycloak/redirect"],
  }
} satisfies DeepPartial<ConfigIn>
