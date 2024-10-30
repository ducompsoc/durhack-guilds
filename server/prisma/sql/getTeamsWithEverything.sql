SELECT
  team.team_id as "teamId",
  team.team_name as "teamName",
  team.join_code as "joinCode",
  COUNT(member.keycloak_user_id) as "memberCount",
  SUM(point.value) AS "points",
  area.area_id as "areaId",
  area.area_name as "areaName",
  guild.guild_id as "guildId",
  guild.guild_name as "guildName"
FROM "Team" team
LEFT JOIN "User" member ON team.team_id = member.team_id
LEFT JOIN "Point" point ON member.keycloak_user_id = point.redeemer_user_id
LEFT JOIN "Area" area on team.area_id = area.area_id
LEFT JOIN "Guild" guild on area.guild_id = guild.guild_id
GROUP BY
  team.team_id,
  team.team_name,
  team.join_code,
  area.area_id,
  area.area_name,
  guild.guild_id,
  guild.guild_name
ORDER BY points DESC

