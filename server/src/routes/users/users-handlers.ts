import { z } from "zod"
import createHttpError from "http-errors"
import { literal as SequelizeLiteral, Op, ValidationError as SequelizeValidationError } from "sequelize"

import type { Request, Response, Middleware } from "@server/types"
import { NullError, ValueError } from "@server/common/errors"
import { requireUserIsAdmin, requireSelf } from "@server/common/decorators"
import { UserRole } from "@server/common/model-enums"
import { buildQueryFromRequest, type SequelizeQueryTransformFactory } from "@server/database"
import User from "@server/database/tables/user"
import Team from "@server/database/tables/team"
import Point from "@server/database/tables/point"
import Megateam from "@server/database/tables/megateam"
import Area from "@server/database/tables/area"

const user_transform_factories = new Map<string, SequelizeQueryTransformFactory<User>>()
user_transform_factories.set("email", (value: string) => ({
  condition: {
    email: { [Op.like]: SequelizeLiteral("concat('%', :email, '%')") },
  },
  replacements: new Map([["email", value]]),
  orders: [["email", "ASC"]],
}))

user_transform_factories.set("checked_in", (checked_in: string) => {
  if (checked_in === "true") return { condition: { checked_in: true } }
  if (checked_in === "false") return { condition: { checked_in: false } }
  throw new createHttpError.BadRequest("Malformed query parameter value for 'checked_in'")
})

const user_attributes = User.getAttributes()
const allowed_create_fields = new Set(Object.keys(user_attributes))

const create_user_payload_schema = z.object({
  team_id: z.number().optional(),
  email: z.string().email(),
  role: z.nativeEnum(UserRole).optional(),
  full_name: z.string(),
  preferred_name: z.string(),
})

export const patch_user_payload_schema = create_user_payload_schema.partial()

class UsersHandlers {
  /**
   * Handles an unauthenticated or non-admin GET request to /users.
   * Returns a list of user IDs and preferred names that cannot be filtered.
   */
  getUsersListDefault(): Middleware { 
    return async (request: Request, response: Response): Promise<void> => {
      const result = await User.findAll({
        attributes: [["user_id", "id"], "preferred_name"],
      })
      response.status(200)
      response.json({
        status: 200,
        message: "OK",
        users: result,
      })
    }
  }

  /**
   * Handles an authenticated admin GET request to /users.
   * Returns a list of user IDs and preferred names that can be filtered by:
   *   checked_in.
   * and searched by
   *   email.
   * using URL search parameters.
   */
  @requireUserIsAdmin()
  getUsersListAsAdmin(): Middleware { 
    return async (request: Request, response: Response): Promise<void> => {
      const result = await User.findAll({
        attributes: [["user_id", "id"], "preferred_name", "email"],
        include: [
          {model: Point},
          {
            model: Team,
            include: [
              {
                model: Area,
                include: [Megateam],
              },
            ],
          },
        ],
      })

      const payload = result.map((user: User) => ({
        id: user.id,
        preferred_name: user.preferred_name,
        email: user.email,
        points: Point.getPointsTotal(user.points || []),
        team_name: user.team?.name,
        team_id: user.team?.id,
        megateam_name: user.team?.area?.megateam?.name,
      }))

      response.status(200)
      response.json({
        status: 200,
        message: "OK",
        users: payload,
      })
    }
  }

  /**
   * Handles an authenticated admin POST request to /users.
   * Creates an entirely new user. This should only be used in the case that someone completely failed
   * to fill in the signup form, and somehow turned up at DurHack nonetheless.
   *
   * Required fields:
   *   ...
   */
  @requireUserIsAdmin()
  createUserAsAdmin(): Middleware { 
    return async (request: Request, response: Response): Promise<void> => {
      const invalid_fields = Object.keys(request.body).filter(key => !allowed_create_fields.has(key))
      if (invalid_fields.length > 0) {
        throw new ValueError(`Invalid field name(s) provided: ${invalid_fields}`)
      }

      let new_instance: User
      try {
        new_instance = await User.create(request.body)
      } catch (error) {
        if (error instanceof SequelizeValidationError) {
          throw new createHttpError.BadRequest(error.message)
        }
        throw error
      }

      response.status(200)
      response.json({
        status: response.statusCode,
        message: "OK",
        data: new_instance,
      })
    }
  }

  /**
   * Handles an unauthenticated or non-admin GET request to /users/:id.
   * Returns the user's basic details including team affiliation, points, etc.
   */
  getUserDetailsDefault(): Middleware { 
    return async (request: Request, response: Response): Promise<void> => {
      const {user_id} = response.locals
      if (typeof user_id !== "number") throw new Error("Parsed `user_id` not found.")

      const result = await User.findByPk(user_id, {
        attributes: ["id", "preferred_name"],
        include: [Team, Point],
        rejectOnEmpty: new NullError(),
      })

      const payload: Omit<User, "points"> & { points: number } = result.toJSON()
      payload.points = Point.getPointsTotal(result.points)

      response.status(200)
      response.json({
        status: response.statusCode,
        message: "OK",
        data: payload,
      })
    }
  }

  private async doGetAllUserDetails(request: Request, response: Response): Promise<void> {
    const { user_id } = response.locals
    if (typeof user_id !== "number") throw new Error("Parsed `user_id` not found.")

    const result = await User.findByPk(user_id, {
      attributes: {
        exclude: ["hashed_password", "password_salt", "verify_code", "verify_sent_at"],
      },
      include: [Team, Point],
      rejectOnEmpty: new NullError(),
    })

    const payload: Omit<User, "points"> & { points: number } = result.toJSON()
    payload.points = Point.getPointsTotal(result.points)

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
      const { user_id } = response.locals
      if (typeof user_id !== "number") throw new Error("Parsed `user_id` not found.")

      const parsed_payload = payload_schema.parse(request.body)

      const found_user = await User.findByPk(user_id, {
        rejectOnEmpty: new NullError(),
      })

      try {
        await found_user.update(parsed_payload)
      } catch (error) {
        if (error instanceof SequelizeValidationError) {
          throw new createHttpError.BadRequest(error.message)
        }
        throw error
      }

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
      await UsersHandlers.getPatchHandler(patch_user_payload_schema)(request, response)
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
      const {user_id} = response.locals
      if (typeof user_id !== "number") throw new Error("Parsed `user_id` not found.")

      const result = await User.findByPk(user_id, {
        attributes: ["id"],
        rejectOnEmpty: new NullError(),
      })

      await result.destroy()

      response.status(200)
      response.json({status: response.statusCode, message: "OK"})
    }
  }
}

const usersHandlers = new UsersHandlers()
export { usersHandlers }