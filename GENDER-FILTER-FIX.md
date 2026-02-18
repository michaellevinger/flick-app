# Gender Filter Bug Fix

## Problem
Men looking for women are seeing other men in their radar (and vice versa).

## Root Cause
The Supabase database function `find_nearby_users` needs to be updated to include gender preference filtering.

## Solution

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project: `oithyuuztrmohcbfglrh`
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run This SQL

Copy and paste the following SQL and click **Run**:

```sql
CREATE OR REPLACE FUNCTION find_nearby_users(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters INTEGER,
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
  distance_meters INTEGER
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
    -- Gender preference matching (MUTUAL FILTER)
    AND (
      -- Current user wants to see this gender
      (current_user_looking_for = 'both' OR u.gender = current_user_looking_for)
      AND
      -- Other user wants to see current user's gender
      (u.looking_for = 'both' OR u.looking_for = current_user_gender)
    )
  ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql;
```

### Step 3: Verify
After running the SQL:
1. Restart your app
2. Pull to refresh on the radar
3. You should now only see people matching your gender preferences

## How It Works

The filter is **mutual**:
- ✅ You only see people of the gender you're looking for
- ✅ They only see you if they're looking for your gender
- ✅ "Both" means you're open to everyone (and visible to everyone)

### Examples:
- **Man looking for Women** → Only sees women who are looking for men or both
- **Woman looking for Men** → Only sees men who are looking for women or both
- **Anyone looking for Both** → Sees everyone who is interested in their gender

---

**Status:** Run the SQL above to fix the bug immediately.
