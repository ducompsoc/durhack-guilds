import assert from "node:assert/strict"
import { getRandomValues } from "node:crypto"
import { ClientError, HttpStatus, ServerError } from "@otterhttp/errors"
import { Prisma } from "@prisma/client"
import { getTeamsWithEverything, getTeamsWithPoints } from "@prisma/client/sql"
import {
  type Config as UniqueNamesGeneratorConfig,
  adjectives,
  animals,
  uniqueNamesGenerator,
} from "unique-names-generator"
import { z } from "zod"

import { getSession } from "@server/auth/session"
import { decodeTeamJoinCode } from "@server/common/decode-team-join-code"
import { requireLoggedIn, requireUserIsAdmin } from "@server/common/decorators"
import { type Team, prisma } from "@server/database"
import type { Middleware, Request, Response } from "@server/types"

class TeamsHandlers {
  static join_code_schema = z
    .string()
    .length(4)
    .transform((val) => Number.parseInt(val, 16))
    .refine((val) => !Number.isNaN(val))

  static namesGeneratorConfig: UniqueNamesGeneratorConfig = {
    dictionaries: [adjectives, adjectives, animals],
    length: 3,
    separator: "",
    style: "capital",
  }

  generateTeamName(): Middleware {
    return async (request: Request, response: Response) => {
      const session = await getSession(request, response)

      if (session.generatedTeamName == null || Object.hasOwn(request.query, "refresh")) {
        session.generatedTeamName = uniqueNamesGenerator(TeamsHandlers.namesGeneratorConfig)
        await session.commit()
      }

      response.json({
        status: 200,
        message: "OK",
        name: session.generatedTeamName,
      })
    }
  }

  listTeamsAsAnonymous(): Middleware {
    return async (request: Request, response: Response) => {
      const result = await prisma.$queryRawTyped(getTeamsWithPoints())

      const payload = result.map((team) => ({
        name: team.teamName,
        points: Number.isNaN(team.points) ? 0 : Number(team.points),
      }))

      response.json({
        status: 200,
        message: "OK",
        teams: payload,
      })
    }
  }

  @requireUserIsAdmin()
  listTeamsAsAdmin(): Middleware {
    return async (request: Request, response: Response) => {
      const result = await prisma.$queryRawTyped(getTeamsWithEverything())

      const payload = result.map((team) => ({
        team_id: team.teamId,
        name: team.teamName,
        join_code: decodeTeamJoinCode(team.joinCode),
        points: Number.isNaN(team.points) ? 0 : Number(team.points),
        member_count: Number.isNaN(team.memberCount) ? 0 : Number(team.memberCount),
        area: {
          area_id: team.areaId,
          area_name: team.areaName,
          megateam: {
            megateam_id: team.megateamId,
            megateam_name: team.megateamName,
          },
        },
      }))

      response.json({
        status: 200,
        message: "OK",
        teams: payload,
      })
    }
  }

  static patchTeamPayloadSchema = z.object({
    area_code: z.number(),
  })

  @requireUserIsAdmin()
  patchTeamAsAdmin(): Middleware {
    return async (request: Request, response: Response) => {
      const { team_id } = response.locals
      if (typeof team_id !== "number") {
        throw new Error("Parsed `team_id` not found.")
      }
      const payload = TeamsHandlers.patchTeamPayloadSchema.parse(request.body)

      await prisma.team.update({
        where: { teamId: team_id },
        data: {
          areaId: payload.area_code,
        },
      })

      response.json({
        status: 200,
        message: "OK",
      })
    }
  }

  @requireUserIsAdmin()
  createTeamAsAdmin(): Middleware {
    return (request: Request, response: Response, next: () => void) => {
      next()
    }
  }

  @requireLoggedIn()
  createTeamAsHacker(): Middleware {
    return async (request: Request, response: Response) => {
      assert(request.user)

      if (request.user.teamId != null) {
        throw new ClientError("You are already in a team", {
          statusCode: HttpStatus.Conflict,
          expected: true,
        })
      }

      const session = await getSession(request, response)
      const generatedTeamName = session.generatedTeamName
      assert(generatedTeamName != null)

      const randomBuffer = new Uint16Array(1) // length 1, value 0-65535
      const randomValues = getRandomValues(randomBuffer) // Fill the buffer with random values
      let randomValue = randomValues[0]

      let createdTeam: Team | null = null
      let tryIndex = 0
      while (tryIndex < 10) {
        try {
          createdTeam = await prisma.team.create({
            data: {
              teamName: generatedTeamName,
              joinCode: randomValue,
              members: {
                connect: [request.user],
              },
            },
          })
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            tryIndex += 1
            randomValue += tryIndex ** 2
            randomValue %= 65535
            continue
          }
          throw error
        }
      }

      if (createdTeam == null) {
        throw new ClientError("Team creation failed because no available join-code was found. Try again.", {
          statusCode: HttpStatus.Conflict,
          expected: true,
        })
      }

      response.json({
        status: 200,
        message: "OK",
      })
    }
  }

  @requireUserIsAdmin()
  addUserToTeamAsAdmin(): Middleware {
    return (request: Request, response: Response) => {
      throw new ServerError("", { statusCode: HttpStatus.NotImplemented, expected: true })
    }
  }

  @requireUserIsAdmin()
  removeUserFromTeamAsAdmin(): Middleware {
    return (request: Request, response: Response) => {
      throw new ServerError("", { statusCode: HttpStatus.NotImplemented, expected: true })
    }
  }

  getTeamDetails(): Middleware {
    return (request: Request, response: Response) => {
      throw new ServerError("", { statusCode: HttpStatus.NotImplemented, expected: true })
    }
  }

  deleteTeam(): Middleware {
    return (request: Request, response: Response) => {
      throw new ServerError("", { statusCode: HttpStatus.NotImplemented, expected: true })
    }
  }
}

const teamsHandlers = new TeamsHandlers()
export { teamsHandlers }
