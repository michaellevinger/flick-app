# Auto-Cleanup Edge Function

Supabase Edge Function that automatically deletes inactive users who haven't sent a heartbeat in 20+ minutes.

## What It Does

1. Runs every 5 minutes (via cron trigger)
2. Calls `auto_wipe_inactive_users()` SQL function
3. Deletes users where `last_heartbeat < NOW() - INTERVAL '20 minutes'`
4. Logs the number of deleted users

## Setup

### 1. Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Other platforms
# See: https://supabase.com/docs/guides/cli
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link to Your Project

```bash
cd /path/to/spot-app
supabase link --project-ref your-project-ref
```

Find your project ref in Supabase Dashboard → Settings → General → Reference ID

### 4. Deploy the Function

```bash
supabase functions deploy auto-cleanup
```

### 5. Set Up Cron Trigger

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project → **Database** → **Extensions**
2. Enable the `pg_cron` extension
3. Go to **SQL Editor** and run:

```sql
-- Schedule auto-cleanup to run every 5 minutes
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

Replace:
- `YOUR_PROJECT_REF` with your actual project reference ID
- `YOUR_SERVICE_ROLE_KEY` with your service role key from Settings → API

4. Verify cron job is created:

```sql
SELECT * FROM cron.job;
```

#### Option B: Using External Cron Service

If `pg_cron` is not available, use an external service like:

1. **cron-job.org** (free)
2. **EasyCron** (free tier available)
3. **GitHub Actions** (if your repo is public/private)

Configure it to call:
```
POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/auto-cleanup
Authorization: Bearer YOUR_SERVICE_ROLE_KEY
```

### 6. Test the Function

Manually trigger it:

```bash
# Using curl
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/auto-cleanup' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'

# Or using Supabase CLI
supabase functions invoke auto-cleanup --no-verify-jwt
```

Expected response:
```json
{
  "success": true,
  "deleted": 3,
  "timestamp": "2026-02-01T12:34:56.789Z",
  "message": "Deleted 3 inactive user(s)"
}
```

## Testing

### Test Scenario 1: Manual Trigger

1. Create a test user in the app
2. Set their `last_heartbeat` to 21 minutes ago:
   ```sql
   UPDATE users
   SET last_heartbeat = NOW() - INTERVAL '21 minutes'
   WHERE id = 'test_user_id';
   ```
3. Manually trigger the function
4. Check that the user is deleted:
   ```sql
   SELECT * FROM users WHERE id = 'test_user_id';
   -- Should return no rows
   ```

### Test Scenario 2: Automated Cron

1. Create a test user
2. Sign out (stop heartbeat)
3. Wait 21 minutes
4. Check database - user should be automatically deleted

## Monitoring

### View Function Logs

```bash
supabase functions logs auto-cleanup
```

Or in Dashboard → Edge Functions → auto-cleanup → Logs

### Check Cron Job Status

```sql
SELECT
  jobname,
  schedule,
  active,
  jobid
FROM cron.job
WHERE jobname = 'auto-cleanup-inactive-users';
```

### View Cron Execution History

```sql
SELECT
  runid,
  jobid,
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

## Troubleshooting

### Function not deploying

- Check Supabase CLI is up to date: `supabase --version`
- Verify you're linked to the correct project: `supabase projects list`

### Cron not running

- Check `pg_cron` extension is enabled
- Verify the cron schedule syntax
- Check cron job is active: `SELECT active FROM cron.job WHERE jobname = 'auto-cleanup-inactive-users'`

### Function returns 500 error

- Check Supabase logs for detailed error message
- Verify `auto_wipe_inactive_users()` SQL function exists
- Test the SQL function directly:
  ```sql
  SELECT auto_wipe_inactive_users();
  ```

## Uninstall

To remove the cron job:

```sql
SELECT cron.unschedule('auto-cleanup-inactive-users');
```

To delete the Edge Function:

```bash
supabase functions delete auto-cleanup
```

## Cost Considerations

- Edge Function invocations: ~8,640/month (every 5 minutes)
- Free tier: 500K invocations/month
- Cost: Well within free tier limits

## Security Notes

- Function uses `SUPABASE_SERVICE_ROLE_KEY` (admin access)
- Only accessible via authenticated requests
- CORS enabled for browser access
- Logs user deletion count (not user data)
