import { TokenType } from "@durhack/token-vault/lib"

import type { ConfigIn } from "@server/config/schema"

export default {
  listen: {
    host: "localhost",
    port: 3101, // Guilds project has ports 3100-3199
  },
  origin: "http://guilds.durhack-dev.com",
  flags: {},
  csrf: {
    enabled: true,
    secret: "csrfisoverrated",
    options: {
      cookieOptions: {
        name: "durhack-guilds.x-csrf-token",
        sameSite: "strict",
        path: "/",
        secure: false,
      },
    },
  },
  cookieSigning: {
    secret: "thebestsecretforcookies",
  },
  session: {
    cookie: {
      name: "durhack-guilds-session",
      sameSite: "lax",
      path: "/",
      secure: false,
    },
  },
  guilds: {
    maxTeamMembers: 4,
  },
  discord: {
    apiEndpoint: "https://discord.com/api/v10",
    clientId: "yourDiscordAppClientIdHere",
    clientSecret: "yourDiscordAppClientSecretHere",
    redirectUri: "http://guilds.durhack-dev.com/api/discord/redirect",
    botToken: "yourDiscordBotTokenHere",
    guildID: "yourDiscordGuildIDHere",
    teamsParentChannel: "yourTeamsParentChannelIdHere",
  },
  jsonwebtoken: {
    accessTokenLifetime: 1800,
    refreshTokenLifetime: 1209600,
    issuer: "http://guilds.durhack-dev.com",
    audience: "http://guilds.durhack-dev.com",
    authorities: [
      {
        for: TokenType.accessToken,
        algorithm: "hsa",
        secret: "totally-a-secure-SECRET",
      },
    ],
  },
  keycloak: {
    realm: "durhack-dev",
    baseUrl: "https://auth.durhack.com",
    adminBaseUrl: "https://admin.auth.durhack.com",
    clientId: "not-a-real-client-id",
    clientSecret: "not-a-real-client-secret",
    responseTypes: ["code"],
    redirectUris: ["http://guilds.durhack-dev.com/api/auth/keycloak/callback"],
  },
} satisfies ConfigIn
