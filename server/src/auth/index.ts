import passport from "passport"

import SequelizeUser from "@server/database/tables/user"
import { NullError } from "@server/common/errors"

//import "./strategy/local";
import "./strategy/oauth2"

declare global {
  /* eslint-disable @typescript-eslint/no-namespace */
  namespace Express {
    interface User extends SequelizeUser {}
  }
}

interface SerializedUser {
  id: number
}

passport.serializeUser<SerializedUser>(async function (user: Express.User, callback) {
  return callback(null, { id: user.id })
})

passport.deserializeUser<SerializedUser>(async function (identifier, callback) {
  if (typeof identifier?.id !== "number") {
    return callback(null, null)
  }
  try {
    return callback(
      null,
      await SequelizeUser.findByPk(identifier.id, {
        rejectOnEmpty: new NullError(),
      }),
    )
  } catch (error) {
    if (error instanceof NullError) return callback(null, null)
    return callback(error)
  }
})
