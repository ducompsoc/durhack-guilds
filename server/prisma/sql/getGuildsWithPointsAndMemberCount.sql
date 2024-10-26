SELECT
  guild.guild_name as "guildName",
  guild.guild_description as "guildDescription",
  SUM(point.value) as "points",
  COUNT(member.keycloak_user_id) as "memberCount"
FROM "Guild" guild
LEFT JOIN "Area" area on area.guild_id = guild.guild_id
LEFT JOIN "Team" team on team.area_id = area.area_id
LEFT JOIN "User" member on member.team_id = team.team_id
LEFT JOIN "Point" point on point.redeemer_user_id = member.keycloak_user_id
GROUP BY
  guild.guild_name,
  guild.guild_description
