import { App } from "@otterhttp/app"
import { ClientError, HttpStatus } from "@otterhttp/errors"

import { methodNotAllowed } from "@server/common/middleware"
import type { Request, Response } from "@server/types"

import { userHandlers } from "./user-handlers"

export const userApp = new App<Request, Response>()

userApp.use((request: Request, response: Response, next: () => void) => {
  if (!request.user) {
    throw new ClientError("", { statusCode: HttpStatus.Unauthorized })
  }

  next()
})

userApp
  .route("/")
  .all(methodNotAllowed(["GET", "PATCH"]))
  .get(userHandlers.getUser())
  .patch(userHandlers.patchUserDetails())

userApp
  .route("/team")
  .all(methodNotAllowed(["GET", "POST", "DELETE"]))
  .get(userHandlers.getTeam())
  .post(userHandlers.joinTeam())
  .delete(userHandlers.leaveTeam())
