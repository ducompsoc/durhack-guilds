import type { NextFunction } from "@otterhttp/app"
import { ClientError, HttpStatus, ServerError } from "@otterhttp/errors"

import { getSession } from "@server/auth/session"
import { ValueError } from "@server/common/errors"
import type { Middleware, Request, Response } from "@server/types"

type HttpVerb = "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH"

export function methodNotAllowed(allowedMethods: Iterable<HttpVerb>): Middleware {
  const allowHeaderValue = Array.from(allowedMethods).join(", ")
  const allowedMethodSet: Set<string> = new Set(allowedMethods)

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.method || !allowedMethodSet.has(req.method)) {
      res.setHeader("Allow", allowHeaderValue)
      res.sendStatus(405)
      return
    }

    next()
    return
  }
}

export function handleNotImplemented() {
  throw new ServerError("", { statusCode: HttpStatus.NotImplemented })
}

export function handleFailedAuthentication(request: Request) {
  if (request.user) {
    // Re-authenticating will not allow access (i.e. you are not a high-enough privileged user):
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403
    throw new ClientError("", { statusCode: HttpStatus.Forbidden })
  }
  // Lacking any credentials at all: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401
  throw new ClientError("", { statusCode: HttpStatus.Unauthorized })
}

function getQueryParameter(key: string) {
  return (request: Request): unknown => request.query[key]
}

function setLocalValue<T>(key: string) {
  return (response: Response, value: T): void => {
    response.locals[key] = value
  }
}

function parseId(value: unknown): number {
  if (typeof value !== "string") {
    throw new TypeError(`'${value}' should be a single string value.`)
  }

  const num = Number(value)

  if (!(Number.isInteger(num) && num >= 0)) {
    throw new ValueError(`'${value}' is not a valid ID.`)
  }

  return num
}

/**
 * Attempts to parse a given route parameter (key) as a number to use as an ID
 * @param key - The key of the route parameter to parse as an ID
 * @returns A middleware function that takes a request, response, and next function.
 * The key is extracted from the request's params and set in the local key of the response.
 */
export function parseRouteId(key: string): Middleware {
  return (request, response, next) => {
    const id = request.params[key]
    response.locals[key] = parseId(id)
    next()
  }
}

export function useSelfId(request: Request, response: Response, next: NextFunction): void {
  if (!request.user) {
    throw new ClientError("", { statusCode: HttpStatus.Unauthorized })
  }

  response.locals.user_id = request.user.keycloakUserId
  next()
}

export async function rememberUserReferrerForRedirect(request: Request, response: Response, next: () => void) {
  const referrer = request.query.referrer

  if (referrer != null && !Array.isArray(referrer)) {
    const session = await getSession(request, response)
    session.redirectTo = referrer
    await session.commit()
  }

  next()
}
