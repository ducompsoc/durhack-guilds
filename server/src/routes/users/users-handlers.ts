import { z } from "zod"

import { getKeycloakAdminClient } from "@server/auth/keycloak-client"
import { requireSelf, requireUserIsAdmin } from "@server/common/decorators"
import { NullError } from "@server/common/errors"
import { prisma } from "@server/database"
import type { Middleware, Request, Response } from "@server/types"

export const patchUserPayloadSchema = z.object({
  teamId: z.number().int().optional(),
})

class UsersHandlers {
  static usersListDefaultQuerySchema = z.object({
    count: z.coerce.number().int().positive().default(10),
    first: z.coerce.number().int().nonnegative().optional(),
  })

  /**
   * Handles an unauthenticated or non-admin GET request to /users.
   * Returns a list of user IDs and preferred names that cannot be filtered.
   */
  getUsersListDefault(): Middleware {
    return async (request: Request, response: Response): Promise<void> => {
      const query = UsersHandlers.usersListDefaultQuerySchema.parse(request.query)
      const adminClient = await getKeycloakAdminClient()
      const [users, totalCount] = await Promise.all([
        adminClient.users.find({ first: query.first, max: query.count }),
        adminClient.users.count(),
      ])

      const payload = users.map((user) => ({
        id: user.id,
        preferred_name: user.attributes?.preferredNames?.[0],
      }))

      response.status(200)
      response.json({
        status: 200,
        message: "OK",
        first: query.first,
        count: payload.length,
        total_count: totalCount,
        data: payload,
      })
    }
  }

  static usersListAdminQuerySchema = UsersHandlers.usersListDefaultQuerySchema.extend({
    query: z.string().optional(),
  })

  /**
   * Handles an authenticated admin GET request to /users.
   * Returns a list of user IDs and preferred names.
   * using URL search parameters.
   */
  @requireUserIsAdmin()
  getUsersListAsAdmin(): Middleware {
    return async (request: Request, response: Response): Promise<void> => {
      const query = UsersHandlers.usersListAdminQuerySchema.parse(request.query)
      const adminClient = await getKeycloakAdminClient()
      const [users, totalCount] = await Promise.all([
        adminClient.users.find({ first: query.first, max: query.count, q: query.query }),
        adminClient.users.count({ q: query.query }),
      ])

      const databaseUsers = await Promise.all(
        users.map((user) =>
          prisma.user.findUnique({
            where: { keycloakUserId: user.id },
            select: {
              points: true,
              team: {
                include: {
                  area: {
                    include: { megateam: true },
                  },
                },
              },
            },
          }),
        ),
      )

      const payload = users.map((user, index) => {
        const databaseUser = databaseUsers[index]

        return {
          id: user.id,
          email: user.email,
          preferred_name: user.attributes?.preferredNames?.[0],
          points: prisma.point.sumPoints(databaseUser?.points ?? []),
          team_name: databaseUser?.team?.teamName ?? null,
          team_id: databaseUser?.team?.teamId ?? null,
          megateam_name: databaseUser?.team?.area?.megateam?.megateamName ?? null,
        }
      })

      response.status(200)
      response.json({
        status: 200,
        message: "OK",
        first: query.first,
        count: payload.length,
        total_count: totalCount,
        data: payload,
      })
    }
  }

  /**
   * Handles an unauthenticated or non-admin GET request to /users/:id.
   * Returns the user's basic details including team affiliation, points, etc.
   */
  getUserDetailsDefault(): Middleware {
    return async (request: Request, response: Response): Promise<void> => {
      const adminClient = await getKeycloakAdminClient()

      const userProfile = await adminClient.users.findOne({ id: request.params.user_id })
      if (userProfile?.id == null) throw new NullError()

      const databaseResult = await prisma.user.findUnique({
        where: { keycloakUserId: request.params.user_id },
        select: {
          keycloakUserId: true,
          team: true,
          points: true,
        },
      })

      const payload = {
        id: userProfile.id,
        preferred_name: userProfile.attributes?.preferredNames?.[0],
        team: databaseResult?.team ?? null,
        points: prisma.point.sumPoints(databaseResult?.points ?? []),
      }

      response.status(200)
      response.json({
        status: response.statusCode,
        message: "OK",
        data: payload,
      })
    }
  }

  private async doGetAllUserDetails(request: Request, response: Response): Promise<void> {
    const adminClient = await getKeycloakAdminClient()

    const userProfile = await adminClient.users.findOne({ id: request.params.user_id })
    if (userProfile?.id == null) throw new NullError()

    const groups = await adminClient.users.listGroups({ id: userProfile.id })

    const result = await prisma.user.findUnique({
      where: { keycloakUserId: request.params.user_id },
      select: {
        team: true,
        points: true,
      },
    })

    const payload = {
      id: userProfile.id,
      email: userProfile.email,
      preferred_name: userProfile.attributes?.preferredNames?.[0],
      roles: groups.map((group) => group.path),
      team: result?.team ?? null,
      points: prisma.point.sumPoints(result?.points ?? []),
    }

    response.status(200)
    response.json({
      status: response.statusCode,
      message: "OK",
      data: payload,
    })
  }

  /**
   * Handles an authenticated admin GET request to /users/:id.
   * Returns all the user's details, including Hackathons UK fields.
   */
  @requireUserIsAdmin()
  getUserDetailsAsAdmin(): Middleware {
    return async (request: Request, response: Response): Promise<void> => {
      await this.doGetAllUserDetails(request, response)
    }
  }

  /**
   * Handles an authenticated self GET request to /users/:id.
   * Returns all the user's details, including Hackathons UK fields.
   */
  @requireSelf()
  getMyUserDetails(): Middleware {
    return async (request: Request, response: Response): Promise<void> => {
      await this.doGetAllUserDetails(request, response)
    }
  }

  static getPatchHandler(payload_schema: z.Schema) {
    return async (request: Request, response: Response): Promise<void> => {
      const parsed_payload = payload_schema.parse(request.body)

      const found_user = await prisma.user.update({
        where: { keycloakUserId: request.params.user_id },
        data: parsed_payload,
      })

      response.status(200)
      response.json({ status: response.statusCode, message: "OK" })
    }
  }

  /**
   * Handles an authenticated admin POST request to /users/:id.
   * Allows editing of all fields excluding password.
   */
  @requireUserIsAdmin()
  patchUserDetailsAsAdmin(): Middleware {
    return async (request: Request, response: Response): Promise<void> => {
      await UsersHandlers.getPatchHandler(patchUserPayloadSchema)(request, response)
    }
  }

  /**
   * Handles an authenticated hacker self POST request to /users/:id.
   * Allows editing of all MLH fields, email, etc.
   */
  @requireSelf()
  patchMyUserDetails(): Middleware {
    return async (request: Request, response: Response, next: () => void): Promise<void> => {
      next()
    }
  }

  /**
   * Handles an authenticated admin DELETE request to /users/:id.
   * Deletes the resource.
   */
  @requireUserIsAdmin()
  deleteUserAsAdmin(): Middleware {
    return async (request: Request, response: Response): Promise<void> => {
      const result = await prisma.user.delete({
        where: { keycloakUserId: request.params.user_id },
      })

      response.status(200)
      response.json({ status: response.statusCode, message: "OK" })
    }
  }
}

const usersHandlers = new UsersHandlers()
export { usersHandlers }
