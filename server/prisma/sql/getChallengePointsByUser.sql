SELECT COALESCE(SUM(point.value), 0) AS "points"
FROM "Challenge" challenge
LEFT JOIN "QrCode" qrCode
  ON challenge.challenge_id = qrCode.challenge_id
LEFT JOIN "Point" point
  ON point.origin_qr_code_id = qrCode.qr_code_id
  AND point.redeemer_user_id = $2::uuid
WHERE challenge.challenge_id = $1
GROUP BY challenge.challenge_id