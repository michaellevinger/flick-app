-- Fix Gender Matching - Case Insensitive
-- Run this in your Supabase SQL Editor

DROP FUNCTION IF EXISTS find_users_in_festival(TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION find_users_in_festival(
  user_festival_id TEXT,
  current_user_id TEXT,
  current_user_gender TEXT,
  current_user_looking_for TEXT
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  age INTEGER,
  selfie_url TEXT,
  photos TEXT[],
  gender TEXT,
  looking_for TEXT,
  bio TEXT,
  height INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.name,
    u.age,
    u.selfie_url,
    u.photos,
    u.gender,
    u.looking_for,
    u.bio,
    u.height
  FROM users u
  WHERE u.festival_id = user_festival_id
    AND u.id != current_user_id
    AND u.status = true
    AND u.last_heartbeat > NOW() - INTERVAL '20 minutes'
    -- Gender preference filtering with CASE-INSENSITIVE matching
    AND (
      LOWER(current_user_looking_for) = 'both'
      OR LOWER(current_user_looking_for) = LOWER(u.gender)
    )
    AND (
      LOWER(u.looking_for) = 'both'
      OR LOWER(u.looking_for) = LOWER(current_user_gender)
    )
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Also add photos column that was missing!
