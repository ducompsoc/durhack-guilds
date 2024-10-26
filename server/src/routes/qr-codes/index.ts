import { App } from "@otterhttp/app"

import { handleFailedAuthentication, methodNotAllowed, parseRouteId } from "@server/common/middleware"
import type { Request, Response } from "@server/types"

import { qrCodesHandlers } from "./qr-codes-handlers"

export const qrCodesApp = new App<Request, Response>()

qrCodesApp
  .route("/")
  .all(methodNotAllowed(["GET", "POST"]))
  .get(qrCodesHandlers.getQRCodeList(), handleFailedAuthentication)
  .post(qrCodesHandlers.createQRCode(), handleFailedAuthentication)

qrCodesApp
  .route("/presets")
  .all(methodNotAllowed(["GET", "POST"]))
  .get(qrCodesHandlers.getPresetsList(), handleFailedAuthentication)
  .post(qrCodesHandlers.createPreset(), handleFailedAuthentication)

qrCodesApp
  .route("/presets/:preset_id")
  .all(methodNotAllowed(["GET", "POST", "DELETE"]))
  .get(qrCodesHandlers.getPresetDetails(), handleFailedAuthentication)
  .post(qrCodesHandlers.usePreset(), handleFailedAuthentication)
  .delete(qrCodesHandlers.deletePreset(), handleFailedAuthentication)

qrCodesApp
  .route("/redeem")
  .all(methodNotAllowed(["POST"]))
  .post(qrCodesHandlers.redeemQR())

qrCodesApp
  .route("/challenges/reorder")
  .all(methodNotAllowed(["POST"]))
  .post(qrCodesHandlers.reorderChallengeList(), handleFailedAuthentication)

qrCodesApp
  .route("/challenges")
  .all(methodNotAllowed(["GET", "POST"]))
  .get(
    qrCodesHandlers.getChallengeListAdmin(),
    qrCodesHandlers.getChallengeListAsAnonymous(),
    handleFailedAuthentication,
  )
  .post(qrCodesHandlers.createChallenge(), handleFailedAuthentication)

qrCodesApp
  .route("/:qr_code_id")
  .all(methodNotAllowed(["GET", "PATCH", "DELETE"]))
  .all(parseRouteId("qr_code_id"))
  .get(qrCodesHandlers.getQRCodeDetails(), handleFailedAuthentication)
  .patch(qrCodesHandlers.patchQRCodeDetails(), handleFailedAuthentication)
  .delete(qrCodesHandlers.deleteQRCode(), handleFailedAuthentication)
