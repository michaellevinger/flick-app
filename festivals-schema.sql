-- Festivals table for QR-based room system
CREATE TABLE IF NOT EXISTS festivals (
  id TEXT PRIMARY KEY,                    -- Unique festival code (e.g., "coachella2024")
  name TEXT NOT NULL,                     -- Display name (e.g., "Coachella 2024")
  sponsor_name TEXT,                      -- Sponsor (e.g., "Heineken")
  sponsor_logo_url TEXT,                  -- Sponsor logo URL
  start_date TIMESTAMP WITH TIME ZONE,    -- Festival start
  end_date TIMESTAMP WITH TIME ZONE,      -- Festival end
  is_active BOOLEAN DEFAULT true,         -- Can users join?
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add festival_id to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS festival_id TEXT REFERENCES festivals(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS looking_for TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Index for fast festival filtering
CREATE INDEX IF NOT EXISTS users_festival_idx ON users(festival_id);

-- Enable RLS
ALTER TABLE festivals ENABLE ROW LEVEL SECURITY;

-- Allow read access to festivals
CREATE POLICY "Enable read access for all users" ON festivals
  FOR SELECT USING (true);

-- Sample festivals for testing
INSERT INTO festivals (id, name, sponsor_name, is_active) VALUES
  ('coachella2024', 'Coachella 2024', 'Heineken', true),
  ('tomorrowland2024', 'Tomorrowland 2024', 'Red Bull', true),
  ('lollapalooza2024', 'Lollapalooza 2024', 'Spotify', true),
  ('test-festival', 'Test Festival', 'Dev Testing', true)
ON CONFLICT (id) DO NOTHING;
