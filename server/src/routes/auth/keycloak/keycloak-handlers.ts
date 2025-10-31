import type { NextFunction, Request as OtterRequest } from "@otterhttp/app"
import { ClientError } from "@otterhttp/errors"
import { type Client, generators } from "openid-client"
import { z } from "zod/v4"

import { adaptTokenSetToDatabase } from "@server/auth/adapt-token-set"
import { keycloakClient } from "@server/auth/keycloak-client"
import { getSession, type GuildsSessionRecord } from "@server/auth/session"
import { origin } from "@server/config"
import { type User, prisma } from "@server/database"
import type { Middleware, Request, Response } from "@server/types"

function urlOriginIsTrusted(url: URL) {
  if (url.origin === origin) return true
}

const destinationUrlSchema = z
  .string()
  .transform((value, ctx) => {
    try {
      return new URL(value)
    } catch (_error) {
      ctx.issues.push({
        input: value,
        code: "invalid_format",
        format: "url",
        message: "Invalid url",
      })
      return z.NEVER
    }
  })
  .refine((value) => urlOriginIsTrusted(value), {
    error: (issue) => `Specified destination origin ${(issue.input as URL).origin} is not trusted`,
  })

export class KeycloakHandlers {
  client: Client

  constructor(client: Client) {
    this.client = client
  }

  /**
   * 'lazily' log out the user - don't call the keycloak logout endpoint.
   * Just remove the user ID from the user's session.
   *
   * It's important we do this before initiating the keycloak login flow because we downgrade the session cookie to
   * SameSite 'Lax' during the OAuth flow (not implemented yet -
   * requires https://github.com/OtterJS/otterhttp-session/issues/1).
   */
  private static lazyLogout(response: Response, session: GuildsSessionRecord): void {
    if (session.userId == null) return

    session.userId = undefined
    response.sessionDirty = true
  }

  private static getOrGenerateCodeVerifier(response: Response, session: GuildsSessionRecord): string {
    if (typeof session.keycloakOAuth2FlowCodeVerifier === "string") return session.keycloakOAuth2FlowCodeVerifier

    const codeVerifier = generators.codeVerifier()
    session.keycloakOAuth2FlowCodeVerifier = codeVerifier
    response.sessionDirty = true
    return codeVerifier
  }

  private static rememberDestination(request: Request, response: Response, session: GuildsSessionRecord): void {
    const destination = request.query.destination != null ? destinationUrlSchema.parse(request.query.destination) : null

    if (session.redirectTo == null && destination?.href == null) return
    if (session.redirectTo === destination?.href) return

    session.redirectTo = destination?.href
    response.sessionDirty = true
  }

  beginOAuth2Flow(): Middleware {
    return async (request: Request, response: Response) => {
      const session = await getSession(request, response)
      KeycloakHandlers.rememberDestination(request, response, session)

      KeycloakHandlers.lazyLogout(response, session)
      const codeVerifier = KeycloakHandlers.getOrGenerateCodeVerifier(response, session)
      if (response.sessionDirty) await session.commit()

      const codeChallenge = generators.codeChallenge(codeVerifier)

      const url = this.client.authorizationUrl({
        scope: "openid email profile roles",
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
      })

      await response.redirect(url)
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
