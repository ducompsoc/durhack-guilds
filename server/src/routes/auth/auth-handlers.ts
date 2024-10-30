import { TokenType } from "@durhack/token-vault/lib"

import { getSession } from "@server/auth/session"
import TokenVault from "@server/auth/tokens"
import { requireLoggedIn } from "@server/common/decorators"
import { UserRole } from "@server/common/model-enums"
import type { Middleware, Request, Response } from "@server/types"

class AuthHandlers {
  handleLoginSuccess(): Middleware {
    return async (request: Request, response: Response): Promise<void> => {
      const session = await getSession(request, response)
      if (session.redirectTo != null) {
        const redirectTo = session.redirectTo
        session.redirectTo = undefined
        await response.redirect(redirectTo)
        return
      }

      if (!request.userProfile) {
        await response.redirect("/")
        return
      }

      if (
        request.userProfile.groups.some((userRole) => userRole === UserRole.admin || userRole === UserRole.volunteer)
      ) {
        await response.redirect("/volunteer")
        return
      }

      await response.redirect("/hacker")
      return
    }
  }

  @requireLoggedIn()
  handleGetSocketToken(): Middleware {
    return async (request: Request, response: Response) => {
      const token = await TokenVault.createToken(TokenType.accessToken, request.user!, {
        scope: ["guilds:socket"],
        lifetime: 1800,
        claims: {
          client_id: "guilds-socket",
        },
      })
      response.status(200)
      response.json({ status: 200, message: "Token generation OK", token })
    }
  }
}

const authHandlers = new AuthHandlers()
export { authHandlers }
