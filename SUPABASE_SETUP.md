# Supabase Setup Guide for SPOT

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in (or create an account)
2. Click "New Project"
3. Fill in the project details:
   - **Name**: `spot-app` (or whatever you prefer)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to you
   - **Pricing Plan**: Start with the free tier
4. Click "Create new project" and wait for it to initialize (~2 minutes)

## Step 2: Get Your API Credentials

1. In your Supabase project dashboard, click on the ⚙️ **Settings** icon (bottom left)
2. Click on **API** in the left sidebar
3. You'll see two important values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")
4. Keep this tab open - you'll need these values in Step 5

## Step 3: Set Up the Database

1. In your Supabase project, click on the **SQL Editor** icon (left sidebar)
2. Click **New query**
3. Open the file `supabase-setup.sql` in this project
4. Copy the entire contents and paste into the Supabase SQL Editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. You should see: "Success. No rows returned"

This creates:
- ✅ `users` table with geospatial support
- ✅ `nudges` table for mutual interest tracking
- ✅ PostGIS extension for proximity queries
- ✅ Database functions for finding nearby users
- ✅ Auto-wipe function for inactive users

## Step 4: Set Up Storage for Selfies

1. Click on **Storage** in the left sidebar
2. Click **New bucket**
3. Configure the bucket:
   - **Name**: `selfies`
   - **Public bucket**: Toggle ON (we need public URLs for images)
   - Click **Create bucket**

### Configure Storage Policies

1. Click on the `selfies` bucket
2. Click on **Policies** tab
3. Click **New Policy** → **For full customization**
4. Create an **INSERT** policy:
   - **Policy name**: `Allow public uploads`
   - **Target roles**: `public`
   - **USING expression**: `true`
   - **WITH CHECK expression**: `true`
   - Click **Review** → **Save policy**
5. Create a **SELECT** policy:
   - **Policy name**: `Allow public reads`
   - **Target roles**: `public`
   - **USING expression**: `true`
   - Click **Review** → **Save policy**
6. Create a **DELETE** policy:
   - **Policy name**: `Allow public deletes`
   - **Target roles**: `public`
   - **USING expression**: `true`
   - Click **Review** → **Save policy**

> **Note**: In production, you'd want more restrictive policies (e.g., users can only delete their own files). For now, we're keeping it simple.

## Step 5: Configure Your App

1. In your SPOT app directory, open `src/lib/supabase.js`
2. Replace the placeholder values:

```javascript
const SUPABASE_URL = 'https://xxxxxxxxxxxxx.supabase.co'; // From Step 2
const SUPABASE_ANON_KEY = 'your-actual-anon-key-here'; // From Step 2
```

## Step 6: Test the Connection

1. Start your Expo app:
   ```bash
   npx expo start
   ```

2. Open the app on your device/simulator

3. Try the flow:
   - Take a selfie
   - Enter name and age
   - You should see "Creating your profile..." loading state
   - If successful, you'll land on the Dashboard

4. Verify in Supabase:
   - Go to **Table Editor** in Supabase
   - Click on the `users` table
   - You should see your user record!
   - Go to **Storage** → `selfies` bucket
   - You should see your uploaded selfie

## Step 7: (Optional) Set Up Auto-Wipe Cron Job

The `auto_wipe_inactive_users()` function deletes users who haven't sent a heartbeat in 20 minutes. To run this automatically:

### Option A: Manual Trigger (Simple)
Just call it periodically from your app or via Supabase SQL Editor:
```sql
SELECT auto_wipe_inactive_users();
```

### Option B: Supabase Edge Function (Recommended)
1. Install Supabase CLI: https://supabase.com/docs/guides/cli
2. Create an Edge Function that runs on a schedule
3. Set it to call `auto_wipe_inactive_users()` every 5 minutes

### Option C: External Cron Service
Use a service like cron-job.org to call a Supabase Edge Function endpoint every 5 minutes

## Troubleshooting

### "Failed to create your profile"
- Check your internet connection
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct in `src/lib/supabase.js`
- Open React Native debugger and check console for errors

### "No nearby users" even when testing with friends
- Make sure both users have toggled status to ON
- Check that location permissions are granted
- Verify you're actually within 100m of each other
- Try pulling down to refresh

### Images not loading
- Check that the `selfies` bucket is set to **Public**
- Verify storage policies are set up correctly
- Check Network tab in debugger for 403/404 errors

### Database errors
- Make sure you ran the full `supabase-setup.sql` script
- Check that PostGIS extension is enabled:
  ```sql
  SELECT PostGIS_version();
  ```

## Next Steps

Once everything is working:
- ✅ Test with real location data (walk around!)
- ✅ Test with a friend (both within 100m)
- ✅ Implement the Nudge system (Task #8)
- ✅ Add mutual match detection
- ✅ Build the "Green Light" screen
- ✅ Add haptic feedback
- ✅ Test auto-wipe functionality

Need help? Check the main README.md or open an issue on GitHub.
