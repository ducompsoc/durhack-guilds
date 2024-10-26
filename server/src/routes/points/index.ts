import { App } from "@otterhttp/app"

import { handleFailedAuthentication, methodNotAllowed, parseRouteId } from "@server/common/middleware"
import type { Request, Response } from "@server/types"

import { pointsHandlers } from "./points-handlers"

export const pointsApp = new App<Request, Response>()

pointsApp
  .route("/")
  .all(methodNotAllowed(["GET", "POST"]))
  .get(pointsHandlers.getPointsList(), handleFailedAuthentication)
  .post(pointsHandlers.createPoint(), handleFailedAuthentication)

pointsApp
  .route("/:point_id")
  .all(methodNotAllowed(["GET", "PATCH", "DELETE"]))
  .all(parseRouteId("point_id"))
  .get(pointsHandlers.getPointDetails(), handleFailedAuthentication)
  .patch(pointsHandlers.patchPointDetails(), handleFailedAuthentication)
  .delete(pointsHandlers.deletePoint(), handleFailedAuthentication)
