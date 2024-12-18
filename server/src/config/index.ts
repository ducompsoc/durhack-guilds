import path from "node:path"
import { loadConfig } from "zod-config"
import { directoryAdapter } from "zod-config/directory-adapter"

import { dirname } from "@server/dirname"

import { configSchema } from "./schema"
import { typescriptAdapter } from "./typescript-adapter";

export type * from "./schema"

const config = await loadConfig({
  schema: configSchema,
  adapters: directoryAdapter({
    paths: path.join(dirname, "..", "config"),
    adapters: [
      {
        extensions: [".ts", ".js"],
        adapterFactory: (filePath: string) => typescriptAdapter({ path: filePath }),
      },
    ],
  }),
})

export const {
  listen: listenConfig,
  flags: configFlags,
  csrf: csrfConfig,
  cookieSigning: cookieSigningConfig,
  jsonwebtoken: tokenVaultConfig,
  session: sessionConfig,
  discord: discordConfig,
  keycloak: keycloakConfig,
  origin,
  guilds: guildsConfig,
} = config

export { config }
