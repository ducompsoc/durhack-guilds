import { App } from "@otterhttp/app"

import { handleFailedAuthentication, methodNotAllowed, parseRouteId } from "@server/common/middleware"
import type { Request, Response } from "@server/types"

import { questsHandlers } from "./quests-handlers"

export const questsApp = new App<Request, Response>()

questsApp
  .route("/")
  .all(methodNotAllowed(["GET", "POST"]))
  .get(
    questsHandlers.getQuestListAdmin(),
    questsHandlers.getQuestListHacker(),
    handleFailedAuthentication,
  )
  .post(questsHandlers.createQuest(), handleFailedAuthentication)

questsApp
  .route("/:quest_id")
  .all(methodNotAllowed(["GET", "PATCH", "DELETE"]))
  .all(parseRouteId("quest_id"))
  .patch(questsHandlers.patchQuestDetails(), handleFailedAuthentication)
