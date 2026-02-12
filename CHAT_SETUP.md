# Chat Feature Setup Guide

## Prerequisites

- Supabase project already set up (see `SUPABASE_SETUP.md`)
- PostGIS extension enabled
- Base schema from `supabase-setup.sql` already deployed

## Step 1: Deploy Database Schema

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the chat-related SQL from `supabase-setup.sql` (lines after "CHAT SYSTEM TABLES AND FUNCTIONS")
4. Paste and execute in SQL Editor

**What this creates:**
- `matches` table
- `messages` table
- Indexes for performance
- `get_match_id()` function
- `create_match_on_mutual_flick()` trigger
- `delete_expired_messages()` function
- Row Level Security policies

## Step 2: Create Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Click **New bucket**
3. Settings:
   - **Name**: `chat-images`
   - **Public**: ✅ Yes
   - **File size limit**: 5 MB (default)
   - **Allowed MIME types**: `image/*`
4. Click **Create bucket**

### Set Storage Policies

After creating the bucket, set up access policies:

1. Click on `chat-images` bucket
2. Go to **Policies** tab
3. Click **New policy**
4. Create two policies:

**Insert Policy:**
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-images');
```

**Select Policy:**
```sql
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-images');
```

## Step 3: Update Edge Function

The Edge Function has already been updated in the codebase. Deploy it:

```bash
# Make sure you're logged in to Supabase CLI
npx supabase login

# Link to your project (if not already linked)
npx supabase link --project-ref YOUR_PROJECT_REF

# Deploy the updated function
npx supabase functions deploy auto-cleanup
```

## Step 4: Verify pg_cron Schedule

Ensure the cleanup function runs every 5 minutes:

1. Go to **SQL Editor** in Supabase
2. Run this query to check existing cron jobs:

```sql
SELECT * FROM cron.job;
```

3. If the auto-cleanup job doesn't exist or needs updating, run:

```sql
-- Delete old job if exists
SELECT cron.unschedule('auto-cleanup-job');

-- Create new job that includes message cleanup
SELECT cron.schedule(
  'auto-cleanup-job',
  '*/5 * * * *',  -- Every 5 minutes
  $$
  SELECT net.http_post(
    url := 'YOUR_SUPABASE_URL/functions/v1/auto-cleanup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_ANON_KEY'
    )
  );
  $$
);
```

Replace `YOUR_SUPABASE_URL` and `YOUR_ANON_KEY` with your actual values.

## Step 5: Install Dependencies

The required npm package has already been installed:

```bash
npm install @react-navigation/bottom-tabs
```

## Step 6: Test the Feature

### Test 1: Match Creation

1. Open app on Device/Simulator A
2. Complete onboarding, go to radar
3. Open app on Device/Simulator B
4. Complete onboarding, ensure both users are within 500m
5. User A flicks User B
6. User B flicks User A back
7. **Expected**: Both see Green Light screen, match appears in Matches tab

### Test 2: Send Text Message

1. From Green Light screen, tap "Start Chat"
2. Type a message and tap "Send"
3. **Expected**: Message appears instantly on both devices
4. Check unread badge on Matches tab

### Test 3: Send Image

1. In chat, tap camera icon
2. Choose "Take Photo" or "Choose from Library"
3. Select/capture an image
4. **Expected**: Image uploads and displays in chat

### Test 4: Send Location

1. In chat, tap location icon
2. Grant location permissions if prompted
3. **Expected**: Location message appears with coordinates

### Test 5: Message Expiration

1. Send a message
2. Wait 20+ minutes (or manually run cleanup function)
3. **Expected**: Message disappears from chat

To manually trigger cleanup:

```sql
SELECT delete_expired_messages();
```

### Test 6: Distance Dissolution

1. With an active match, move one device >500m away
2. Wait for heartbeat (60 seconds)
3. **Expected**: Match dissolves, chat becomes inaccessible

## Troubleshooting

### Issue: Messages not appearing in real-time

**Solution**: Check Realtime is enabled for `messages` table:
1. Go to **Database** → **Replication**
2. Find `messages` table
3. Enable replication

### Issue: Image upload fails

**Solution**: Verify storage bucket exists and policies are set:
```sql
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE name = 'chat-images';

-- Check policies
SELECT * FROM storage.policies WHERE bucket_id = 'chat-images';
```

### Issue: Match not created on mutual flick

**Solution**: Verify trigger is active:
```sql
-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_nudge_inserted';

-- Test match creation manually
INSERT INTO nudges (from_user_id, to_user_id) VALUES ('user1', 'user2');
INSERT INTO nudges (from_user_id, to_user_id) VALUES ('user2', 'user1');
SELECT * FROM matches WHERE user1_id = 'user1' OR user2_id = 'user1';
```

### Issue: Messages not being deleted after 20 minutes

**Solution**: Check Edge Function logs:
1. Go to **Edge Functions** → **auto-cleanup**
2. View **Logs** tab
3. Verify function is being called every 5 minutes
4. Check for errors in `delete_expired_messages()` call

### Issue: Unread count not updating

**Solution**: Check match metadata updates:
```sql
-- Manually verify unread counts
SELECT * FROM matches WHERE user1_id = 'YOUR_USER_ID' OR user2_id = 'YOUR_USER_ID';
```

## Database Queries for Debugging

### Check active matches for a user
```sql
SELECT * FROM matches
WHERE user1_id = 'YOUR_USER_ID' OR user2_id = 'YOUR_USER_ID'
ORDER BY last_message_at DESC;
```

### Check messages in a match
```sql
SELECT * FROM messages
WHERE match_id = 'user1|user2'
ORDER BY created_at DESC
LIMIT 50;
```

### Check expired messages
```sql
SELECT * FROM messages
WHERE expires_at < NOW();
```

### Manually clean up expired messages
```sql
SELECT delete_expired_messages();
```

### Check storage usage
```sql
SELECT
  bucket_id,
  COUNT(*) as file_count,
  SUM(metadata->>'size')::bigint as total_size
FROM storage.objects
WHERE bucket_id = 'chat-images'
GROUP BY bucket_id;
```

## Performance Monitoring

Monitor these metrics in production:

- **Message volume**: Average messages per match
- **Storage usage**: Total size of chat-images bucket
- **Edge Function execution time**: Should be <1 second
- **Database query performance**: Check slow queries in Supabase logs

## Next Steps

After verifying the chat feature works:

1. Test with multiple users simultaneously
2. Monitor Supabase dashboard for errors
3. Check storage bucket doesn't grow indefinitely (messages should be cleaning up)
4. Optimize any slow queries
5. Consider implementing push notifications
6. Add end-to-end encryption for enhanced privacy

## Support Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [PostGIS Documentation](https://postgis.net/docs/)
