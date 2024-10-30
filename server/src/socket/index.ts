import { TokenType } from "@durhack/token-vault/lib"
import { Server, Socket } from "socket.io"
import { QR } from "@durhack/guilds-common/types/index"

import TokenVault from "@server/auth/tokens"
import { type User, UserWithTokens, prisma } from "@server/database"
import { UserRole } from "@server/common/model-enums"
import { keycloakClient, KeycloakUserInfo } from "@server/auth/keycloak-client"

type JWTPayload = Awaited<ReturnType<typeof TokenVault.decodeToken>>["payload"]

async function emitQR(id: number, emitter: Socket | Server) {
  const qr = await prisma.qrCode.findUnique({where: { qrCodeId: id }})
  if (!qr) return

  const payload: QR | null = (await qr.canBeRedeemed()) ? qr : null

  if (emitter instanceof Socket) return emitter.emit("qr", payload)

  emitter.to(`qr:${id}`).emit("qr", payload)
}

class SocketConnection {
  declare connectedUser?: User
  declare userRoles?: UserRole[]
  declare manager: SocketManager
  declare socket: Socket
  declare qrCodeId: number

  constructor(manager: SocketManager, socket: Socket) {
    this.manager = manager
    this.socket = socket
    this.addSocketEventListeners()
  }

  private addSocketEventListeners() {
    this.socket.on("authenticate", this.onAuthenticate.bind(this))
    this.socket.on("disconnect", this.onDisconnect.bind(this))
    this.socket.on("qr", this.onQR.bind(this))
    this.socket.on("end_listen", this.onEndListen.bind(this))
  }

  private isElevatedRole() {
    if (!this.connectedUser) return false
    if (this.userRoles?.length === 0) return false
    if (this.userRoles?.length === 1 && this.userRoles[0] === UserRole.hacker) return false
    return true;
  }

  private async onQR(id: number) {
    if (!this.isElevatedRole()) return
    await prisma.qrCode.update({ where: { qrCodeId: id }, data: { isBeingDisplayed: true } })
    this.socket.join(`qr:${id}`)
    this.qrCodeId = id
    await emitQR(id, this.socket)
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

    let user: UserWithTokens
    try {
      ;({ user } = await TokenVault.getUserAndScopeClaims(decodedPayload))
    } catch (error) {
      return cb(false)
    }

    if (user?.tokenSet?.accessToken == null) return cb(false)

    const userProfile = await keycloakClient.userinfo<KeycloakUserInfo>(user.tokenSet.accessToken)

    this.connectedUser = user
    this.userRoles = userProfile.groups as UserRole[]

    cb(true)
  }

  private async onDisconnect() {
    if (this.qrCodeId != null) await prisma.qrCode.update({ where: { qrCodeId: this.qrCodeId }, data: { isBeingDisplayed: false } })
    this.manager.connections.delete(this)
  }

  private async onEndListen() {
    if (this.qrCodeId != null) await prisma.qrCode.update({ where: { qrCodeId: this.qrCodeId }, data: { isBeingDisplayed: false } })
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

  async emitQR(id: number) {
    if (!this.server) return
    await emitQR(id, this.server)
  }
}

export default new SocketManager()
