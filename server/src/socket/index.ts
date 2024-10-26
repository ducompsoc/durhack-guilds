import { TokenType } from "@durhack/token-vault/lib"
import type { Server, Socket } from "socket.io"

import TokenVault from "@server/auth/tokens"

import type { User } from "@server/database"

type JWTPayload = Awaited<ReturnType<typeof TokenVault.decodeToken>>["payload"]

class SocketConnection {
  declare connectedUser?: User
  declare manager: SocketManager
  declare socket: Socket

  constructor(manager: SocketManager, socket: Socket) {
    this.manager = manager
    this.socket = socket
    this.addSocketEventListeners()
  }

  private addSocketEventListeners() {
    this.socket.on("authenticate", this.onAuthenticate.bind(this))
    this.socket.on("disconnect", this.onDisconnect.bind(this))
  }

  private async onAuthenticate(token: unknown, cb: (res: boolean) => void) {
    if (this.connectedUser) return
    if (typeof token !== "string" || typeof cb !== "function") return

    let decodedPayload: JWTPayload
    try {
      decodedPayload = (await TokenVault.decodeToken(TokenType.accessToken, token)).payload
    } catch (error) {
      return cb(false)
    }

    let user: User
    let scope: string[]
    try {
      ;({ user, scope } = await TokenVault.getUserAndScopeClaims(decodedPayload))
    } catch (error) {
      return cb(false)
    }

    if (!scope.includes("socket:state")) return cb(false)

    this.connectedUser = user

    cb(true)
  }

  private onDisconnect() {
    this.manager.connections.delete(this)
  }
}

class SocketManager {
  declare server?: Server
  declare connections: Set<SocketConnection>

  constructor() {
    this.connections = new Set()
  }

  public initialise(server: Server): void {
    this.server = server
    this.addServerEventListeners()
  }

  public getServer(): Server | undefined {
    return this.server
  }

  private addServerEventListeners(): void {
    if (!this.server) throw new Error("Manager not initialized.")

    this.server.on("connection", this.onConnection.bind(this))
  }

  private onConnection(socket: Socket) {
    if (!this.server) return
    this.connections.add(new SocketConnection(this, socket))
  }
}

export default new SocketManager()
