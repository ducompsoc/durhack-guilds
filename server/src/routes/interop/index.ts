import { App } from "@otterhttp/app"

import { methodNotAllowed } from "@server/common/middleware"
import type { Request, Response } from "@server/types"

import { interopHandlers } from "./interop-handlers"

export const interopApp = new App<Request, Response>()

interopApp
  .route("/quests")
  .all(methodNotAllowed(["GET"]))
  .get(interopHandlers.getQuestList())

interopApp
  .route("/profile/:user_id")
  .all(methodNotAllowed(["GET"]))
  .get(interopHandlers.getUserDetails())
