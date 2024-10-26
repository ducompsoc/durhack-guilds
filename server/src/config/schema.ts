import { tokenVaultOptionsSchema } from "@durhack/token-vault/config-schema"
import { z } from "zod"

export const listenOptionsSchema = z.object({
  host: z.string(),
  port: z.number().int().positive(),
})

export const cookie_options_schema = z.object({
  sameSite: z.union([z.literal("none"), z.literal("lax"), z.literal("strict")]).optional(),
  path: z.string().optional(),
  secure: z.boolean(),
  domain: z.string().optional(),
})

export const doubleCsrfOptionsSchema = z.object({
  cookieOptions: cookie_options_schema.extend({
    name: z.string(),
  }),
})

export const cookieSigningOptionsSchema = z.object({
  secret: z.string(),
})

export const sessionOptionsSchema = z.object({
  cookie: cookie_options_schema.extend({
    name: z.string(),
  }),
})

export const qrPresetSchema = z.object({
  name: z.string(),
  description: z.string(),
  points: z.number().nonnegative(),
  uses: z.number().nonnegative(),
  minutesValid: z.number().nonnegative(),
})

export const keycloakOptionsSchema = z.object({
  realm: z.string(),
  baseUrl: z.string().url(),
  adminBaseUrl: z.string().url(),
  clientId: z.string(),
  clientSecret: z.string(),
  redirectUris: z.array(z.string()),
  responseTypes: z.array(z.union([z.literal("code"), z.literal("token"), z.literal("id_token"), z.literal("none")])),
})

export const discordOptionsSchema = z.object({
  apiEndpoint: z.string().url(),
  clientId: z.string(),
  clientSecret: z.string(),
  redirectUri: z.string().url(),
  botToken: z.string(),
  guildID: z.string(),
  inviteLink: z.string(),
  teamsParentChannel: z.string(),
})

export const configSchema = z.object({
  listen: listenOptionsSchema,
  origin: z.string().url(),
  flags: z.object({}),
  csrf: z.object({
    enabled: z.boolean(),
    secret: z.string(),
    options: doubleCsrfOptionsSchema,
  }),
  cookieSigning: cookieSigningOptionsSchema,
  jsonwebtoken: tokenVaultOptionsSchema,
  session: sessionOptionsSchema,
  megateams: z.object({
    maxTeamMembers: z.number().positive(),
    QRPresets: z.object({}).catchall(qrPresetSchema),
  }),
  discord: discordOptionsSchema,
  keycloak: keycloakOptionsSchema,
})

export type Config = z.infer<typeof configSchema>
export type ConfigIn = z.input<typeof configSchema>
