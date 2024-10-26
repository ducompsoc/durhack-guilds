import assert from "node:assert/strict"
import { ClientError, HttpStatus } from "@otterhttp/errors"
import { z } from "zod"

import { getKeycloakAdminClient } from "@server/auth/keycloak-client"
import { prisma } from "@server/database"
import { patchUserPayloadSchema } from "@server/routes/users/users-handlers"
import type { Middleware, Request, Response } from "@server/types"

class UserHandlers {
  getUser(): Middleware {
    return async (request, response) => {
      assert(request.user)
      assert(request.userProfile)

      const payload = {
        id: request.user.keycloakUserId,
        email: request.userProfile.email,
        preferred_name: request.userProfile.preferred_names ?? request.userProfile.first_names,
        roles: request.userProfile.groups,
        points: await prisma.user.getTotalPoints({
          where: { keycloakUserId: request.user.keycloakUserId },
        }),
      }

      response.status(200)
      response.json({ status: response.statusCode, message: "OK", data: payload })
    }
  }

  patchUserDetails(): Middleware {
    return async (request, response) => {
      assert(request.user)
      const parsed_payload = patchUserPayloadSchema.parse(request.body)

      await prisma.user.update({
        where: { keycloakUserId: request.user.keycloakUserId },
        data: parsed_payload,
      })

      response.status(200)
      response.json({ status: response.statusCode, message: "OK" })
    }
  }

  getTeam(): Middleware {
    return async (request, response) => {
      assert(request.user)
      assert(request.userProfile)

      const user = await prisma.user.findUnique({
        where: { keycloakUserId: request.user.keycloakUserId },
        include: {
          team: {
            include: {
              members: { include: { points: true } },
              area: { include: { guild: true } },
            },
          },
        },
      })

      const team = user?.team

      if (!team) {
        throw new ClientError("You are not in a team", { statusCode: HttpStatus.NotFound, expected: true })
      }

      const adminClient = await getKeycloakAdminClient()
      const teamMemberProfiles = await Promise.all(
        team.members.map((member) => adminClient.users.findOne({ id: member.keycloakUserId })),
      )

      const payload = {
        name: team.teamName,
        members:
          team.members.map((member, index) => {
            const memberProfile = teamMemberProfiles[index]
            const memberName =
              memberProfile?.attributes?.preferredNames?.[0] ?? memberProfile?.attributes?.firstNames?.[0];
            return {
              preferredNames: memberName,
              points: prisma.point.sumPoints(member.points),
            }
          }) || [],
        guild_name: team.area?.guild.guildName || null,
        join_code: team.joinCodeString,
      }

      response.json({
        status: 200,
        message: "OK",
        data: payload,
      })
    }
  }

  static joinTeamPayloadSchema = z.object({
    join_code: z
      .string()
      .length(4)
      .transform((val) => Number.parseInt(val, 16))
      .refine((val) => !Number.isNaN(val)),
  })

  joinTeam(): Middleware {
    return async (request: Request, response: Response) => {
      assert(request.user)

      const user = await prisma.user.findUnique({
        where: { keycloakUserId: request.user.keycloakUserId },
        include: { team: true },
      })
      assert(user)

      if (user.team) {
        throw new ClientError("You are already in a team", { statusCode: HttpStatus.Conflict, expected: true })
      }

      const { join_code } = UserHandlers.joinTeamPayloadSchema.parse(request.body)
      const team = await prisma.team.findUnique({
        where: { joinCode: join_code },
      })

      if (team == null) {
        throw new ClientError("Join code not found", { statusCode: HttpStatus.NotFound, expected: true })
      }

      if (!(await prisma.team.isJoinableTeam({ where: { teamId: team.teamId } }))) {
        throw new ClientError("Team cannot be joined", { statusCode: HttpStatus.Conflict, expected: true })
      }

      await prisma.user.update({
        where: { keycloakUserId: request.user.keycloakUserId },
        data: {
          team: {
            connect: { teamId: team.teamId },
          },
        },
      })

      response.json({
        status: 200,
        message: "OK",
      })
    }
  }

  leaveTeam(): Middleware {
    return async (request, response) => {
      assert(request.user)
      const user = await prisma.user.findUnique({
        where: { keycloakUserId: request.user.keycloakUserId },
        include: { team: true },
      })

      const team = user?.team

      if (team == null) {
        throw new ClientError("You are not in a team", { statusCode: HttpStatus.NotFound, expected: true })
      }

      await prisma.user.update({
        where: { keycloakUserId: request.user.keycloakUserId },
        data: { teamId: null },
      })

      response.json({
        status: 200,
        message: "OK",
      })
    }
  }
}

const userHandlers = new UserHandlers()
export { userHandlers }
