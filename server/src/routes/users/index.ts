import { App } from "@otterhttp/app"

import { handleFailedAuthentication, methodNotAllowed } from "@server/common/middleware"
import type { Request, Response } from "@server/types"

import { usersHandlers } from "./users-handlers"

export const usersApp = new App<Request, Response>()

usersApp
  .route("/")
  .all(methodNotAllowed(["GET"]))
  .get(usersHandlers.getUsersListAsAdmin(), usersHandlers.getUsersListDefault())

usersApp
  .route("/:user_id")
  .all(methodNotAllowed(["GET", "PATCH", "DELETE"]))
  .get(usersHandlers.getUserDetailsAsAdmin(), usersHandlers.getUserDetailsDefault())
  .patch(usersHandlers.patchUserDetailsAsAdmin(), usersHandlers.patchMyUserDetails(), handleFailedAuthentication)
  .delete(usersHandlers.deleteUserAsAdmin(), handleFailedAuthentication)
