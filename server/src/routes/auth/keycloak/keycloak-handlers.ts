import type { NextFunction, Request as OtterRequest } from "@otterhttp/app"
import { ClientError } from "@otterhttp/errors"
import { type Client, generators } from "openid-client"

import { adaptTokenSetToDatabase } from "@server/auth/adapt-token-set"
import { keycloakClient } from "@server/auth/keycloak-client"
import { getSession } from "@server/auth/session"
import { origin } from "@server/config"
import { type User, prisma } from "@server/database"
import type { Middleware, Request, Response } from "@server/types"

export class KeycloakHandlers {
  client: Client

  constructor(client: Client) {
    this.client = client
  }

  async getOrGenerateCodeVerifier(request: Request, response: Response): Promise<string> {
    const session = await getSession(request, response)
    if (typeof session.keycloakOAuth2FlowCodeVerifier === "string") return session.keycloakOAuth2FlowCodeVerifier

    const codeVerifier = generators.codeVerifier()
    session.keycloakOAuth2FlowCodeVerifier = codeVerifier
    await session.commit()
    return codeVerifier
  }

  beginOAuth2Flow(): Middleware {
    return async (request: Request, response: Response) => {
      const codeVerifier = await this.getOrGenerateCodeVerifier(request, response)
      const codeChallenge = generators.codeChallenge(codeVerifier)

      const url = this.client.authorizationUrl({
        scope: "openid email profile roles",
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
      })

      response.redirect(url)
    }
  }

  static redirectUri = new URL("/api/auth/keycloak/callback", origin).toString()

  oauth2FlowCallback(): Middleware {
    return async (request: OtterRequest & { user?: User }, response: Response, next: NextFunction) => {
      const session = await getSession(request, response)
      let codeVerifier: unknown
      try {
        codeVerifier = session.keycloakOAuth2FlowCodeVerifier
        if (typeof codeVerifier !== "string")
          throw new ClientError("Code verifier not initialized", {
            statusCode: 400,
            exposeMessage: false,
          })
      } finally {
        session.keycloakOAuth2FlowCodeVerifier = undefined
        await session.commit()
      }

      const params = this.client.callbackParams(request)
      const tokenSet = await this.client.callback(KeycloakHandlers.redirectUri, params, { code_verifier: codeVerifier })

      const userId = tokenSet.claims().sub
      const serializedTokenSet = adaptTokenSetToDatabase(tokenSet)

      const now = new Date()

      const user = await prisma.user.upsert({
        where: {
          keycloakUserId: userId,
        },
        create: {
          keycloakUserId: userId,
          initialLoginTime: now,
          lastLoginTime: now,
          tokenSet: {
            create: serializedTokenSet,
          },
        },
        update: {
          lastLoginTime: now,
          tokenSet: {
            upsert: {
              create: serializedTokenSet,
              update: serializedTokenSet,
            },
          },
        },
      })

      session.userId = userId
      await session.commit()
      request.user = user

      next()
    }
  }

  logout(): Middleware {
    return async (request: Request, response: Response) => {
      const session = await getSession(request, response)
      if (session.userId == null) {
        await response.redirect(origin)
        return
      }

      session.userId = undefined
      await session.commit()
      if (request.user?.tokenSet?.idToken) {
        const endSessionUrl = keycloakClient.endSessionUrl({
          id_token_hint: request.user?.tokenSet?.idToken,
          post_logout_redirect_uri: origin,
        })
        response.redirect(endSessionUrl)
        return
      }

      response.redirect(origin)
    }
  }
}

export const keycloakHandlers = new KeycloakHandlers(keycloakClient)
