SELECT
  team.team_id as "teamId",
  team.team_name as "teamName",
  team.join_code as "joinCode",
  COUNT(member.keycloak_user_id) as "memberCount",
  SUM(point.value) AS "points",
  area.area_id as "areaId",
  area.area_name as "areaName",
  megateam.megateam_id as "megateamId",
  megateam.megateam_name as "megateamName"
FROM "Team" team
LEFT JOIN "User" member ON team.team_id = member.team_id
LEFT JOIN "Point" point ON member.keycloak_user_id = point.redeemer_user_id
LEFT JOIN "Area" area on team.area_id = area.area_id
LEFT JOIN "Megateam" megateam on area.megateam_id = megateam.megateam_id
GROUP BY
  team.team_id,
  team.team_name,
  team.join_code,
  area.area_id,
  area.area_name,
  megateam.megateam_id,
  megateam.megateam_name
ORDER BY points DESC

