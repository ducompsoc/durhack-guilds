import { Router as ExpressRouter } from "express"
import passport from "passport"

import { handleGetCsrfToken } from "@server/auth/csrf"
import { handleFailedAuthentication, handleMethodNotAllowed } from "@server/common/middleware"

import handlers from "./auth_handlers"
import rememberUserReferrerForRedirect from "./rememberUserReferrerForRedirect"

const auth_router = ExpressRouter()

auth_router
  .route("/login")
  .all(rememberUserReferrerForRedirect)
  .get(passport.authenticate("oauth2"))
  .all(handleMethodNotAllowed)

auth_router
  .route("/login/callback")
  .get(
    passport.authenticate("oauth2", {
      failureRedirect: "/",
      keepSessionInfo: true,
      session: true,
    }),
    handlers.handleLoginSuccess,
  )
  .all(handleMethodNotAllowed)

auth_router.route("/csrf-token").get(handleGetCsrfToken).all(handleMethodNotAllowed)

auth_router
  .route("/socket-token")
  .get(handlers.handleGetSocketToken, handleFailedAuthentication)
  .all(handleMethodNotAllowed)

auth_router.route("/logout").post(handlers.handleLogout).all(handleMethodNotAllowed)

export default auth_router
