import { HttpStatus, ServerError } from "@otterhttp/errors"
import { getGuildsWithPointsAndMemberCount } from "@prisma/client/sql"
import { z } from "zod"

import { prisma } from "@server/database"
import type { Middleware, Request, Response } from "@server/types"

class GuildsHandlers {
  static numberParser = z.coerce.number().catch(0)

  getGuildsList(): Middleware {
    return async (req: Request, res: Response): Promise<void> => {
      const result = await prisma.$queryRawTyped(getGuildsWithPointsAndMemberCount())

      const mostMembers = Math.max(
        ...result.map((guild) => GuildsHandlers.numberParser.parse(guild.memberCount)),
      )

      const payload = result.map((guild) => {
        const naivePoints = GuildsHandlers.numberParser.parse(guild.points)
        const members = GuildsHandlers.numberParser.parse(guild.memberCount)
        const scaledPoints = Math.round(members > 0 ? (naivePoints * mostMembers) / members : 0)
        return {
          guild_name: guild.guildName,
          guild_description: guild.guildDescription,
          points: scaledPoints,
        }
      })

      res.json({
        status: 200,
        message: "OK",
        guilds: payload,
      })
    }
  }

  createGuild(): Middleware {
    return async (request: Request, response: Response): Promise<void> => {
      throw new ServerError("", { statusCode: HttpStatus.NotImplemented, expected: true })
    }
  }

  getGuildDetails(): Middleware {
    return async (request: Request, response: Response): Promise<void> => {
      throw new ServerError("", { statusCode: HttpStatus.NotImplemented, expected: true })
    }
  }

  patchGuildDetails(): Middleware {
    return async (request: Request, response: Response): Promise<void> => {
      throw new ServerError("", { statusCode: HttpStatus.NotImplemented, expected: true })
    }
  }

  deleteGuild(): Middleware {
    return async (request: Request, response: Response): Promise<void> => {
      throw new ServerError("", { statusCode: HttpStatus.NotImplemented, expected: true })
    }
  }
}

const guildsHandlers = new GuildsHandlers()
export { guildsHandlers }
