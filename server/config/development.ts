import type { DeepPartial } from "@server/types/deep-partial"
import type { ConfigIn } from "@server/config/schema"

export default {
  csrf: {
    options: {
      cookieOptions: {
        domain: "megateams.durhack-dev.com",
      },
    },
  },
  session: {
    cookie: {
      domain: "megateams.durhack-dev.com",
    },
  },
} satisfies DeepPartial<ConfigIn>

