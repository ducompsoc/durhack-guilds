import { HttpStatus, ServerError } from "@otterhttp/errors"

import { requireUserHasOne, requireUserIsAdmin } from "@server/common/decorators"
import { UserRole } from "@server/common/model-enums"
import { prisma } from "@server/database"
import type { Middleware, Request, Response } from "@server/types"

class AreaHandlers {
  @requireUserHasOne(UserRole.admin, UserRole.sponsor, UserRole.volunteer)
  getAreasList(): Middleware {
    return async (request: Request, response: Response): Promise<void> => {
      const result = await prisma.guild.findMany({
        include: { areas: true },
      })

      response.json({
        status: 200,
        message: "OK",
        guilds: result,
      })
    }
  }

  @requireUserIsAdmin()
  createArea(): Middleware {
    return async (request: Request, response: Response) => {
      throw new ServerError("", { statusCode: HttpStatus.NotImplemented, expected: true })
    }
  }

  @requireUserIsAdmin()
  getAreaDetails(): Middleware {
    return async (request: Request, response: Response) => {
      throw new ServerError("", { statusCode: HttpStatus.NotImplemented, expected: true })
    }
  }

  @requireUserIsAdmin()
  patchAreaDetails(): Middleware {
    return async (request: Request, response: Response) => {
      throw new ServerError("", { statusCode: HttpStatus.NotImplemented, expected: true })
    }
  }

  @requireUserIsAdmin()
  deleteArea(): Middleware {
    return async (request: Request, response: Response) => {
      throw new ServerError("", { statusCode: HttpStatus.NotImplemented, expected: true })
    }
  }
}

const areaHandlers = new AreaHandlers()
export { areaHandlers }
