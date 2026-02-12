-- Chat System Migration - Only run the new parts
-- This adds matches and messages tables to existing database

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

-- Create trigger on nudges table (drop first if exists)
DROP TRIGGER IF EXISTS on_nudge_inserted ON nudges;
CREATE TRIGGER on_nudge_inserted
  AFTER INSERT ON nudges
  FOR EACH ROW
  EXECUTE FUNCTION create_match_on_mutual_flick();

-- Enable RLS on new tables
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Enable all operations for matches" ON matches;
CREATE POLICY "Enable all operations for matches" ON matches
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all operations for messages" ON messages;
CREATE POLICY "Enable all operations for messages" ON messages
  FOR ALL USING (true) WITH CHECK (true);
