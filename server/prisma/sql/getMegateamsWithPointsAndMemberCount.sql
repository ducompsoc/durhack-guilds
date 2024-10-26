SELECT
  megateam.megateam_name as "megateamName",
  megateam.megateam_description as "megateamDescription",
  SUM(point.value) as "points",
  COUNT(member.keycloak_user_id) as "memberCount"
FROM "Megateam" megateam
LEFT JOIN "Area" area on area.megateam_id = megateam.megateam_id
LEFT JOIN "Team" team on team.area_id = area.area_id
LEFT JOIN "User" member on member.team_id = team.team_id
LEFT JOIN "Point" point on point.redeemer_user_id = member.keycloak_user_id
GROUP BY
  megateam.megateam_name,
  megateam.megateam_description
