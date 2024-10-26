export enum UserRole {
  hacker = "/hackers",
  sponsor = "/sponsors",
  volunteer = "/volunteers",
  admin = "/admins",
}

export enum Ethnicity {
  american = "american", //"American Indian or Alaskan Native",
  asian = "asian", //"Asian / Pacific Islander",
  black = "black", //"Black or African American",
  hispanic = "hispanic", //"Hispanic",
  white = "white", //"White / Caucasian",
  multiple = "multiple", //"Multiple ethnicity / Other",
  pnts = "pnts", //"Prefer not to say",
}

export enum Gender {
  male = "male", // Male
  female = "female", // Female
  nonbinary = "nonbinary", // Non-binary / Third Gender
  other = "other", // Other
  pnts = "pnts", // Prefer not to say
}

export enum QRCategory {
  workshop = "workshop",
  sponsor = "sponsor",
  challenge = "challenge",
  preset = "preset",
}
