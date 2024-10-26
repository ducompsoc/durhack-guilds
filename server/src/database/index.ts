import { ClientError } from "@otterhttp/errors"
import { type Prisma, PrismaClient } from "@prisma/client"

import { decodeTeamJoinCode } from "@server/common/decode-team-join-code"
import { megateamsConfig, origin } from "@server/config"

export type Area = Prisma.AreaGetPayload<{ select: undefined }>
export type Megateam = Prisma.MegateamGetPayload<{ select: undefined }>
export type Point = Prisma.PointGetPayload<{ select: undefined }>
export type QrCode = Prisma.QrCodeGetPayload<{ select: undefined }> & {
  canBeRedeemed(user: Pick<User, "keycloakUserId">): Promise<boolean>
  redemptionUrl: string
}
export type Team = Prisma.TeamGetPayload<{ select: undefined }> & {
  joinCodeString: string
}
export type User = Prisma.UserGetPayload<{ select: undefined }>
export type TokenSet = Prisma.TokenSetGetPayload<{ select: undefined }>

const basePrisma = new PrismaClient()
export const prisma = basePrisma.$extends({
  name: "prismaExtensions",
  model: {
    user: {
      async getTotalPoints({ where }: { where: Prisma.Args<typeof basePrisma.user, "findUnique">["where"] }) {
        const user = await prisma.user.findUnique({
          where,
          select: { keycloakUserId: true, points: true },
        })

        if (!user) throw new ClientError("User not found", { statusCode: 404, exposeMessage: false })
        return prisma.point.sumPoints(user.points)
      },
    },
    point: {
      sumPoints(points: Point[]) {
        return points.reduce((total: number, point: Point) => total + point.value, 0)
      },
    },
    team: {
      async isJoinableTeam({ where }: { where: { teamId: Team["teamId"] } }) {
        const team_members = await basePrisma.user.count({ where: { team: { is: where } } })
        return team_members < megateamsConfig.maxTeamMembers
      },
    },
  },
  result: {
    team: {
      joinCodeString: {
        needs: { joinCode: true },
        compute(team) {
          return decodeTeamJoinCode(team.joinCode)
        },
      },
    },
    qrCode: {
      canBeRedeemed: {
        needs: {
          qrCodeId: true,
          state: true,
          startTime: true,
          expiryTime: true,
          maxUses: true,
        },
        compute(qrCode) {
          return async (user: Pick<User, "keycloakUserId">): Promise<boolean> => {
            const now = new Date()

            if (now < qrCode.startTime) return false
            if (now >= qrCode.expiryTime) return false
            if (!qrCode.state) return false

            if (qrCode.maxUses != null) {
              const numberOfUses = await prisma.point.count({
                where: { originQrCodeId: qrCode.qrCodeId },
              })
              if (numberOfUses >= qrCode.maxUses) return false
            }

            const redeemsByUser = await prisma.point.count({
              where: {
                originQrCodeId: qrCode.qrCodeId,
                redeemerUserId: user.keycloakUserId,
              },
            })
            return redeemsByUser === 0
          }
        },
      },
      redemptionUrl: {
        needs: { payload: true },
        compute(qrCode) {
          const redemptionUrlSearchParams = new URLSearchParams({ qr_id: qrCode.payload })
          return `${origin}/hacker/redeem?${redemptionUrlSearchParams.toString()}`
        },
      },
    },
  },
})
