# flick — Turn a Look into Hello
A Social Catalyst for High-Density Events. Built for real-world hellos—not swipes.

## Project Structure
- `/src` - React Native app (Expo)
- `/website` - Landing page for sponsors and users
- `/original-images` - Original design assets and screenshots

## What We've Built So Far

### Phase 1: Minimum Viable Interaction ✅

- **Camera Check-in Screen**: Take a fresh selfie (camera encouraged, gallery available)
- **Setup Form**: Collect Name + Age only (no bios)
- **Main Dashboard**: Toggle ON/OFF for availability with visual feedback
- **Radar Feed UI**: Shows nearby users with distance and nudge capability

### Phase 2: Supabase Integration ✅

- **Database Schema**: Users table with PostGIS geospatial support
- **Photo Upload**: Selfies automatically upload to Supabase Storage
- **User Management**: Full create/update/delete with UserContext
- **Location Tracking**: Automatic 60-second heartbeat with location updates
- **Proximity Queries**: Find users within 500m using PostGIS ST_DWithin
- **Real-time Updates**: Subscribe to nearby users changes
- **Auto-Wipe Logic**: Database function to delete inactive users (20min TTL)

### Phase 3: Match System ✅

- **Visible Interest Signals**: Users who liked you show with green border + "Wants to meet" label
- **Flick Button**: Send one-way interest signal to nearby users (tap gesture)
- **Visual Indicators**: Green card border and "Flick Back" button for interested users
- **Instant Matching**: One tap on "Flick Back" triggers immediate Green Light
- **Green Light Screen**: Full-screen green with pulse animation
- **Haptic Feedback**: 3-pulse vibration sequence on match
- **Real-time Updates**: Interest signals update within 1 second
- **Tap to Undo**: Tap "FLICKED ✓" button to undo your flick
- **Swipe to Hide**: Swipe left on any profile to hide them from your feed
- **Full-Screen Photos**: Tap any profile photo to view it full-screen
- **Cleanup**: Matches deleted on sign out

### Phase 4: Self-Destruct & Safety ✅

- **Time-Based Auto-Wipe**: Users deleted after 20 minutes of inactivity
- **Supabase Edge Function**: Automated cleanup every 5 minutes
- **Distance Dissolution**: Matches auto-delete when users move >500m apart
- **Heartbeat Integration**: Distance checks run every 60 seconds
- **Complete Cleanup**: Selfies, matches, and user data all removed

### Phase 5: Number Exchange "The Off-Ramp" ✅

- **Secure Phone Exchange**: After matching, users can optionally exchange phone numbers
- **15-Minute TTL**: Numbers self-destruct after 15 minutes with countdown timer
- **Proximity Wipe**: Exchange auto-deletes if users move >500m apart
- **Request/Accept Flow**: Both users must consent before numbers are revealed
- **Vault Screen**: Displays both numbers with quick actions (Call, Text, Save)
- **Privacy First**: No history kept after expiration, complete data deletion
- **Optional Feature**: Phone number is optional during profile setup
- **RLS Policy Fixed**: Row-level security now works with anonymous user IDs

## Tech Stack

- **Frontend**: React Native with Expo
- **Navigation**: React Navigation (Native Stack)
- **Backend**: Supabase (PostgreSQL + PostGIS + Storage)
- **Real-time**: Supabase Subscriptions
- **Permissions**: Camera + Location

## Getting Started

### 1. Install Dependencies

Already done! Dependencies installed:
- expo-camera
- expo-location
- react-navigation
- @supabase/supabase-js
- expo-haptics

### 2. Run the App

```bash
# Start the development server
npx expo start

# Then:
# - Press 'i' for iOS simulator
# - Press 'a' for Android emulator
# - Scan QR code with Expo Go app for physical device
```

### 3. Set Up Supabase Backend

**⚠️ IMPORTANT: The app requires Supabase to work!**

Follow the detailed guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) to:
- Create a Supabase project
- Set up the database schema
- Configure storage for selfies
- Update your API credentials

### 4. Test the Flow

1. **Camera Screen**: Grant camera permission → Take selfie → Confirm
2. **Setup Screen**: Enter your first name and age (18+) → Continue (uploads to Supabase)
3. **Dashboard**: Toggle availability ON/OFF, see REAL nearby users within 500m
4. **Pull to Refresh**: Update your location and fetch nearby users

## How It Works

### The Flow

1. **Check-in**: Take a fresh selfie (camera encouraged, gallery available)
2. **Profile**: Enter your first name and age
3. **Go Live**: Your profile is created in Supabase and status is set to ON
4. **Location Updates**: Every 60 seconds, your location updates automatically
5. **Radar Feed**: See people within 500m in real-time
6. **Heartbeat**: Background process prevents auto-wipe
7. **Sign Out**: Deletes your data and selfie completely

### Database Architecture

```
users table (PostGIS-enabled)
├── id (TEXT, primary key)
├── name (TEXT)
├── age (INTEGER)
├── selfie_url (TEXT)
├── phone_number (TEXT) - Optional, for number exchange
├── status (BOOLEAN) - ON/OFF
├── location (GEOGRAPHY) - Lat/long point
└── last_heartbeat (TIMESTAMP) - For auto-wipe

flicks table
├── from_user_id → users(id)
├── to_user_id → users(id)
└── created_at

exchanges table (15-minute TTL)
├── id (UUID, primary key)
├── user_a_id → users(id)
├── user_b_id → users(id)
├── user_a_phone (TEXT)
├── user_b_phone (TEXT)
├── status (TEXT) - pending/accepted
├── requested_by (TEXT)
├── created_at (TIMESTAMP)
└── expires_at (TIMESTAMP) - NOW() + 15 minutes

Storage: selfies bucket (public, auto-delete policies)
```

### Key Features Implemented

✅ **Camera-First**: Fresh selfies only, gallery available as fallback
✅ **Minimalist Profile**: Name + Age, no bios or chat
✅ **500m Proximity**: PostGIS geospatial queries with Earth's curvature
✅ **60s Heartbeat**: Automatic location updates when status is ON
✅ **Real-time Sync**: Supabase subscriptions for live updates
✅ **Auto-Wipe**: 20-minute inactivity timeout (database function ready)
✅ **Pull-to-Refresh**: Manual location/radar updates
✅ **Sign Out**: Complete data deletion (selfie + user record)
✅ **Interactive UI**: Swipe to hide, tap to undo flick, tap photos to view full-screen

## Design Philosophy

- **Minimalist UI**: Black, white, and signature green only
- **No Bios**: Just name, age, and a fresh selfie
- **No Chat**: Tap-to-flick for mutual interest only
- **Proximity First**: 500m radius, live location updates every 60s
- **Auto-Wipe**: Data self-destructs after 20 minutes of inactivity

## Project Structure

```
flick-app/
├── src/
│   ├── screens/
│   │   ├── CameraScreen.js      # Selfie capture with permissions
│   │   ├── SetupScreen.js       # Name + Age + Phone (optional)
│   │   ├── DashboardScreen.js   # Main app with real data
│   │   ├── GreenLightScreen.js  # Match screen with number exchange
│   │   └── VaultScreen.js       # Number exchange with 15-min timer
│   ├── lib/
│   │   ├── supabase.js          # Supabase client config
│   │   ├── database.js          # DB queries and functions
│   │   ├── location.js          # Location utilities
│   │   ├── userContext.js       # User state management + heartbeat
│   │   ├── flicks.js            # Match operations
│   │   ├── vault.js             # Number exchange operations
│   │   └── matchCleanup.js      # Distance-based dissolution
│   └── constants/
│       └── theme.js             # Design system (black/white/green)
├── supabase/
│   └── functions/
│       └── auto-cleanup/        # Edge Function for auto-wipe
├── App.js                       # Navigation + UserProvider
├── app.json                     # Expo config + permissions
├── supabase-setup.sql           # Base DB schema
├── supabase-exchanges-schema.sql # Number exchange schema
├── SUPABASE_SETUP.md            # Step-by-step setup guide
└── NUMBER_EXCHANGE_SETUP.md     # Number exchange setup guide
```

## What's Next

### Polish & Testing (Task #10)

All core features are now complete! Next steps:

- [ ] **Polish & Testing**
  - Refine animations and transitions
  - Add loading states
  - Test with multiple real users
  - Performance optimization
  - Error handling improvements

### Future Enhancements (Post-MVP)

- **Green Light Screen**: Full-screen green with haptic buzz when matched
- **Match History**: Temporary log of recent matches (also self-destructs)
- **Radius Adjustment**: Let users choose 50m / 500m / 200m
- **Do Not Disturb**: Schedule when you want to be invisible
- **Sound Design**: Subtle audio cues for matches
- **Onboarding**: Quick tutorial for first-time users

## Testing Tips

### Testing Proximity Locally

Since you probably don't have friends within 500m while developing:

1. **Modify the radius temporarily**:
   - In `src/constants/theme.js`, change `PROXIMITY_RADIUS` to `100000` (100km)
   - This lets you test with users anywhere in your city

2. **Use Expo Location Mocking**:
   - iOS Simulator: Debug → Location → Custom Location
   - Android Emulator: Extended Controls → Location

3. **Create test accounts**:
   - Open two devices/simulators
   - Create different users
   - Set custom locations nearby
   - Watch them appear in each other's radar!

### Debugging

- **Check Supabase logs**: Dashboard → Logs
- **Monitor database**: Table Editor → users (watch records appear)
- **Storage inspector**: Storage → selfies (verify uploads)
- **React Native debugger**: Shake device → Enable Remote Debugging
