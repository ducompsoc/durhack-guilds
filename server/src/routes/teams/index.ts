import { App } from "@otterhttp/app"

import { handleFailedAuthentication, methodNotAllowed, parseRouteId } from "@server/common/middleware"
import type { Request, Response } from "@server/types"

import { teamsHandlers } from "./teams-handlers"

export const teamsApp = new App<Request, Response>()

teamsApp
  .route("/")
  .get(teamsHandlers.listTeamsAsAdmin(), teamsHandlers.listTeamsAsAnonymous())
  .post(teamsHandlers.createTeamAsAdmin(), teamsHandlers.createTeamAsHacker(), handleFailedAuthentication)

teamsApp
  .route("/generate-name")
  .all(methodNotAllowed(["GET"]))
  .get(teamsHandlers.generateTeamName())

teamsApp
  .route("/:team_id/memberships")
  .all(methodNotAllowed(["POST", "DELETE"]))
  .all(parseRouteId("team_id"))
  .post(teamsHandlers.addUserToTeamAsAdmin(), handleFailedAuthentication)
  .delete(teamsHandlers.removeUserFromTeamAsAdmin(), handleFailedAuthentication)

teamsApp
  .route("/:team_id")
  .all(parseRouteId("team_id"))
  .all(methodNotAllowed(["GET", "PATCH", "DELETE"]))
  .get(teamsHandlers.getTeamDetails())
  .patch(teamsHandlers.patchTeamAsAdmin(), handleFailedAuthentication)
  .delete(teamsHandlers.deleteTeam())
