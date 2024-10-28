import { ClientError } from "@otterhttp/errors"
import { type Prisma, PrismaClient } from "@prisma/client"
import { getChallengePointsByUser } from "@prisma/client/sql"
import assert from "node:assert/strict"

import { decodeTeamJoinCode } from "@server/common/decode-team-join-code"
import { guildsConfig, origin } from "@server/config"

export type Area = Prisma.AreaGetPayload<{ select: undefined }>
export type Guild = Prisma.GuildGetPayload<{ select: undefined }>
export type Point = Prisma.PointGetPayload<{ select: undefined }>
export type QrCode = Prisma.QrCodeGetPayload<{ select: undefined; include: { challenge: true } }> & {
  canBeRedeemedByUser(user: Pick<User, "keycloakUserId">): Promise<boolean>
  canBeRedeemed(): Promise<boolean>
  redemptionUrl: string
};
export type Team = Prisma.TeamGetPayload<{ select: undefined }> & {
  joinCodeString: string
}
export type User = Prisma.UserGetPayload<{ select: undefined }>
export type TokenSet = Prisma.TokenSetGetPayload<{ select: undefined }>
export type Challenge = Prisma.ChallengeGetPayload<{ select: undefined }>
export { QRCodesCategory, QuestDependencyMode } from "@prisma/client"

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
        return team_members < guildsConfig.maxTeamMembers
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
          challengeId: true,
          isBeingDisplayed: true
        },
        compute(qrCode) {
          return async (): Promise<boolean> => {
            if (!qrCode.state) return false
            if (!qrCode.isBeingDisplayed) return false

            if (qrCode.challengeId != null) {
              const challenge = await prisma.challenge.findUnique({
                where: { challengeId: qrCode.challengeId }
              })
              assert(challenge != null)
              const now = new Date()
              if (challenge.startTime != null && now < challenge.startTime) return false
              if (challenge.expiryTime != null && now >= challenge.expiryTime) return false
            }

            return true
          }
        },
      },
      canBeRedeemedByUser: {
        needs: {
          qrCodeId: true,
          state: true,
          challengeId: true,
          claimLimit: true,
          isBeingDisplayed: true
        },
        compute(qrCode: QrCode) {
          return async (user: Pick<User, "keycloakUserId">): Promise<boolean> => {
            if (!(await qrCode.canBeRedeemed())) return false;

            if (qrCode.claimLimit) {
              const redeemsByUser = await prisma.point.count({
                where: {
                  originQrCodeId: qrCode.qrCodeId,
                  redeemerUserId: user.keycloakUserId,
                },
              })
              if (redeemsByUser !== 0) return false
            }

            if (qrCode.challengeId != null) {
              const challenge = await prisma.challenge.findUnique({
                where: { challengeId: qrCode.challengeId }
              })
              assert(challenge != null)
              if (challenge.claimLimit) {
                const points = await prisma.$queryRawTyped(
                  getChallengePointsByUser(challenge.challengeId, user.keycloakUserId)
                )
                if (Number(points[0].points) !== 0) return false
              }
            }

            return true
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
