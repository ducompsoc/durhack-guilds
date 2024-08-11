import { Request, Response } from "express"

import { UserRole } from "@server/common/model_enums"
import { requireLoggedIn } from "@server/common/decorators"
import TokenVault from "@server/auth/tokens"
import { TokenType } from "@durhack/token-vault/lib"

class AuthHandlers {
  async handleLoginSuccess(request: Request, response: Response) {
    if (!request.user) {
      return response.redirect("/")
    }

    if (request.session.redirect_to) {
      const redirect_to = request.session.redirect_to
      request.session.redirect_to = undefined
      return response.redirect(redirect_to)
    }

    if (request.user.role !== UserRole.hacker) {
      return response.redirect("/volunteer")
    }

    return response.redirect("/hacker")
  }

  async handleLogout(request: Request, response: Response) {
    request.session.destroy(() => {
      response.status(200)
      response.json({ status: response.statusCode, message: "OK" })
    })
  }

  @requireLoggedIn
  async handleGetSocketToken(request: Request, response: Response) {
    const token = await TokenVault.createToken(TokenType.accessToken, request.user!, {
      scope: ["socket:state"],
      lifetime: 1800,
      claims: {
        client_id: "megateams-socket",
      },
    })
    response.status(200)
    response.json({ status: 200, message: "Token generation OK", token })
  }
}

const handlersInstance = new AuthHandlers()
export default handlersInstance
