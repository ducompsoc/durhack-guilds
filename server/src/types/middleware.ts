import type { Request } from "@server/request"
import type { Response } from "@server/response"

export type Middleware = (req: Request, res: Response, next: () => void) => Promise<void> | void
