-- Fix get_festival_info function to work with start_date/end_date schema
-- The old function was checking for expires_at which doesn't exist

DROP FUNCTION IF EXISTS get_festival_info(TEXT);

CREATE FUNCTION get_festival_info(festival_code TEXT)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  description TEXT,
  sponsor_name TEXT,
  is_active BOOLEAN,
  venue TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.name,
    f.description,
    f.sponsor_name,
    f.is_active,
    f.venue,
    f.start_date,
    f.end_date
  FROM festivals f
  WHERE f.id = festival_code
    AND f.is_active = true
    AND (f.end_date IS NULL OR f.end_date > NOW());
END;
$$ LANGUAGE plpgsql;

-- Also add a convenience column alias for backward compatibility
-- Some code might be looking for ends_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'festivals' AND column_name = 'ends_at'
    ) THEN
        -- Add a generated column that aliases end_date as ends_at
        -- This ensures old code still works
        ALTER TABLE festivals ADD COLUMN ends_at TIMESTAMP WITH TIME ZONE GENERATED ALWAYS AS (end_date) STORED;
    END IF;
END $$;

COMMENT ON FUNCTION get_festival_info IS 'Returns festival details by ID - updated to use start_date/end_date schema';
