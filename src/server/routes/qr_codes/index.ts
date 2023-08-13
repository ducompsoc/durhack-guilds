import { Router as ExpressRouter } from "express";

import * as handlers from "./qr_code_handlers";
import { handleMethodNotAllowed, parseRouteId } from "@server/common/middleware";


const qr_codes_router = ExpressRouter();

qr_codes_router.route("/")
  .get(handlers.getQRCodeList)
  .post(handlers.createQRCode)
  .all(handleMethodNotAllowed);

qr_codes_router.route("/preset")
  .get(handlers.getPresets)
  .all(handleMethodNotAllowed);

qr_codes_router.route("/preset/:preset")
  .post(handlers.usePreset)
  .all(handleMethodNotAllowed);

qr_codes_router.route("/:qr_code_id")
  .all(parseRouteId("qr_code_id"))
  .get(handlers.getQRCodeDetails)
  .patch(handlers.patchQRCodeDetails)
  .delete(handlers.deleteQRCode)
  .all(handleMethodNotAllowed);

export default qr_codes_router;
