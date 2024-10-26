import assert from "node:assert/strict"
import { ClientError, HttpStatus, ServerError } from "@otterhttp/errors"
import { v7 as uuid } from "uuid"
import { z } from "zod"

import { requireLoggedIn, requireUserHasOne, requireUserIsAdmin } from "@server/common/decorators"
import { NullError } from "@server/common/errors"
import { QRCategory, UserRole } from "@server/common/model-enums"
import { megateamsConfig } from "@server/config"
import { type QrCode, type User, prisma } from "@server/database"
import type { Middleware, Request, Response } from "@server/types"

const presets = new Map(Object.entries(megateamsConfig.QRPresets))

class QRCodesHandlers {
  static createQRPayloadSchema = z.object({
    name: z.string(),
    category: z.nativeEnum(QRCategory),
    pointsValue: z.number().nonnegative(),
    maxUses: z.number().nonnegative(),
    state: z.boolean(),
    startTime: z.date().or(
      z
        .string()
        .datetime()
        .transform((val) => new Date(val)),
    ),
    expiryTime: z.date().or(
      z
        .string()
        .datetime()
        .transform((val) => new Date(val)),
    ),
    publicised: z.boolean(),
  })

  private async buildAndSaveQRCodeFromCreateAttributes(
    creator: User,
    create_attributes: Omit<z.infer<typeof QRCodesHandlers.createQRPayloadSchema>, "publicised">,
    publicised: boolean,
  ) {
    const publicisedFields = await this.getPublicisedFields(null, publicised)

    const payload = uuid()

    return await prisma.qrCode.create({
      data: {
        payload: payload,
        creatorUserId: creator.keycloakUserId,
        ...create_attributes,
        ...publicisedFields,
      },
    })
  }

  static createQRCodePayloadSchema = z.object({})

  @requireUserIsAdmin()
  createQRCode(): Middleware {
    return async (request: Request, response: Response) => {
      const { publicised, ...create_attributes } = QRCodesHandlers.createQRPayloadSchema.parse(request.body)

      const new_instance = await this.buildAndSaveQRCodeFromCreateAttributes(
        request.user as User,
        create_attributes,
        publicised,
      )

      response.status(200)
      response.json({
        status: response.statusCode,
        message: "OK",
        data: {
          ...new_instance,
          // todo: check prisma extension properties are not enumerable
          redemption_url: new_instance.redemptionUrl,
        },
      })
    }
  }

  static usePresetPayloadSchema = z.object({
    name: z.string(),
    publicised: z.boolean(),
  })

  @requireUserHasOne(UserRole.admin, UserRole.volunteer, UserRole.sponsor)
  usePreset(): Middleware {
    return async (request: Request, response: Response) => {
      const preset_id: string = request.params.preset_id
      const { name, publicised } = QRCodesHandlers.usePresetPayloadSchema.parse(request.body)

      if (!preset_id || !presets.has(preset_id) || !name) {
        throw new ClientError("", { statusCode: HttpStatus.NotFound, expected: true })
      }
      const preset = presets.get(preset_id)
      assert(preset)

      const expiry = new Date()
      expiry.setMinutes(expiry.getMinutes() + preset.minutesValid)
      const create_attributes = {
        name: name,
        pointsValue: preset.points,
        maxUses: preset.uses,
        category: QRCategory.preset,
        state: true,
        startTime: new Date(),
        expiryTime: expiry,
      }

      const new_instance = await this.buildAndSaveQRCodeFromCreateAttributes(
        request.user as User,
        create_attributes,
        publicised,
      )

      response.status(200)
      response.json({
        status: response.statusCode,
        message: "OK",
        data: {
          ...new_instance,
          redemption_url: new_instance.redemptionUrl,
        },
      })
    }
  }

  @requireUserIsAdmin()
  getQRCodeList(): Middleware {
    return async (_request: Request, response: Response): Promise<void> => {
      // todo: this needs to be paginated
      const result = await prisma.qrCode.findMany({
        include: { redeems: true, creator: true },
        orderBy: { createdAt: "desc" },
      })

      const payload = result.map((code) => ({
        id: code.qrCodeId,
        name: code.name,
        category: code.category,
        scans: code.redeems.length,
        max_scans: code.maxUses,
        // todo: this used to be a preferred name
        creator: code.creator.keycloakUserId,
        value: code.pointsValue,
        start: code.startTime,
        end: code.expiryTime,
        enabled: code.state,
        uuid: code.payload,
        publicised: code.challengeRank !== null,
        redemption_url: code.redemptionUrl,
      }))

      response.status(200)
      response.json({
        status: 200,
        message: "OK",
        codes: payload,
      })
    }
  }

  private async getPublicisedFields(existing_rank: number | null, publicised: boolean) {
    if (!publicised) return { challenge_rank: null }
    if (existing_rank != null) return { challenge_rank: existing_rank }

    const maxRankResult = await prisma.qrCode.aggregate({
      _max: {
        challengeRank: true,
      },
    })
    const maxRank = maxRankResult._max.challengeRank
    return { challenge_rank: (maxRank ?? 0) + 1 }
  }

  static patchQRCodeDetailsPayloadSchema = z.object({
    state: z.boolean().optional(),
    publicised: z.boolean().optional(),
  })

  @requireUserHasOne(UserRole.admin, UserRole.volunteer, UserRole.sponsor)
  patchQRCodeDetails(): Middleware {
    return async (request: Request, response: Response): Promise<void> => {
      const { qr_code_id } = response.locals
      if (typeof qr_code_id !== "number") throw new Error("Parsed `qr_code_id` not found.")

      const { state, publicised } = QRCodesHandlers.patchQRCodeDetailsPayloadSchema.parse(request.body)

      const found_code = await prisma.qrCode.findUnique({
        where: { qrCodeId: qr_code_id },
      })
      if (found_code == null) throw new NullError()

      let fields: { challenge_rank: number | null } | undefined

      if (publicised != null) {
        fields = await this.getPublicisedFields(found_code.challengeRank, publicised)
      }

      await prisma.qrCode.update({
        where: { qrCodeId: qr_code_id },
        data: {
          state,
          ...fields,
        },
      })

      response.status(200)
      response.json({
        status: response.statusCode,
        message: "OK",
        data: found_code,
      })
    }
  }

  @requireUserHasOne(UserRole.admin, UserRole.volunteer, UserRole.sponsor)
  getPresetsList(): Middleware {
    return (_request: Request, response: Response) => {
      response.status(200)
      response.json({
        status: 200,
        message: "OK",
        presets: Object.fromEntries(presets),
      })
    }
  }

  @requireUserIsAdmin()
  createPreset(): Middleware {
    return (request: Request, response: Response) => {
      throw new ServerError("", { statusCode: HttpStatus.NotImplemented, expected: true })
    }
  }

  @requireUserIsAdmin()
  getPresetDetails(): Middleware {
    return (request: Request, response: Response) => {
      throw new ServerError("", { statusCode: HttpStatus.NotImplemented, expected: true })
    }
  }

  @requireUserIsAdmin()
  deletePreset(): Middleware {
    return (request: Request, response: Response) => {
      throw new ServerError("", { statusCode: HttpStatus.NotImplemented, expected: true })
    }
  }

  static redeemQRPayloadSchema = z.object({
    uuid: z.string().uuid(),
  })

  @requireLoggedIn()
  redeemQR(): Middleware {
    return async (request: Request, response: Response) => {
      const { uuid } = QRCodesHandlers.redeemQRPayloadSchema.parse(request.body)
      const user = request.user
      assert(user != null)

      let qr = null as QrCode | null
      await prisma.$transaction(async (context) => {
        qr = await context.qrCode.findUnique({
          where: { payload: uuid },
          include: { redeems: true },
        })
        if (qr == null) throw new ClientError()

        const qrCanBeRedeemed = await qr.canBeRedeemed(user)
        if (!qrCanBeRedeemed) throw new ClientError()

        await context.point.create({
          data: {
            value: qr.pointsValue,
            originQrCodeId: qr.qrCodeId,
            redeemerUserId: user.keycloakUserId,
          },
        })
      })

      assert(qr != null)

      response.json({
        status: 200,
        message: "OK",
        points: qr.pointsValue,
      })
    }
  }

  private async getChallengeList(_request: Request, response: Response, includeId: boolean) {
    const now = new Date()
    const challenges = await prisma.qrCode.findMany({
      where: {
        challengeRank: { not: null },
        state: true,
        startTime: { lt: now },
        expiryTime: { gt: now },
      },
      orderBy: {
        challengeRank: "asc",
      },
    })

    const data = challenges.map((challenge, i) => {
      const challengeRepresentation: {
        title: string
        points: number
        rank: number
        id?: number
      } = {
        title: challenge.name,
        points: challenge.pointsValue,
        rank: i,
      }
      if (includeId) challengeRepresentation.id = challenge.qrCodeId
      return challengeRepresentation
    })

    response.json({
      status: 200,
      message: "OK",
      challenges: data,
    })
  }

  @requireUserIsAdmin()
  getChallengeListAdmin(): Middleware {
    return async (request: Request, response: Response) => {
      await this.getChallengeList(request, response, true)
    }
  }

  getChallengeListAsAnonymous(): Middleware {
    return async (request: Request, response: Response) => {
      await this.getChallengeList(request, response, false)
    }
  }

  static reorderChallengeListPayloadSchema = z.object({
    challenges: z.array(
      z.object({
        id: z.number(),
        rank: z.number(),
      }),
    ),
  })

  @requireUserIsAdmin()
  reorderChallengeList(): Middleware {
    return async (request: Request, response: Response) => {
      const { challenges } = QRCodesHandlers.reorderChallengeListPayloadSchema.parse(request.body)

      await prisma.$transaction([
        prisma.qrCode.updateMany({
          data: { challengeRank: null },
        }),
        ...challenges.map((challenge) => {
          return prisma.qrCode.update({
            where: { qrCodeId: challenge.id },
            data: { challengeRank: challenge.rank },
          })
        }),
      ])

      response.json({
        status: 200,
        message: "OK",
      })
    }
  }

  @requireUserIsAdmin()
  createChallenge(): Middleware {
    return async (request: Request, response: Response) => {
      throw new ServerError("", { statusCode: HttpStatus.NotImplemented, expected: true })
    }
  }

  @requireUserIsAdmin()
  getQRCodeDetails(): Middleware {
    return async (request: Request, response: Response) => {
      throw new ServerError("", { statusCode: HttpStatus.NotImplemented, expected: true })
    }
  }

  @requireUserIsAdmin()
  deleteQRCode(): Middleware {
    return async (request: Request, response: Response) => {
      throw new ServerError("", { statusCode: HttpStatus.NotImplemented, expected: true })
    }
  }
}

const qrCodesHandlers = new QRCodesHandlers()
export { qrCodesHandlers }
