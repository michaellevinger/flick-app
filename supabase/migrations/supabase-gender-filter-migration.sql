-- Gender Preference Filtering Migration
-- This fixes the bug where users see incompatible genders in their radar
-- Run this in your Supabase SQL Editor

-- Drop the old function
DROP FUNCTION IF EXISTS find_users_in_festival(TEXT, TEXT);

-- Create the new function with gender filtering
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

-- Test the function (optional)
-- SELECT * FROM find_users_in_festival('test-festival', 'your-user-id', 'male', 'female');
