import { ClientError } from "@otterhttp/errors"

import { prisma } from "@server/database"
import type { Middleware, Request, Response } from "@server/types"

class InteropHandlers {
  /**
   * Handles a GET request to /quests.
   * Returns the quest's basic details including points, etc.
   */
  getQuestList(): Middleware {
    return async (_request: Request, response: Response): Promise<void> => {
      const result = await prisma.quest.findMany()

      const payload = result.map((quest) => ({
        id: quest.questId,
        name: quest.name,
        description: quest.description,
        dependency_mode: quest.dependencyMode,
        value: quest.points
      }))

      response.status(200)
      response.json({
        status: 200,
        message: "OK",
        quests: payload,
      })
    }
  }

  /**
   * Handles a GET request to /profile/:id.
   * Returns the user's basic details including points, etc.
   */
  getUserDetails(): Middleware {
    return async (request: Request, response: Response): Promise<void> => {
      const result = await prisma.user.findUnique({
        where: { keycloakUserId: request.params.user_id },
        select: {
          keycloakUserId: true,
          points: true,
        },
      })

      if (result == null) throw new ClientError()

      const questResult = await prisma.quest.findMany({
        include: {
          challenges: {
            include: {
              qrCodes: {
                include: {
                  redeems: { where: { redeemerUserId: result.keycloakUserId } },
                },
              },
            },
          },
        },
        where: { usersCompleted: { some: { keycloakUserId: result.keycloakUserId } } }
      });

      const questPayload = questResult.map((quest) => ({
        name: quest.name,
        description: quest.description,
        dependency_mode: quest.dependencyMode,
        value: quest.points,
        challenges: quest.challenges.map(challenge => ({
          name: challenge.name,
          description: challenge.description,
          value: challenge.points,
          completed: challenge.qrCodes.reduce((count, code) => count + code.redeems.length, 0) > 0
        }))
      }))

      const payload = {
        id: result?.keycloakUserId,
        points: prisma.point.sumPoints(result?.points ?? []),
        completedQuests: questPayload
      }

      response.status(200)
      response.json({
        status: response.statusCode,
        message: "OK",
        data: payload,
      })
    }
  }
}

const interopHandlers = new InteropHandlers()
export { interopHandlers }
