import { Response as OtterResponse } from "@otterhttp/app"

import type { Request } from "./request"

export class Response<Req extends Request = Request> extends OtterResponse<Req> {
  sessionDirty: boolean

  constructor(request: Req) {
    super(request)
    this.sessionDirty = false
  }
}
