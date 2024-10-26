import { ClientError, HttpStatus } from "@otterhttp/errors"
import { z } from "zod"

import { getKeycloakAdminClient } from "@server/auth/keycloak-client"
import { requireUserIsAdmin } from "@server/common/decorators"
import { NullError } from "@server/common/errors"
import { prisma } from "@server/database"
import type { Middleware, Request, Response } from "@server/types"

const createPointPayloadSchema = z.object({
  value: z.number().positive(),
  originQrCodeId: z.number().positive().optional(),
  redeemerUserId: z.string().uuid(),
})

const patchPointPaylodSchema = z
  .object({
    value: z.number().positive().optional(),
    origin_qrcode_id: z.number().positive().optional(),
    redeemer_id: z.number().positive().optional(),
  })
  .strict()

class PointHandlers {
  /**
   * Handles an authenticated admin GET request to /points.
   * The response payload is a list of points with their values and redeemer's ID.
   */
  @requireUserIsAdmin()
  getPointsList(): Middleware {
    return async (request: Request, response: Response): Promise<void> => {
      const result = await prisma.point.findMany({
        select: {
          pointId: true,
          value: true,
          redeemerUser: {
            select: {
              keycloakUserId: true,
            },
          },
        },
      })

      response.status(200)
      response.json({
        status: 200,
        message: "OK",
        points: result,
      })
    }
  }

  /**
   * Handles an authenticated admin POST request to /points to manually add points to the database.
   */
  @requireUserIsAdmin() // Point creation via QR code (for non-admins) is handled by a separate endpoint
  createPoint(): Middleware {
    return async (request: Request, response: Response): Promise<void> => {
      const parsedPayload = createPointPayloadSchema.parse(request.body)

      if (parsedPayload.originQrCodeId) {
        throw new ClientError("You should not specify an origin QR (`origin_qrcode_id`) when manually adding points.", {
          statusCode: HttpStatus.UnprocessableEntity,
          expected: true,
        })
      }

      const new_instance = await prisma.point.create({
        data: parsedPayload,
      })

      response.status(200)
      response.json({ status: response.statusCode, message: "OK", data: new_instance })
    }
  }

  /**
   * Returns the details of a point entry in the database and linked QR code and user attributes.
   */
  @requireUserIsAdmin()
  getPointDetails(): Middleware {
    return async (_request: Request, response: Response): Promise<void> => {
      const { point_id } = response.locals
      if (typeof point_id !== "number") throw new Error("Parsed `point_id` not found.")

      const result = await prisma.point.findUnique({
        where: { pointId: point_id },
        include: {
          originQrCode: {
            select: {
              qrCodeId: true,
              name: true,
              category: true,
              startTime: true,
              expiryTime: true,
            },
          },
          redeemerUser: {
            select: {
              keycloakUserId: true,
              team: true,
            },
          },
        },
      })
      if (result == null) throw new NullError()

      const adminClient = await getKeycloakAdminClient()
      const userProfile = await adminClient.users.findOne({ id: result.redeemerUser.keycloakUserId })
      const payload = {
        ...result,
        redeemerUser: {
          ...result.redeemerUser,
          email: userProfile?.email,
          preferred_name: userProfile?.attributes?.preferredNames?.[0],
        },
      }

      response.status(200)
      response.json({ status: response.statusCode, message: "OK", data: payload })
    }
  }

  /**
   * Handles an authenticated admin PATCH request to /points/:point_id to manually edit points to the database.
   */
  @requireUserIsAdmin()
  patchPointDetails(): Middleware {
    return async (request: Request, response: Response): Promise<void> => {
      const { point_id } = response.locals
      if (typeof point_id !== "number") throw new Error("Parsed `point_id` not found.")

      const parsed_payload = patchPointPaylodSchema.parse(request.body)

      const point = await prisma.point.update({
        where: { pointId: point_id },
        data: parsed_payload,
      })

      response.status(200)
      response.json({ status: response.statusCode, message: "OK", data: point })
    }
  }

  /**
   * Handles an authenticated admin DELETE request to /points/:point_id to drop/delete a point record from the db.
   */
  @requireUserIsAdmin()
  deletePoint(): Middleware {
    return async (_request: Request, response: Response): Promise<void> => {
      const { point_id } = response.locals
      if (typeof point_id !== "number") throw new Error("Parsed `point_id` not found.")

      await prisma.point.delete({
        where: { pointId: point_id },
      })

      response.status(200)
      response.json({ status: response.statusCode, message: "OK" })
    }
  }
}

const pointsHandlers = new PointHandlers()
export { pointsHandlers }
