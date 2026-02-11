-- Create festivals/rooms table
CREATE TABLE festivals (
  id TEXT PRIMARY KEY,                    -- e.g., "coachella2024" or UUID
  name TEXT NOT NULL,                     -- "Coachella 2024"
  description TEXT,                       -- Optional details
  sponsor_name TEXT,                      -- "Heineken" (if sponsor-specific)
  is_active BOOLEAN DEFAULT true,         -- Can disable festivals
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,    -- Optional expiration
  max_participants INTEGER                -- Optional capacity limit
);

-- Add festival_id to users table
ALTER TABLE users 
ADD COLUMN festival_id TEXT REFERENCES festivals(id) ON DELETE SET NULL;

-- Index for fast queries
CREATE INDEX users_festival_idx ON users(festival_id);

-- Update the find_nearby_users function to filter by festival instead of location
CREATE OR REPLACE FUNCTION find_users_in_festival(
  user_festival_id TEXT,
  current_user_id TEXT
)
RETURNS TABLE (
  id TEXT, 
  name TEXT, 
  age INTEGER, 
  selfie_url TEXT,
  gender TEXT,
  looking_for TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.age,
    u.selfie_url,
    u.gender,
    u.looking_for
  FROM users u
  WHERE u.festival_id = user_festival_id
    AND u.id != current_user_id
    AND u.status = true
    AND u.last_heartbeat > NOW() - INTERVAL '20 minutes'
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get festival info
CREATE OR REPLACE FUNCTION get_festival_info(festival_code TEXT)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  description TEXT,
  sponsor_name TEXT,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.name,
    f.description,
    f.sponsor_name,
    f.is_active
  FROM festivals f
  WHERE f.id = festival_code
    AND f.is_active = true
    AND (f.expires_at IS NULL OR f.expires_at > NOW());
END;
$$ LANGUAGE plpgsql;

-- Sample festival data
INSERT INTO festivals (id, name, description, sponsor_name, is_active) VALUES
  ('coachella2024', 'Coachella 2024', 'Music festival in Indio, CA', 'Heineken', true),
  ('tomorrowland2024', 'Tomorrowland 2024', 'Electronic music festival', 'Red Bull', true),
  ('lollapalooza2024', 'Lollapalooza 2024', 'Chicago music festival', 'Spotify', true);

COMMENT ON TABLE festivals IS 'Festival/event rooms that users can join via QR code';
COMMENT ON COLUMN users.festival_id IS 'Current festival the user is attending';
