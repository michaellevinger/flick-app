# flick — Turn a Look into Hello
A Social Catalyst for Festivals & Events. Built for real-world hellos—not swipes.

**B2B Model:** QR code "rooms" for festival sponsors. Users scan to enter isolated pools. Direct attribution, measurable ROI.

## Project Structure
- `/src` - React Native app (Expo)
- `/website` - B2B landing page for sponsors
- `/supabase` - Database schema & Edge Functions

## What We've Built

### QR-First Festival Room System ✅

**The Flow:**
1. **Download App** → Opens to QR Scanner screen
2. **Scan Festival QR** → Validates and joins festival (e.g., `coachella2024`)
3. **Take Selfie** → Fresh selfie with camera or gallery
4. **Create Profile** → Name + Age + Gender + Preferences
5. **Enter Festival Room** → See ONLY users who scanned same QR code

**Key Features:**
- ✅ **Isolated User Pools:** Coachella users only see Coachella users
- ✅ **No Switching:** Users locked into scanned festival
- ✅ **Sponsor Branding:** "Coachella 2024 - Sponsored by Heineken"
- ✅ **Direct Attribution:** Track exact matches per festival
- ✅ **QR Distribution:** Print on posters, wristbands, booth displays

### Phase 1: Fresh-Start Profile ✅

- **QR Scanner Screen**: First thing users see—scan festival QR code
- **Camera Check-in**: Take a fresh selfie (camera encouraged, gallery available)
- **Setup Form**: Name + Age + Gender + Looking For preferences
- **Main Dashboard**: Toggle ON/OFF for availability with festival banner
- **Gender Filtering**: Only see users matching your preferences

### Phase 2: Supabase Integration ✅

- **Festival Database**: `festivals` table with sponsor info and expiry dates
- **User-Festival Link**: Each user tied to one festival via `festival_id`
- **Photo Upload**: Selfies automatically upload to Supabase Storage
- **Festival Queries**: `find_users_in_festival()` SQL function
- **Location Tracking**: Automatic 60-second heartbeat (for future features)
- **Real-time Updates**: Subscribe to festival room changes
- **Auto-Wipe Logic**: Delete inactive users after 20 minutes

### Phase 3: Match System (Flicks) ✅

- **Visible Interest Signals**: Users who flicked you show green border + "Wants to meet"
- **Flick Button**: Send one-way interest signal to users in same festival
- **Visual Indicators**: Green card border and "Flick Back" button
- **Instant Matching**: Flick back triggers immediate Green Light
- **Green Light Screen**: Full-screen green with pulse animation + haptic feedback
- **Real-time Updates**: Interest signals update within 1 second
- **Tap to Undo**: Tap "FLICKED ✓" to undo your flick
- **Swipe to Hide**: Swipe left to hide profiles
- **Full-Screen Photos**: Tap photos to view full-screen
- **Festival Isolation**: Matches only within same festival

### Phase 4: Self-Destruct & Safety ✅

- **Time-Based Auto-Wipe**: Users deleted after 20 minutes of inactivity
- **Supabase Edge Function**: Automated cleanup every 5 minutes
- **Distance Dissolution**: Matches auto-delete when users move >100m apart
- **Heartbeat Integration**: Distance checks run every 60 seconds
- **Complete Cleanup**: Selfies, matches, and user data all removed

### Phase 5: Number Exchange "The Off-Ramp" ✅

- **Secure Phone Exchange**: After matching, exchange phone numbers
- **15-Minute TTL**: Numbers self-destruct after 15 minutes with countdown
- **Proximity Wipe**: Auto-deletes if users move >100m apart
- **Request/Accept Flow**: Both users must consent
- **Vault Screen**: Displays both numbers with quick actions (Call, Text, Save)
- **Privacy First**: No history kept after expiration
- **Optional Feature**: Phone number optional during setup

## Tech Stack

- **Frontend**: React Native with Expo
- **Navigation**: React Navigation (Native Stack)
- **Backend**: Supabase (PostgreSQL + PostGIS + Storage)
- **Real-time**: Supabase Subscriptions
- **Permissions**: Camera + Location
- **B2B Model**: QR code festival rooms

## Getting Started

### 1. Install Dependencies

Already done! Dependencies installed:
- expo-camera
- expo-location
- react-navigation
- @supabase/supabase-js
- expo-haptics
- @react-native-async-storage/async-storage

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
- Add festivals table and functions
- Configure storage for selfies
- Update your API credentials

Then run the festival rooms migration:
```sql
-- See supabase-festival-rooms-safe.sql
```

### 4. Test the Flow

1. **QR Scanner**: Tap "Skip (Dev Only)" to join `coachella2024` test festival
2. **Camera Screen**: Grant camera permission → Take selfie → Confirm
3. **Setup Screen**: Enter name, age, gender, preferences → Continue
4. **Dashboard**: See festival banner "Coachella 2024 - Sponsored by Heineken"
5. **Pull to Refresh**: Update your location and fetch festival users

## How It Works

### The QR-First Flow

1. **Download App**: Opens directly to QR Scanner
2. **Scan Festival QR**: Point camera at festival's unique QR code
   - Example: `coachella2024`, `tomorrowland2024`, `lollapalooza2024`
   - Validates festival is active and not expired
   - Stores festival ID in app
3. **Create Profile**: Take selfie → Enter info
4. **Join Festival Room**: Profile includes `festival_id` in database
5. **See Festival Users**: Dashboard shows only users with same `festival_id`
6. **Flick to Match**: Send interest signals to festival users
7. **Exchange Numbers**: Optional after matching
8. **Auto-Cleanup**: Profile deleted after 20 minutes of inactivity

### Database Architecture

```
festivals table
├── id (TEXT, primary key) - e.g., 'coachella2024'
├── name (TEXT) - 'Coachella 2024'
├── description (TEXT)
├── sponsor_name (TEXT) - 'Heineken'
├── is_active (BOOLEAN)
├── created_at (TIMESTAMP)
├── expires_at (TIMESTAMP)
└── max_participants (INTEGER)

users table (PostGIS-enabled)
├── id (TEXT, primary key)
├── name (TEXT)
├── age (INTEGER)
├── selfie_url (TEXT)
├── phone_number (TEXT) - Optional
├── gender (TEXT) - 'male', 'female', 'other'
├── looking_for (TEXT) - 'male', 'female', 'both'
├── festival_id (TEXT) → festivals(id) - KEY FIELD!
├── status (BOOLEAN) - ON/OFF
├── location (GEOGRAPHY) - Lat/long point
└── last_heartbeat (TIMESTAMP)

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
└── expires_at (TIMESTAMP)

Storage: selfies bucket (public, auto-delete policies)
```

### SQL Functions

```sql
-- Find users in same festival
find_users_in_festival(user_festival_id TEXT, current_user_id TEXT)

-- Validate festival code
get_festival_info(festival_code TEXT)

-- Auto-wipe inactive users
auto_wipe_inactive_users()

-- Check mutual flicks
check_mutual_flick(user_a TEXT, user_b TEXT)
```

### Key Features Implemented

✅ **QR-First Onboarding**: Scan festival code before creating profile
✅ **Festival Rooms**: Isolated user pools per festival (no GPS proximity matching)
✅ **Camera-First**: Fresh selfies only, gallery fallback available
✅ **Minimalist Profile**: Name + Age + Gender + Looking For preferences
✅ **Gender Filtering**: Only see users matching your preferences
✅ **Festival Banner**: Shows festival name + sponsor on every screen
✅ **No Switching**: Users locked into scanned festival (cannot change rooms)
✅ **Real-time Sync**: Supabase subscriptions for live festival user updates
✅ **Auto-Wipe**: 20-minute inactivity timeout (profiles self-destruct)
✅ **Pull-to-Refresh**: Manual refresh to reload festival users
✅ **Sign Out**: Complete data deletion (selfie + user record + matches)
✅ **Interactive UI**: Swipe to hide, tap to undo flick, full-screen photos
✅ **Visible Interest**: Green border on users who flicked you
✅ **Instant Matching**: Flick back triggers immediate Green Light screen

## B2B Model

### For Festival Sponsors

**Value Proposition:**
- ✅ **Direct Attribution**: Know exactly which matches came from YOUR festival
- ✅ **Isolated Pools**: Users only see attendees of your event
- ✅ **Brand Association**: "Sponsored by Heineken" on every match
- ✅ **Booth Traffic**: Number exchange drives foot traffic to sponsor booth
- ✅ **Real-time Metrics**: Dashboard shows active users, matches made, booth visits

**Distribution:**
- Print QR codes on: Posters, wristbands, tent cards, festival maps
- Display at: Entrance, main stage, food courts, bathrooms, bars
- Digital: Festival app, push notifications, social media, email
- Sponsor booth: Large QR code display, "Scan to meet people"

**Example Festivals:**
```
coachella2024    → Coachella 2024 (Sponsored by Heineken)
tomorrowland2024 → Tomorrowland 2024 (Sponsored by Red Bull)
lollapalooza2024 → Lollapalooza 2024 (Sponsored by Spotify)
```

See [QR_B2B_MODEL.md](./QR_B2B_MODEL.md) for complete B2B documentation.

## Design Philosophy

- **QR-First**: Scan festival code before profile creation
- **Minimalist UI**: Black, white, and signature green only
- **No Bios**: Just name, age, gender, and a fresh selfie
- **No Chat**: Tap-to-flick for mutual interest only
- **Festival Rooms**: Isolated user pools per QR code
- **Sponsor Branding**: Festival name + sponsor on every screen
- **Auto-Wipe**: Data self-destructs after 20 minutes of inactivity

## Project Structure

```
flick-app/
├── src/
│   ├── screens/
│   │   ├── QRScannerScreen.js   # FIRST SCREEN - Scan festival QR
│   │   ├── CameraScreen.js      # Selfie capture
│   │   ├── SetupScreen.js       # Name + Age + Gender + Preferences
│   │   ├── DashboardScreen.js   # Festival room with banner
│   │   ├── GreenLightScreen.js  # Match screen
│   │   └── VaultScreen.js       # Number exchange
│   ├── lib/
│   │   ├── supabase.js          # Supabase client config
│   │   ├── database.js          # DB queries
│   │   ├── festivals.js         # Festival operations (NEW!)
│   │   ├── location.js          # Location utilities
│   │   ├── userContext.js       # User state + heartbeat
│   │   ├── flicks.js            # Match operations
│   │   ├── vault.js             # Number exchange
│   │   └── matchCleanup.js      # Distance-based dissolution
│   └── constants/
│       └── theme.js             # Design system
├── supabase/
│   └── functions/
│       └── auto-cleanup/        # Edge Function for auto-wipe
├── website/
│   └── index.html               # B2B sponsor landing page
├── App.js                       # Navigation + UserProvider
├── app.json                     # Expo config + permissions
├── supabase-setup.sql           # Base DB schema
├── supabase-festival-rooms-safe.sql # Festival rooms migration
├── QR_B2B_MODEL.md              # Complete B2B documentation
├── SUPABASE_SETUP.md            # Backend setup guide
└── README.md                    # This file
```

## Website - B2B Sponsor Landing Page ✅

A complete sponsor-focused landing page at `/website/index.html`:

**Sections:**
- **Hero**: "Own the Moment of Connection" - Premium sponsor activation
- **Your Audience**: Festival singles looking to connect
- **Sponsor Advantage**: Heineken, Red Bull, Spotify brand examples
- **How It Works**: QR scan → Match → Branded Green Light → Booth traffic
- **Post-Event Analytics**: Connection Score, Booth Traffic, Brand Impressions
- **Video Demo**: Heineken Green Light activation in action

**Deployment:**
- Static HTML + Tailwind CSS
- Ready for Vercel/Netlify
- Mobile responsive

## What's Next

### Immediate
- [ ] **Test QR Flow**: Verify QR scanner → profile → festival room flow
- [ ] **Deploy Website**: Push to Vercel for sponsor showcase
- [ ] **Create Test QR Codes**: Generate QR codes for test festivals

### Future Enhancements
- [ ] **Sponsor Dashboard**: Real-time analytics for sponsors
- [ ] **Custom Branding**: Festival-specific colors and logos
- [ ] **Multi-Stage QR Codes**: Different codes per stage/area
- [ ] **Push Notifications**: Alert users when matched
- [ ] **App Store Submission**: iOS/Android release

## Testing the QR System

### Test Festival Codes (Dev Mode)

The app includes test festivals in the database:
- `coachella2024` - Coachella 2024 (Heineken)
- `tomorrowland2024` - Tomorrowland 2024 (Red Bull)
- `lollapalooza2024` - Lollapalooza 2024 (Spotify)

### Dev Mode Testing

1. Open app → QR Scanner appears
2. Tap "Skip (Dev Only)" button (only visible in development)
3. Automatically joins `coachella2024` festival
4. Complete profile creation
5. Dashboard shows "Coachella 2024 - Sponsored by Heineken"

### Multi-User Testing

1. Open two devices/simulators
2. Both scan same QR code (or use "Skip" to join same festival)
3. Create different profiles
4. Both should see each other on Dashboard
5. Test flicking and matching

### Creating Real QR Codes

```bash
# Using qrencode (install: brew install qrencode)
qrencode -o coachella2024.png "coachella2024"
qrencode -o tomorrowland2024.png "tomorrowland2024"

# Or use online generator:
# https://www.qr-code-generator.com/
# Content: coachella2024
```

### Adding New Festivals

```sql
INSERT INTO festivals (id, name, sponsor_name, is_active)
VALUES ('yourfestival2024', 'Your Festival 2024', 'Your Sponsor', true);
```

## Debugging

- **Check Supabase logs**: Dashboard → Logs
- **Monitor database**: Table Editor → users, festivals (watch records)
- **Storage inspector**: Storage → selfies (verify uploads)
- **React Native debugger**: Shake device → Enable Remote Debugging
- **QR Scanner**: Check camera permissions if QR scanner not working

## Documentation

- [QR_B2B_MODEL.md](./QR_B2B_MODEL.md) - Complete B2B model documentation
- [CLAUDE.md](./CLAUDE.md) - Full project specifications and development log
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Backend setup guide
- [START_APP.md](./START_APP.md) - How to start the app

---

**Built with React Native, Expo, and Supabase**
**B2B QR Room Model by flick**
