SELECT
  team.team_name as "teamName",
  SUM(point.value) AS "points"
FROM "Team" team
LEFT JOIN "User" member ON team.team_id = member.team_id
LEFT JOIN "Point" point ON member.keycloak_user_id = point.redeemer_user_id
GROUP BY
  team.team_name
ORDER BY points DESC
