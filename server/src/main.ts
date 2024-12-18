import { type Server, createServer } from "node:http"
import * as process from "node:process"
import { App } from "@otterhttp/app"
import { Server as SocketIO } from "socket.io"

import { matchSignedCookie, signCookie, unsignCookieOrThrow } from "@server/auth/cookies"
import { origin, listenConfig } from "@server/config"
import { apiErrorHandler } from "@server/routes/error-handling"

import { Request } from "./request"
import { Response } from "./response"
import { apiApp } from "./routes"
import SocketManager from "./socket"
import "./database"

const environment = process.env.NODE_ENV
const dev = environment !== "production"

function getApp(): App<Request, Response> {
  const app = new App<Request, Response>({
    settings: {
      setCookieOptions: {
        sign: signCookie,
      },
      cookieParsing: {
        signedCookieMatcher: matchSignedCookie,
        cookieUnsigner: unsignCookieOrThrow,
      },
      "trust proxy": ["loopback"],
    },
    onError: apiErrorHandler,
  })

  app.use("/api", apiApp)

  return app
}

function getServer(app: App<Request, Response>): Server<typeof Request, typeof Response> {
  const server = createServer<typeof Request, typeof Response>({
    IncomingMessage: Request,
    ServerResponse: Response,
  })
  server.on("request", app.attach)
  const io = new SocketIO(server as Server)
  SocketManager.initialise(io)

  return server
}

async function main() {
  const app = getApp()
  const server = getServer(app)

  server.listen(listenConfig.port, listenConfig.host, () => {
    console.log(
      `> Server listening on http://${listenConfig.host}:${listenConfig.port} as ${dev ? "development" : environment}, access via ${origin}`,
    )
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
