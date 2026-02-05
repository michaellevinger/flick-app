-- Update find_nearby_users function to include gender preference filtering
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION find_nearby_users(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters INTEGER,
  current_user_id TEXT,
  current_user_gender TEXT,
  current_user_looking_for TEXT
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  age INTEGER,
  selfie_url TEXT,
  gender TEXT,
  looking_for TEXT,
  distance_meters INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.name,
    u.age,
    u.selfie_url,
    u.gender,
    u.looking_for,
    CAST(ST_Distance(
      u.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) AS INTEGER) AS distance_meters
  FROM users u
  WHERE
    u.id != current_user_id
    AND u.status = true
    AND u.last_heartbeat > NOW() - INTERVAL '5 minutes'
    AND ST_DWithin(
      u.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_meters
    )
    -- Gender preference matching
    AND (
      -- Current user wants to see this gender
      (current_user_looking_for = 'both' OR u.gender = current_user_looking_for)
      AND
      -- Other user wants to see current user's gender
      (u.looking_for = 'both' OR u.looking_for = current_user_gender)
    )
  ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql;
