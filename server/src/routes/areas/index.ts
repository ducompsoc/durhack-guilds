import { App } from "@otterhttp/app"

import { handleFailedAuthentication, methodNotAllowed, parseRouteId } from "@server/common/middleware"
import type { Request, Response } from "@server/types"

import { areaHandlers } from "./area-handlers"

export const areasApp = new App<Request, Response>()

areasApp
  .route("/")
  .all(methodNotAllowed(["GET", "POST"]))
  .get(areaHandlers.getAreasList(), handleFailedAuthentication)
  .post(areaHandlers.createArea(), handleFailedAuthentication)

areasApp
  .route("/:area_id")
  .all(methodNotAllowed(["GET", "PATCH", "DELETE"]))
  .all(parseRouteId("area_id"))
  .get(areaHandlers.getAreaDetails(), handleFailedAuthentication)
  .patch(areaHandlers.patchAreaDetails(), handleFailedAuthentication)
  .delete(areaHandlers.deleteArea(), handleFailedAuthentication)
