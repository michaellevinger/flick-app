# Chat Feature - Quick Deploy Guide

**5-Minute Setup** to get the chat feature running.

---

## Step 1: Deploy Database Schema (2 minutes)

1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)
2. Copy the **Chat System** section from `supabase-setup.sql` (starts at line ~130)
3. Paste and click **Run**

**Verify:**
```sql
SELECT * FROM matches LIMIT 1;
SELECT * FROM messages LIMIT 1;
```

---

## Step 2: Create Storage Bucket (1 minute)

1. Go to [Storage](https://supabase.com/dashboard/project/_/storage/buckets)
2. Click **New bucket**
3. Name: `chat-images`
4. Public: ✅ **Yes**
5. Click **Create**

**Add Policies:**
Go to bucket → Policies → New policy:

**Insert:**
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-images');
```

**Select:**
```sql
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-images');
```

---

## Step 3: Deploy Edge Function (1 minute)

```bash
# Login to Supabase CLI
npx supabase login

# Link project (if not already)
npx supabase link --project-ref YOUR_PROJECT_REF

# Deploy updated function
npx supabase functions deploy auto-cleanup
```

**Verify in Dashboard:**
- Go to Edge Functions → auto-cleanup
- Check Logs tab for successful runs

---

## Step 4: Enable Realtime (1 minute)

1. Go to [Database → Replication](https://supabase.com/dashboard/project/_/database/replication)
2. Find `matches` table → Enable
3. Find `messages` table → Enable

---

## Step 5: Test (1 minute)

Run the app on 2 devices/simulators:

```bash
npm start
# Press 'i' for iOS simulator
# Press 'a' for Android emulator
```

**Test Flow:**
1. User A and B mutually flick
2. Both see Green Light → Tap "Start Chat"
3. Send a message → Should appear instantly
4. Check Matches tab → Unread badge shows

---

## Troubleshooting

### Issue: Messages not appearing
```sql
-- Check realtime is enabled
SELECT * FROM realtime.subscription;
```

### Issue: Images not uploading
```sql
-- Verify bucket exists
SELECT * FROM storage.buckets WHERE name = 'chat-images';
```

### Issue: Match not created
```sql
-- Check trigger
SELECT * FROM pg_trigger WHERE tgname = 'on_nudge_inserted';
```

---

## Done! 🎉

Users can now:
- ✅ Message after mutual matches
- ✅ Share images and location
- ✅ See unread badges
- ✅ Messages auto-delete after 20 minutes

**How Messages Work:**
- ✅ Messages persist permanently (like WhatsApp, Tinder, etc.)
- ✅ Only deleted when match record is deleted
- ✅ Event-based model - no distance checks
- ✅ Matches remain active within festival/event
- ✅ Add "Unmatch" feature to allow deletion (future)

**Next Steps:**
- Monitor Supabase logs for errors
- Test with real users
- Consider adding push notifications
- Monitor database growth over time

**Full Documentation:**
- `CHAT_FEATURE.md` - Complete feature docs
- `CHAT_SETUP.md` - Detailed setup guide
- `IMPLEMENTATION_SUMMARY.md` - Technical details
