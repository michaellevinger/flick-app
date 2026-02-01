# SPOT - Quick Start Guide

Get SPOT running in ~10 minutes!

## Prerequisites

- Node.js installed (v16+)
- Expo CLI (installed automatically)
- iOS Simulator (Xcode) or Android Emulator (Android Studio)
- OR: Physical device with Expo Go app

## 1. Supabase Setup (5 minutes)

### Create Project
1. Go to [supabase.com](https://supabase.com) → Sign in
2. Click "New Project"
3. Name: `spot-app`, choose region, create password
4. Wait ~2 minutes for initialization

### Set Up Database
1. Click **SQL Editor** → **New query**
2. Copy entire contents of `supabase-setup.sql`
3. Paste and click **Run**
4. Should see: "Success. No rows returned"

### Set Up Storage
1. Click **Storage** → **New bucket**
2. Name: `selfies`, toggle **Public bucket** ON
3. Create bucket
4. Go to **Policies** tab
5. Create 3 policies (all with `Target roles: public`, expressions: `true`):
   - INSERT policy: "Allow public uploads"
   - SELECT policy: "Allow public reads"
   - DELETE policy: "Allow public deletes"

### Get Credentials
1. Click ⚙️ **Settings** → **API**
2. Copy **Project URL**
3. Copy **anon public** key

## 2. Configure App (1 minute)

Edit `src/lib/supabase.js`:

```javascript
const SUPABASE_URL = 'YOUR_PROJECT_URL_HERE';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';
```

## 3. Run App (2 minutes)

```bash
# Start Expo
npx expo start

# Then press:
# i = iOS simulator
# a = Android emulator
# Or scan QR with Expo Go app
```

## 4. Test the Flow

1. **Camera**: Allow permissions → Take selfie → Confirm
2. **Setup**: Enter name (any) + age (18+) → Continue
3. **Dashboard**: You should see "Creating your profile..." → Dashboard loads
4. **Verify**:
   - Open Supabase → **Table Editor** → `users` (your record should be there!)
   - Go to **Storage** → `selfies` (your selfie should be uploaded!)

## Troubleshooting

### "Failed to create your profile"
- Check internet connection
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Check Supabase dashboard → Logs for errors

### "No nearby users"
This is normal! To test:
1. Change `PROXIMITY_RADIUS` in `src/constants/theme.js` to `100000` (100km)
2. Create account on second device/simulator
3. Both should appear in each other's radar

### Camera/Location permissions denied
- iOS Simulator: Settings → Privacy → (Camera/Location) → Expo Go → Allow
- Android: Settings → Apps → Expo → Permissions → Allow

## What's Working

✅ Camera selfie capture
✅ User profile creation
✅ Photo upload to Supabase
✅ Location tracking (60s heartbeat)
✅ Real-time proximity detection (100m)
✅ Pull-to-refresh radar
✅ ON/OFF status toggle
✅ Sign out (full data deletion)

## What's Next

🚧 Nudge system (send interest signal)
🚧 Mutual match detection
🚧 "Green Light" screen with haptics
🚧 Auto-wipe automation (20min timeout)

---

**Need more details?** Check [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) or [README.md](./README.md)
