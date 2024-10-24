import { Request, Response } from "express"
import createHttpError from "http-errors"
import config from "config"
import { z } from "zod"

import User from "@server/database/tables/user"

class DiscordHandlers {
  async getDiscord(request: Request, response: Response) {
    const user = request.user as User

    const team = await user.$get("team")

    if (!team) {
      throw new createHttpError.NotFound("You are not in a team!")
    }

    response.redirect(
      `https://discord.com/oauth2/authorize?client_id=${config.get(
        "discord.clientId",
      )}&redirect_uri=${encodeURIComponent(
        config.get("discord.redirectUri"),
      )}&response_type=code&scope=identify%20guilds.join&state=dh`,
    )
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

  async handleRedirect(request: Request, response: Response) {
    const user = request.user as User

    const team = await user.$get("team")

    if (!team) {
      throw new createHttpError.NotFound("You are not in a team!")
    }

    const { code, state } = DiscordHandlers.discord_access_code_schema.parse(request.query)

    //todo: verify that `state` matches what was assigned on flow begin

    const discordApiBase = config.get("discord.apiEndpoint")

    const access_code_exchange_payload = {
      client_id: config.get("discord.clientId") as string,
      client_secret: config.get("discord.clientSecret") as string,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: config.get("discord.redirectUri") as string,
    }
    const encoded_access_code_exchange_payload = new URLSearchParams(access_code_exchange_payload)

    const discord_access_token_response = await fetch(`${discordApiBase}/oauth2/token`, {
      method: "POST",
      body: encoded_access_code_exchange_payload,
    })

    if (!discord_access_token_response.ok) {
      throw new createHttpError.BadGateway("Couldn't exchange access code for access token.")
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
      throw new createHttpError.BadGateway("Failed to read your Discord profile.")
    }

    const discord_profile = (await discord_profile_response.json()) as any
    const discord_user_id = discord_profile.user.id
    const guildID = config.get("discord.guildID")

    await fetch(`${discordApiBase}/guilds/${guildID}/members/${discord_user_id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bot ${config.get("discord.botToken")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        access_token,
      }),
    })

    if (!team.discord_channel_id) {
      const newChannelRes = await fetch(`${discordApiBase}/guilds/${guildID}/channels`, {
        method: "POST",
        headers: {
          Authorization: `Bot ${config.get("discord.botToken")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: team.name,
          type: "0",
          parent_id: config.get("discord.teamsParentChannel"),
        }),
      })
      const newChannel = await newChannelRes.json()
      team.discord_channel_id = newChannel.id
      await team.save()
    }

    await fetch(`${discordApiBase}/channels/${team.discord_channel_id}/permissions/${discord_user_id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bot ${config.get("discord.botToken")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "1",
        allow: "3072",
      }),
    })

    response.redirect(`https://discord.com/channels/${guildID}/${team.discord_channel_id}`)
  }
}

const handlersInstance = new DiscordHandlers()
export default handlersInstance
