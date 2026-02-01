# Auto-Wipe Setup Guide

This guide walks you through setting up automatic cleanup of inactive users and distance-based match dissolution.

## Overview

SPOT has two auto-wipe mechanisms:

1. **Time-Based Auto-Wipe** (20-minute inactivity)
   - Deletes users who haven't sent a heartbeat in 20+ minutes
   - Runs via Supabase Edge Function every 5 minutes
   - Prevents ghost profiles from cluttering the radar

2. **Distance-Based Match Dissolution** (100m+ separation)
   - Automatically deletes mutual nudges when users move apart
   - Runs during every heartbeat (every 60 seconds)
   - Ensures matches are only active when users are nearby

---

## Part 1: Time-Based Auto-Wipe

### Prerequisites

- Supabase project set up
- `auto_wipe_inactive_users()` SQL function deployed (from `supabase-setup.sql`)
- Supabase CLI installed (optional, but recommended)

### Step 1: Install Supabase CLI

**macOS:**
```bash
brew install supabase/tap/supabase
```

**Windows:**
```bash
scoop install supabase
```

**Linux:**
```bash
brew install supabase/tap/supabase
```

Or see: https://supabase.com/docs/guides/cli/getting-started

### Step 2: Login and Link Project

```bash
# Login to Supabase
supabase login

# Navigate to your project
cd /path/to/spot-app

# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF
```

Find your project ref: Supabase Dashboard → Settings → General → Reference ID

### Step 3: Deploy the Edge Function

```bash
# Deploy the auto-cleanup function
supabase functions deploy auto-cleanup
```

You should see:
```
✓ Deployed Function auto-cleanup
Function URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/auto-cleanup
```

### Step 4: Set Up Cron Scheduling

#### Option A: Using pg_cron (Recommended)

1. **Enable pg_cron extension:**
   - Go to Supabase Dashboard → **Database** → **Extensions**
   - Search for `pg_cron`
   - Toggle it ON

2. **Create the cron job:**
   - Go to **SQL Editor**
   - Create a new query and paste:

```sql
-- Schedule auto-cleanup every 5 minutes
SELECT cron.schedule(
  'auto-cleanup-inactive-users',
  '*/5 * * * *',  -- Every 5 minutes
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/auto-cleanup',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

3. **Replace placeholders:**
   - `YOUR_PROJECT_REF`: Your project reference ID
   - `YOUR_SERVICE_ROLE_KEY`: Get from Settings → API → service_role key

4. **Run the query**

5. **Verify it's scheduled:**
```sql
SELECT * FROM cron.job WHERE jobname = 'auto-cleanup-inactive-users';
```

#### Option B: Using cron-job.org (Alternative)

If pg_cron is not available:

1. Go to [cron-job.org](https://cron-job.org)
2. Create a free account
3. Create a new cron job:
   - **Title**: SPOT Auto-Cleanup
   - **URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/auto-cleanup`
   - **Schedule**: Every 5 minutes
   - **Request Method**: POST
   - **Headers**: Add two headers:
     - `Content-Type: application/json`
     - `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`
4. Save and enable

### Step 5: Test the Function

**Manual test:**
```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/auto-cleanup' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'
```

**Expected response:**
```json
{
  "success": true,
  "deleted": 0,
  "timestamp": "2026-02-01T12:34:56.789Z",
  "message": "Deleted 0 inactive user(s)"
}
```

**Test with inactive user:**

1. Create a user in the app
2. Get their user ID from Supabase Table Editor
3. Set their heartbeat to 21 minutes ago:
```sql
UPDATE users
SET last_heartbeat = NOW() - INTERVAL '21 minutes'
WHERE id = 'user_id_here';
```
4. Trigger the function manually (curl command above)
5. Check the user is deleted:
```sql
SELECT * FROM users WHERE id = 'user_id_here';
-- Should return 0 rows
```

### Monitoring

**View Edge Function logs:**
```bash
supabase functions logs auto-cleanup --tail
```

Or in Dashboard → Edge Functions → auto-cleanup → Logs

**Check cron execution history:**
```sql
SELECT
  job_name,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE job_name = 'auto-cleanup-inactive-users'
ORDER BY start_time DESC
LIMIT 10;
```

---

## Part 2: Distance-Based Match Dissolution

This is **already implemented** in the app! No setup needed.

### How It Works

Every 60 seconds (during heartbeat):
1. App updates user's location
2. Checks all mutual matches
3. Calculates distance to each matched user
4. If distance > 100m → Deletes both nudges (A→B and B→A)

### Implementation

Located in:
- `src/lib/matchCleanup.js` - Match cleanup logic
- `src/lib/userContext.js` - Integrated into heartbeat

### Testing Distance Dissolution

1. **Create two test accounts**
2. **Both nudge each other** → Green Light appears
3. **Move one device/simulator location** >100m away
4. **Wait 60 seconds** (next heartbeat)
5. **Check database:**
```sql
SELECT * FROM nudges WHERE
  (from_user_id = 'user_a' AND to_user_id = 'user_b')
  OR
  (from_user_id = 'user_b' AND to_user_id = 'user_a');
-- Should return 0 rows
```

### How to Simulate Location Change

**iOS Simulator:**
- Debug → Location → Custom Location
- Enter new coordinates >100m away

**Android Emulator:**
- Click "..." (Extended Controls)
- Location → Set new coordinates

**Calculate 100m away:**
- 0.001 degrees latitude ≈ 111 meters
- So change latitude by +/- 0.001 to move ~111m

---

## Troubleshooting

### Edge Function not deploying
- Update Supabase CLI: `supabase update`
- Check you're logged in: `supabase projects list`
- Verify project is linked: `supabase status`

### Cron job not running
- Check pg_cron is enabled: `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`
- Verify cron job exists: `SELECT * FROM cron.job;`
- Check if job is active: `SELECT active FROM cron.job WHERE jobname = 'auto-cleanup-inactive-users';`

### Edge Function returns errors
- Check function logs: `supabase functions logs auto-cleanup`
- Test SQL function directly: `SELECT auto_wipe_inactive_users();`
- Verify service role key is correct

### Distance dissolution not working
- Check heartbeat is running (user status is ON)
- Verify location permissions are granted
- Check console logs for cleanup errors
- Test with exaggerated distance (1km+)

### Users not being deleted after 20 minutes
- Check Edge Function is running: Review logs
- Verify cron job is active
- Manually trigger function to test
- Check SQL function: `SELECT auto_wipe_inactive_users();`

---

## Monitoring & Analytics

### Track Auto-Cleanup Activity

```sql
-- Create a simple log table (optional)
CREATE TABLE cleanup_logs (
  id BIGSERIAL PRIMARY KEY,
  deleted_count INTEGER,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modify auto_wipe_inactive_users() to log results
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

  -- Log the cleanup
  INSERT INTO cleanup_logs (deleted_count) VALUES (deleted_count);

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
```

### View Cleanup History

```sql
SELECT
  executed_at,
  deleted_count,
  executed_at::date as date
FROM cleanup_logs
ORDER BY executed_at DESC
LIMIT 50;
```

### Daily Summary

```sql
SELECT
  executed_at::date as date,
  SUM(deleted_count) as total_deleted,
  COUNT(*) as executions
FROM cleanup_logs
GROUP BY date
ORDER BY date DESC;
```

---

## Cost Considerations

**Edge Function Invocations:**
- Every 5 minutes = 12/hour = 288/day = 8,640/month
- Supabase free tier: 500,000 invocations/month
- Usage: 1.7% of free tier
- **Cost: FREE**

**Database Queries:**
- Same frequency as above
- Minimal impact on database
- Well within free tier limits

---

## Uninstalling

### Remove Cron Job

```sql
SELECT cron.unschedule('auto-cleanup-inactive-users');
```

### Delete Edge Function

```bash
supabase functions delete auto-cleanup
```

### Remove Distance Dissolution

Comment out in `src/lib/userContext.js`:

```javascript
// await cleanupDistantMatches(user.id, newLocation);
```

---

## Summary

After completing this setup:

✅ **Inactive users** auto-delete after 20 minutes
✅ **Matches dissolve** when users move apart
✅ **Database stays clean** with no ghost profiles
✅ **All automatic** - no manual intervention needed

The app now fully implements the "ephemeral" nature of SPOT!
