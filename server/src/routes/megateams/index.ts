import { App } from "@otterhttp/app"

import { methodNotAllowed } from "@server/common/middleware"
import type { Request, Response } from "@server/types"

import { megateamsHandlers } from "./megateam-handlers"

export const megateamsApp = new App<Request, Response>()

megateamsApp
  .route("/")
  .all(methodNotAllowed(["GET", "POST"]))
  .get(megateamsHandlers.getMegateamsList())
  .post(megateamsHandlers.createMegateam())

megateamsApp
  .route("/:megateam_id")
  .all(methodNotAllowed(["GET", "PATCH", "DELETE"]))
  .get(megateamsHandlers.getMegateamDetails())
  .patch(megateamsHandlers.patchMegateamDetails())
  .delete(megateamsHandlers.deleteMegateam())
