import path from "node:path"
import { getTokenVault } from "@durhack/token-vault"

import { tokenVaultConfig } from "@server/config"
import { type UserWithTokens, prisma } from "@server/database"
import { dirname } from "@server/dirname"

function resolveFilePathFromProjectRoot(path_to_resolve: string): string {
  return path.resolve(path.join(dirname, "..", path_to_resolve))
}

export default await getTokenVault<UserWithTokens>({
  getUserIdentifier: (user: UserWithTokens) => user.keycloakUserId,
  findUniqueUser: async (userId: unknown) => {
    if (typeof userId !== "string") return null
    return await prisma.user.findUnique({ where: { keycloakUserId: userId }, include: { tokenSet: true } })
  },
  filePathResolver: resolveFilePathFromProjectRoot,
  ...tokenVaultConfig,
})
