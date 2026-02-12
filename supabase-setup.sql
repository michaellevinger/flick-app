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

-- ============================================
-- CHAT SYSTEM TABLES AND FUNCTIONS
-- ============================================

-- Matches table to track mutual flicks and chat metadata
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  user1_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  user2_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE,
  unread_count_user1 INTEGER DEFAULT 0,
  unread_count_user2 INTEGER DEFAULT 0,
  UNIQUE(user1_id, user2_id)
);

-- Indexes for matches
CREATE INDEX IF NOT EXISTS matches_user1_idx ON matches(user1_id);
CREATE INDEX IF NOT EXISTS matches_user2_idx ON matches(user2_id);
CREATE INDEX IF NOT EXISTS matches_last_message_idx ON matches(last_message_at DESC);

-- Messages table for chat conversations
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id TEXT NOT NULL,
  sender_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  recipient_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'location', 'emoji_reaction')),
  content TEXT,
  image_url TEXT,
  location GEOGRAPHY(POINT, 4326),
  reaction_to_message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS messages_match_id_idx ON messages(match_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_recipient_id_idx ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS messages_reaction_to_idx ON messages(reaction_to_message_id);

-- Function to generate match ID (alphabetically sorted)
CREATE OR REPLACE FUNCTION get_match_id(user_a TEXT, user_b TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE WHEN user_a < user_b
    THEN user_a || '|' || user_b
    ELSE user_b || '|' || user_a
  END;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to create match on mutual flick
CREATE OR REPLACE FUNCTION create_match_on_mutual_flick()
RETURNS TRIGGER AS $$
DECLARE
  match_exists BOOLEAN;
  match_id_val TEXT;
BEGIN
  -- Check if reverse flick exists (mutual match)
  SELECT EXISTS(
    SELECT 1 FROM nudges
    WHERE from_user_id = NEW.to_user_id
    AND to_user_id = NEW.from_user_id
  ) INTO match_exists;

  IF match_exists THEN
    -- Generate match ID (alphabetically sorted)
    match_id_val := CASE WHEN NEW.from_user_id < NEW.to_user_id
      THEN NEW.from_user_id || '|' || NEW.to_user_id
      ELSE NEW.to_user_id || '|' || NEW.from_user_id
    END;

    -- Create match record
    INSERT INTO matches (id, user1_id, user2_id)
    VALUES (
      match_id_val,
      LEAST(NEW.from_user_id, NEW.to_user_id),
      GREATEST(NEW.from_user_id, NEW.to_user_id)
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on nudges table
DROP TRIGGER IF EXISTS on_nudge_inserted ON nudges;
CREATE TRIGGER on_nudge_inserted
  AFTER INSERT ON nudges
  FOR EACH ROW
  EXECUTE FUNCTION create_match_on_mutual_flick();

-- Messages are deleted automatically via CASCADE when:
-- 1. Match is deleted (users move >500m apart)
-- 2. User is deleted (logout or auto-wipe)

-- Enable RLS on new tables
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (restrict in production)
CREATE POLICY "Enable all operations for matches" ON matches
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for messages" ON messages
  FOR ALL USING (true) WITH CHECK (true);
