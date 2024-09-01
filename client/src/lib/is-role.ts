import type { User } from "./useUser";

export function isAdmin(profile: User) {
  return profile.roles.some((role) => {
    if (role === "/admins") return true
    return false
  })
}

export function isVolunteer(profile: User) {
  return profile.roles.some((role) => {
    if (role === "/admins") return true
    if (role === "/volunteers") return true
    if (role === "/sponsors") return true
    return false
  })
}

export function isHacker(profile: User) {
  return profile.roles.some((role) => {
    if (role === "/hackers") return true
    return false
  })
}