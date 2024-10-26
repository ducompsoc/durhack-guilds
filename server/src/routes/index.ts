import assert from "node:assert/strict"
import { App } from "@otterhttp/app"
import { ClientError, ServerError } from "@otterhttp/errors"
import { json } from "@otterhttp/parsec"
import type { UserinfoResponse } from "openid-client"

import { adaptTokenSetToClient, adaptTokenSetToDatabase } from "@server/auth/adapt-token-set"
import { doubleCsrfProtection } from "@server/auth/csrf"
import { keycloakClient } from "@server/auth/keycloak-client"
import type { KeycloakUserInfo } from "@server/auth/keycloak-client"
import { getSession } from "@server/auth/session"
import { isNetworkError } from "@server/common/is-network-error"
import { methodNotAllowed } from "@server/common/middleware"
import { csrfConfig } from "@server/config"
import { prisma } from "@server/database"
import type { Request, Response } from "@server/types"

import { areasApp } from "./areas"
import { authApp } from "./auth"
import { discordApp } from "./discord"
import { megateamsApp } from "./megateams"
import { pointsApp } from "./points"
import { qrCodesApp } from "./qr-codes"
import { teamsApp } from "./teams"
import { userApp } from "./user"
import { usersApp } from "./users"

export const apiApp = new App<Request, Response>()

apiApp.use(json())
apiApp.use(async (request, response, next) => {
  const session = await getSession(request, response)
  if (session.userId == null) return next()
  const user = await prisma.user.findUnique({
    where: { keycloakUserId: session.userId },
    include: { tokenSet: true },
  })

  if (user == null || user.tokenSet == null) {
    session.userId = undefined
    await session.commit()
    return next()
  }

  // if the token set has expired, we try to refresh it
  let tokenSet = adaptTokenSetToClient(user.tokenSet)
  if (tokenSet.expired() && tokenSet.refresh_token != null) {
    try {
      tokenSet = await keycloakClient.refresh(tokenSet.refresh_token)
      await prisma.tokenSet.update({
        where: { userId: user.keycloakUserId },
        data: adaptTokenSetToDatabase(tokenSet),
      })
    } catch (error) {
      if (isNetworkError(error)) {
        throw new ServerError("Encountered network error while attempting to refresh a token set", {
          statusCode: 500,
          exposeMessage: false,
          cause: error,
        })
      }
      assert(error instanceof Error)
      console.error(`Failed to refresh access token for ${tokenSet.claims().email}: ${error.stack}`)
    }
  }

  // if the token set is still expired, the user needs to log in again
  if (tokenSet.expired() || tokenSet.access_token == null) {
    session.userId = undefined
    await session.commit()
    return next()
  }

  // use the token set to get the user profile
  let profile: UserinfoResponse<KeycloakUserInfo> | undefined
  try {
    profile = await keycloakClient.userinfo<KeycloakUserInfo>(tokenSet.access_token)
  } catch (error) {
    if (isNetworkError(error)) {
      throw new ServerError("Encountered network error while attempting to fetch profile info", {
        statusCode: 500,
        exposeMessage: false,
        cause: error,
      })
    }

    assert(error instanceof Error)
    console.error(`Failed to fetch profile info for ${tokenSet.claims().email}: ${error.stack}`)

    // if the access token is rejected, the user needs to log in again
    session.userId = undefined
    await session.commit()
    return next()
  }

  request.userProfile = profile
  request.userTokenSet = tokenSet
  request.user = user
  next()
})

if (csrfConfig.enabled) {
  apiApp.use(doubleCsrfProtection)
}

function rootRequestHandler(request: Request, response: Response) {
  response.status(200)
  response.json({ status: response.statusCode, message: "OK", api_version: 1 })
}

function routeFallthroughHandler() {
  throw new ClientError("Unknown API route.", { statusCode: 404, expected: true })
}

apiApp
  .route("/")
  .all(methodNotAllowed(["GET"]))
  .get(rootRequestHandler)

apiApp.use("/auth", authApp)
apiApp.use("/areas", areasApp)
apiApp.use("/megateams", megateamsApp)
apiApp.use("/points", pointsApp)
apiApp.use("/qr_codes", qrCodesApp)
apiApp.use("/teams", teamsApp)
apiApp.use("/users", usersApp)
apiApp.use("/user", userApp)
apiApp.use("/discord", discordApp)

apiApp.use(routeFallthroughHandler)
