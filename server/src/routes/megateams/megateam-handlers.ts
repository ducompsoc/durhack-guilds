import { HttpStatus, ServerError } from "@otterhttp/errors"
import { getMegateamsWithPointsAndMemberCount } from "@prisma/client/sql"
import { z } from "zod"

import { prisma } from "@server/database"
import type { Middleware, Request, Response } from "@server/types"

class MegateamsHandlers {
  static numberParser = z.coerce.number().catch(0)

  getMegateamsList(): Middleware {
    return async (req: Request, res: Response): Promise<void> => {
      const result = await prisma.$queryRawTyped(getMegateamsWithPointsAndMemberCount())

      const mostMembers = Math.max(
        ...result.map((megateam) => MegateamsHandlers.numberParser.parse(megateam.memberCount)),
      )

      const payload = result.map((megateam) => {
        const naivePoints = MegateamsHandlers.numberParser.parse(megateam.points)
        const members = MegateamsHandlers.numberParser.parse(megateam.memberCount)
        const scaledPoints = members > 0 ? (naivePoints * mostMembers) / members : 0
        return {
          megateam_name: megateam.megateamName,
          megateam_description: megateam.megateamDescription,
          points: scaledPoints,
        }
      })

      res.json({
        status: 200,
        message: "OK",
        megateams: payload,
      })
    }
  }

  createMegateam(): Middleware {
    return async (request: Request, response: Response): Promise<void> => {
      throw new ServerError("", { statusCode: HttpStatus.NotImplemented, expected: true })
    }
  }

  getMegateamDetails(): Middleware {
    return async (request: Request, response: Response): Promise<void> => {
      throw new ServerError("", { statusCode: HttpStatus.NotImplemented, expected: true })
    }
  }

  patchMegateamDetails(): Middleware {
    return async (request: Request, response: Response): Promise<void> => {
      throw new ServerError("", { statusCode: HttpStatus.NotImplemented, expected: true })
    }
  }

  deleteMegateam(): Middleware {
    return async (request: Request, response: Response): Promise<void> => {
      throw new ServerError("", { statusCode: HttpStatus.NotImplemented, expected: true })
    }
  }
}

const megateamsHandlers = new MegateamsHandlers()
export { megateamsHandlers }
