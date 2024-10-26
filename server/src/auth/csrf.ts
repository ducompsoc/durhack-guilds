import { type DoubleCsrfConfig, doubleCsrf } from "@otterhttp/csrf-csrf"

import { getSession } from "@server/auth/session"
import { csrfConfig } from "@server/config"
import type { Request, Response } from "@server/types"

const options = {
  ...csrfConfig.options,
  getSessionIdentifier: async (req, res) => {
    const session = await getSession(req, res)
    return session.id
  },
  getSecret: () => csrfConfig.secret,
} satisfies DoubleCsrfConfig<Request, Response>

export const { generateToken, doubleCsrfProtection } = doubleCsrf(options)

export async function handleGetCsrfToken(request: Request, response: Response): Promise<void> {
  const session = await getSession(request, response)
  const csrfToken = await generateToken(request, response, { validateOnReuse: session.csrfTokenInitialized ?? false })
  if (!session.csrfTokenInitialized) {
    session.csrfTokenInitialized = true
    await session.commit()
  }
  response.status(200)
  response.json({ status: 200, message: "Token generation OK", token: csrfToken })
}
