export function decodeTeamJoinCode(joinCode: number): string {
  return joinCode.toString(16).padStart(4, "0").toUpperCase()
}
