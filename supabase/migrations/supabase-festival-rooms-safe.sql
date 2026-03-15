-- Safe migration script that won't fail if tables/columns already exist

-- Create festivals table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS festivals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sponsor_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  max_participants INTEGER
);

-- Add festival_id to users table (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'festival_id'
  ) THEN
    ALTER TABLE users ADD COLUMN festival_id TEXT REFERENCES festivals(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index (only if it doesn't exist)
CREATE INDEX IF NOT EXISTS users_festival_idx ON users(festival_id);

-- Update the find_nearby_users function to filter by festival
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

-- Insert sample festivals (only if they don't exist)
INSERT INTO festivals (id, name, description, sponsor_name, is_active)
VALUES 
  ('coachella2024', 'Coachella 2024', 'Music festival in Indio, CA', 'Heineken', true),
  ('tomorrowland2024', 'Tomorrowland 2024', 'Electronic music festival', 'Red Bull', true),
  ('lollapalooza2024', 'Lollapalooza 2024', 'Chicago music festival', 'Spotify', true)
ON CONFLICT (id) DO NOTHING;

-- Verify everything is set up
SELECT 'Migration complete! Festivals table:' as status;
SELECT id, name, sponsor_name FROM festivals;
