-- Race-hardening constraint for idempotent stars.
-- Keep the oldest historical row before enforcing uniqueness.
DELETE FROM stars a
USING stars b
WHERE a."userId" = b."userId"
  AND a."publicLetterId" = b."publicLetterId"
  AND a.id > b.id;

CREATE UNIQUE INDEX IF NOT EXISTS stars_user_public_letter_unique
  ON stars ("userId", "publicLetterId");
