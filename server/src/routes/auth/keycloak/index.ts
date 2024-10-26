import { App } from "@otterhttp/app"

import { methodNotAllowed, rememberUserReferrerForRedirect } from "@server/common/middleware"
import { authHandlers } from "@server/routes/auth/auth-handlers"
import type { Request, Response } from "@server/types"

import { keycloakHandlers } from "./keycloak-handlers"

const keycloakApp = new App<Request, Response>()

keycloakApp
  .route("/login")
  .all(methodNotAllowed(["GET"]))
  .get(rememberUserReferrerForRedirect)
  .get(keycloakHandlers.beginOAuth2Flow())

keycloakApp
  .route("/callback")
  .all(methodNotAllowed(["GET"]))
  .get(keycloakHandlers.oauth2FlowCallback())
  .get(authHandlers.handleLoginSuccess())

export { keycloakApp }
