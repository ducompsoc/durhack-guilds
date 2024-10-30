export type Guild = {
  guild_name: string
  areas?: Area[]
}

export type Team = {
  name: string
  join_code: string
  team_id: number
  area: Area
}

export type Area = {
  name?: string
  area_id?: number
  guild?: Guild
}

export type QR = {
  name: string
  category: string
  redemptionUrl: string
}