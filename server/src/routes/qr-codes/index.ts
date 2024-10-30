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
  .route("/redeem")
  .all(methodNotAllowed(["POST"]))
  .post(qrCodesHandlers.redeemQR())
  
qrCodesApp
  .route("/challenges")
  .all(methodNotAllowed(["GET", "POST"]))
  .get(
    qrCodesHandlers.getChallengeList(),
    handleFailedAuthentication,
  )
  .post(qrCodesHandlers.createChallenge(), handleFailedAuthentication)
  
qrCodesApp
    .route("/challenges/:challenge_id")
    .all(methodNotAllowed(["POST"]))
    .all(parseRouteId("challenge_id"))
    .post(qrCodesHandlers.useChallenge(), handleFailedAuthentication)

qrCodesApp
  .route("/:qr_code_id")
  .all(methodNotAllowed(["GET", "PATCH", "DELETE"]))
  .all(parseRouteId("qr_code_id"))
  .patch(qrCodesHandlers.patchQRCodeDetails(), handleFailedAuthentication)

