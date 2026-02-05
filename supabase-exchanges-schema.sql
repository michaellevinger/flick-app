-- Number Exchange (The Off-Ramp) - Database Schema
-- Run this AFTER supabase-setup.sql

-- Add phone number to users table (optional field)
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Exchanges table for temporary number storage
CREATE TABLE IF NOT EXISTS exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  user_b_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  user_a_phone TEXT NOT NULL,
  user_b_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'accepted', 'expired'
  requested_by TEXT NOT NULL,              -- user_a_id or user_b_id
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '15 minutes'),
  UNIQUE(user_a_id, user_b_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS exchanges_user_a_idx ON exchanges(user_a_id);
CREATE INDEX IF NOT EXISTS exchanges_user_b_idx ON exchanges(user_b_id);
CREATE INDEX IF NOT EXISTS exchanges_expires_idx ON exchanges(expires_at);
CREATE INDEX IF NOT EXISTS exchanges_status_idx ON exchanges(status);

-- Function to clean up expired exchanges
CREATE OR REPLACE FUNCTION cleanup_expired_exchanges()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM exchanges
    WHERE expires_at < NOW() OR status = 'expired'
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get active exchange for a user
CREATE OR REPLACE FUNCTION get_active_exchange(
  current_user_id TEXT
)
RETURNS TABLE (
  id UUID,
  other_user_id TEXT,
  my_phone TEXT,
  other_phone TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  time_remaining_seconds INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    CASE
      WHEN e.user_a_id = current_user_id THEN e.user_b_id
      ELSE e.user_a_id
    END AS other_user_id,
    CASE
      WHEN e.user_a_id = current_user_id THEN e.user_a_phone
      ELSE e.user_b_phone
    END AS my_phone,
    CASE
      WHEN e.user_a_id = current_user_id THEN e.user_b_phone
      ELSE e.user_a_phone
    END AS other_phone,
    e.expires_at,
    EXTRACT(EPOCH FROM (e.expires_at - NOW()))::INTEGER AS time_remaining_seconds
  FROM exchanges e
  WHERE
    (e.user_a_id = current_user_id OR e.user_b_id = current_user_id)
    AND e.status = 'accepted'
    AND e.expires_at > NOW();
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE exchanges ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (matching users/nudges tables policy)
-- In production, you'd want more restrictive policies
CREATE POLICY "Enable all operations for exchanges" ON exchanges
  FOR ALL USING (true) WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE exchanges IS 'Temporary storage for number exchanges - self-destructs after 15 minutes';
COMMENT ON COLUMN exchanges.status IS 'pending: waiting for acceptance, accepted: both can see numbers, expired: self-destructed';
COMMENT ON COLUMN exchanges.expires_at IS 'Automatic expiration timestamp - 15 minutes from creation';
