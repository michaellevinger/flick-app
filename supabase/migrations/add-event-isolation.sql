-- Event Isolation Migration
-- This migration enables festival/event-based user isolation
-- Users will only see others who scanned the same event QR code

-- Step 1: Add festival_id column to users table (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'festival_id'
    ) THEN
        ALTER TABLE users ADD COLUMN festival_id TEXT REFERENCES festivals(id) ON DELETE SET NULL;
        CREATE INDEX users_festival_idx ON users(festival_id);
    END IF;
END $$;

-- Step 2: Drop existing function if it exists, then create new one
DROP FUNCTION IF EXISTS find_users_in_festival(TEXT, TEXT, TEXT, TEXT);

CREATE FUNCTION find_users_in_festival(
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
  gender TEXT,
  looking_for TEXT,
  photos TEXT[],
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
    u.gender,
    u.looking_for,
    u.photos,
    u.bio,
    u.height
  FROM users u
  WHERE u.festival_id = user_festival_id
    AND u.id != current_user_id
    AND u.status = true
    AND u.last_heartbeat > NOW() - INTERVAL '20 minutes'
    -- Gender preference filtering: mutual compatibility
    -- Show user if:
    -- 1. I'm looking for them (my preference matches their gender OR I'm looking for 'both')
    AND (
      current_user_looking_for = 'both'
      OR current_user_looking_for = u.gender
    )
    -- 2. They're looking for me (their preference matches my gender OR they're looking for 'both')
    AND (
      u.looking_for = 'both'
      OR u.looking_for = current_user_gender
    )
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Verify the migration
DO $$
BEGIN
    -- Check if festival_id column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'festival_id'
    ) THEN
        RAISE NOTICE 'SUCCESS: festival_id column exists on users table';
    ELSE
        RAISE EXCEPTION 'FAILED: festival_id column missing on users table';
    END IF;

    -- Check if function exists
    IF EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'find_users_in_festival'
    ) THEN
        RAISE NOTICE 'SUCCESS: find_users_in_festival function exists';
    ELSE
        RAISE EXCEPTION 'FAILED: find_users_in_festival function missing';
    END IF;

    RAISE NOTICE 'Event isolation migration completed successfully!';
END $$;

-- Comments for documentation
COMMENT ON COLUMN users.festival_id IS 'Links user to specific event/festival for isolation - users only see others from same event';
COMMENT ON FUNCTION find_users_in_festival IS 'Returns users in the same festival with gender preference filtering';
