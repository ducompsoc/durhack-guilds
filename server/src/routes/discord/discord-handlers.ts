import assert from "node:assert/strict"
import { ClientError, HttpStatus } from "@otterhttp/errors"
import { z } from "zod"

import { discordConfig } from "@server/config"
import { type User, prisma } from "@server/database"
import type { Middleware, Request, Response } from "@server/types"

class DiscordHandlers {
  getDiscord(): Middleware {
    return async (request: Request, response: Response) => {
      const user = request.user
      assert(user != null)
      assert(user.teamId != null)

      const team = await prisma.team.findUnique({
        where: { teamId: user.teamId },
      })

      if (!team) {
        throw new ClientError("You are not in a team", { statusCode: HttpStatus.NotFound, expected: true })
      }

      response.redirect(
        `https://discord.com/oauth2/authorize?client_id=${discordConfig.clientId}&redirect_uri=${encodeURIComponent(
          discordConfig.redirectUri,
        )}&response_type=code&scope=identify%20guilds.join&state=dh`,
      )
    }
  }

  // a discord access code provided via redirect query parameter is exchanged for an access token
  static discord_access_code_schema = z.object({
    code: z.string(),
    state: z.string(),
  })

  // a discord access token represents some privileged claims to access a discord user's info
  static discord_access_token_schema = z.object({
    access_token: z.string(),
    token_type: z.literal("Bearer"),
    expires_in: z.number(),
    refresh_token: z.string(),
    scope: z.string(),
  })

  handleRedirect(): Middleware {
    return async (request: Request, response: Response) => {
      const user = request.user as User

      assert(user != null)
      assert(user.teamId != null)

      let team = await prisma.team.findUnique({
        where: { teamId: user.teamId },
      })

      if (!team) {
        throw new ClientError("You are not in a team", { statusCode: HttpStatus.NotFound, expected: true })
      }

      const { code, state } = DiscordHandlers.discord_access_code_schema.parse(request.query)

      // todo: verify that `state` matches what was assigned on flow begin

      const discordApiBase = discordConfig.apiEndpoint

      const access_code_exchange_payload = {
        client_id: discordConfig.clientId,
        client_secret: discordConfig.clientSecret,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: discordConfig.redirectUri,
      }
      const encoded_access_code_exchange_payload = new URLSearchParams(access_code_exchange_payload)

      const discord_access_token_response = await fetch(`${discordApiBase}/oauth2/token`, {
        method: "POST",
        body: encoded_access_code_exchange_payload,
      })

      if (!discord_access_token_response.ok) {
        throw new ClientError("Couldn't exchange discord access code for discord access token", {
          statusCode: HttpStatus.BadGateway,
        })
      }

      const { access_token } = DiscordHandlers.discord_access_token_schema.parse(
        await discord_access_token_response.json(),
      )

      const discord_profile_response = await fetch(`${discordApiBase}/oauth2/@me`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })

      if (!discord_profile_response.ok) {
        throw new ClientError("Failed to read your Discord profile.", { statusCode: HttpStatus.BadGateway })
      }

      const discord_profile = (await discord_profile_response.json()) as { user: { id: string } }
      const discord_user_id = discord_profile.user.id
      const guildID = discordConfig.guildID

      await fetch(`${discordApiBase}/guilds/${guildID}/members/${discord_user_id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bot ${discordConfig.botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access_token,
        }),
      })

      if (!team.discordChannelId) {
        const newChannelRes = await fetch(`${discordApiBase}/guilds/${guildID}/channels`, {
          method: "POST",
          headers: {
            Authorization: `Bot ${discordConfig.botToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: team.teamName,
            type: "0",
            parent_id: discordConfig.teamsParentChannel,
          }),
        })
        const newChannel: { id: string } = await newChannelRes.json()
        team = await prisma.team.update({
          where: team,
          data: {
            discordChannelId: newChannel.id,
          },
        })
        assert(team.discordChannelId != null)
      }

      await fetch(`${discordApiBase}/channels/${team.discordChannelId}/permissions/${discord_user_id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bot ${discordConfig.botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "1",
          allow: "3072",
        }),
      })

      response.redirect(`https://discord.com/channels/${guildID}/${team.discordChannelId}`)
    }
  }
}

const discordHandlers = new DiscordHandlers()
export { discordHandlers }
