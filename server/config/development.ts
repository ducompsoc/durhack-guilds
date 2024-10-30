import type { DeepPartial } from "@server/types/deep-partial"
import type { ConfigIn } from "@server/config/schema"

export default {
  csrf: {
    options: {
      cookieOptions: {
        domain: "guilds.durhack-dev.com",
      },
    },
  },
  session: {
    cookie: {
      domain: "guilds.durhack-dev.com",
    },
  },
} satisfies DeepPartial<ConfigIn>

