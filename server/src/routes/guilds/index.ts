import { App } from "@otterhttp/app"

import { methodNotAllowed } from "@server/common/middleware"
import type { Request, Response } from "@server/types"

import { guildsHandlers } from "./guild-handlers"

export const guildsApp = new App<Request, Response>()

guildsApp
  .route("/")
  .all(methodNotAllowed(["GET", "POST"]))
  .get(guildsHandlers.getGuildsList())
  .post(guildsHandlers.createGuild())

guildsApp
  .route("/:guild_id")
  .all(methodNotAllowed(["GET", "PATCH", "DELETE"]))
  .get(guildsHandlers.getGuildDetails())
  .patch(guildsHandlers.patchGuildDetails())
  .delete(guildsHandlers.deleteGuild())
