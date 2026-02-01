-- SPOT App - Supabase Database Setup
-- Run this in your Supabase SQL Editor

-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  selfie_url TEXT,
  status BOOLEAN DEFAULT true,
  location GEOGRAPHY(POINT, 4326),
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for geospatial queries (critical for performance)
CREATE INDEX IF NOT EXISTS users_location_idx ON users USING GIST(location);

-- Index for status queries
CREATE INDEX IF NOT EXISTS users_status_idx ON users(status);

-- Index for heartbeat cleanup
CREATE INDEX IF NOT EXISTS users_heartbeat_idx ON users(last_heartbeat);

-- Nudges table for mutual interest tracking
CREATE TABLE IF NOT EXISTS nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  to_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

-- Index for faster nudge lookups
CREATE INDEX IF NOT EXISTS nudges_from_user_idx ON nudges(from_user_id);
CREATE INDEX IF NOT EXISTS nudges_to_user_idx ON nudges(to_user_id);

-- Function to find nearby users within radius
CREATE OR REPLACE FUNCTION find_nearby_users(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters INTEGER,
  current_user_id TEXT
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  age INTEGER,
  selfie_url TEXT,
  distance_meters INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.name,
    u.age,
    u.selfie_url,
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
  ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to check for mutual nudges
CREATE OR REPLACE FUNCTION check_mutual_nudge(
  user_a TEXT,
  user_b TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM nudges WHERE from_user_id = user_a AND to_user_id = user_b
  ) AND EXISTS (
    SELECT 1 FROM nudges WHERE from_user_id = user_b AND to_user_id = user_a
  );
END;
$$ LANGUAGE plpgsql;

-- Function to auto-delete inactive users (20 minute timeout)
CREATE OR REPLACE FUNCTION auto_wipe_inactive_users()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM users
    WHERE last_heartbeat < NOW() - INTERVAL '20 minutes'
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudges ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (in production, you'd want more restrictive policies)
CREATE POLICY "Enable all operations for users" ON users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for nudges" ON nudges
  FOR ALL USING (true) WITH CHECK (true);

-- Create a cron job to run cleanup every 5 minutes
-- Note: This requires pg_cron extension which may need to be enabled in Supabase
-- Alternatively, you can call this function from an Edge Function or your app

-- Example manual cleanup (run periodically):
-- SELECT auto_wipe_inactive_users();
