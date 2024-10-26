import { App } from "@otterhttp/app"
import { ClientError, HttpStatus } from "@otterhttp/errors"

import { methodNotAllowed } from "@server/common/middleware"
import type { Request, Response } from "@server/types"

import { discordHandlers } from "./discord-handlers"

export const discordApp = new App<Request, Response>()

discordApp.use((request: Request, response: Response, next: () => void) => {
  if (!request.user) {
    throw new ClientError("", { statusCode: HttpStatus.Unauthorized })
  }

  next()
})

discordApp
  .route("/")
  .all(methodNotAllowed(["GET"]))
  .get(discordHandlers.getDiscord())

discordApp
  .route("/redirect")
  .all(methodNotAllowed(["GET"]))
  .get(discordHandlers.handleRedirect())
