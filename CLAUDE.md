# Project HeyU
**Mission:** Eliminate approach anxiety via a 100m digital "Green Light."

## 🎯 Project Status

### ✅ Completed Features
- [x] Fresh-Start Profile (Camera + Name + Age + Optional Phone)
- [x] Supabase backend integration (PostGIS + Storage)
- [x] 100M Radar with real-time proximity detection
- [x] Location tracking with 60s heartbeat
- [x] Auto-activation (status defaults to ON)
- [x] Pull-to-refresh for radar updates
- [x] Sign out with complete data deletion
- [x] The Nudge & Green Light (mutual match detection)
- [x] Haptic feedback for matches
- [x] Real-time nudge subscriptions
- [x] Auto-wipe automation (Supabase Edge Function)
- [x] Distance-based match dissolution
- [x] Number Exchange "The Off-Ramp" (15-min TTL, proximity wipe)
- [x] Request/Accept flow for number sharing
- [x] Vault Screen with countdown timer

### 🚧 In Progress - Supabase Setup
- [x] Project created (oithyuuztrmohcbfglrh.supabase.co)
- [x] .env file configured with credentials
- [x] PostGIS extension manually enabled
- [ ] Base schema SQL execution (users, nudges, functions)
- [ ] Exchange schema SQL execution (exchanges table)
- [ ] Storage bucket creation (selfies)
- [ ] Edge Function deployment (auto-cleanup)

### 🔮 Future
- [ ] Push notifications
- [ ] Polish & testing (Task #10)

---

## 🛠 Core Tech Stack
- **Frontend:** React Native (Expo) - *Native required for background GPS/Haptics*
- **Backend:** Supabase (Auth + Real-time + Postgres + PostGIS)
- **State Management:** React Context (`UserContext`)
- **Permissions:** Camera + Location (foreground)

---

## 🏗 Feature Specifications

### 1. The "Fresh-Start" Profile ✅ COMPLETE
**Status:** Implemented in `src/screens/CameraScreen.js` and `src/screens/SetupScreen.js`

- **The Selfie:** Uses `expo-camera`. Photos are NEVER saved to device gallery.
  - Front-facing camera only
  - No gallery access
  - Retake option before confirming
  - Uploads directly to Supabase Storage (`selfies` bucket)

- **Onboarding:** Two screens:
  1. Camera Screen: Capture selfie
  2. Setup Screen: Name (first name only) + Age (18+ validation)

- **Auto-Activation:** Toggle defaults to **ON** immediately after profile creation
  - Implemented in `src/lib/userContext.js` → `createUser()`
  - Location tracking starts automatically
  - Heartbeat begins immediately

**Files:**
- `src/screens/CameraScreen.js` - Selfie capture with permissions
- `src/screens/SetupScreen.js` - Profile form → Supabase
- `src/lib/userContext.js` - User creation logic

---

### 2. The 100M Radar ✅ COMPLETE
**Status:** Implemented in `src/screens/DashboardScreen.js`

- **Privacy First:** No maps. No GPS coordinates shown to users.
  - Only distance in meters (e.g., "45m away")
  - No exact locations visible to users

- **Logic:** Fetch users where distance $d \le 100m$
  - PostGIS `ST_DWithin` for efficient geospatial queries
  - Accounts for Earth's curvature (GEOGRAPHY type)
  - Function: `find_nearby_users()` in `supabase-setup.sql`

- **Sorting:** List view sorted by "Closest First"
  - SQL ORDER BY `distance_meters ASC`
  - Real-time updates via Supabase subscriptions

- **Heartbeat:** Update user location every 60s while status is **ON**
  - Implemented in `src/lib/userContext.js`
  - `setInterval` runs `updateLocation()` + `updateHeartbeat()`
  - Automatically stops when status is OFF

**Files:**
- `src/screens/DashboardScreen.js` - Main radar UI
- `src/lib/database.js` - `findNearbyUsers()` function
- `src/lib/location.js` - Location utilities
- `src/lib/userContext.js` - Heartbeat system

**Database:**
- `users` table with PostGIS `location` column (GEOGRAPHY POINT)
- Index: `users_location_idx` (GIST index for performance)
- SQL function: `find_nearby_users(user_lat, user_lng, radius_meters, current_user_id)`

---

### 3. The Nudge & Green Light (REVISED) ✅ COMPLETE
**Status:** Fully implemented with visible interest signals

- **The Nudge:** A visible signal of interest
  - When User A nudges User B, User B's UI reflects this on User A's card
  - User B sees User A's card with green border + "Wants to meet" label
  - Optional: Push notification "Someone nearby nudged you!"

- **Radar Feed States:**
  - **Standard Card:** Gray/neutral appearance
  - **"They Nudged You" Card:**
    - 3px Action Green border
    - "Wants to meet" label
    - Makes it clear who's interested

- **The Match:** If a user nudges a card that already has "Wants to meet" label → Immediate Green Light
  - Both users see full-screen green pulse simultaneously
  - Heavy haptic feedback (3-pulse sequence)
  - Display matched user's photo and name

- **Haptics:** Three-stage vibration on match
  - Success notification → Heavy impact → Medium impact

**Implementation Complete:**

✅ **`src/lib/nudges.js`** - All nudge operations:
   - `sendNudge(fromUserId, toUserId)` - Send one-way nudge
   - `getNudgesForUser(userId)` - Get incoming nudges
   - `checkMutualMatch(userAId, userBId)` - Check if both nudged
   - `subscribeToNudges(userId, callback)` - Real-time incoming nudges
   - `getMatchedUserInfo(userId)` - Fetch matched user details

✅ **`src/screens/GreenLightScreen.js`**:
   - Full-screen green background (#00FF00) with pulse animation
   - Heavy haptic feedback (3-pulse sequence)
   - Displays matched user's photo and name
   - "Back to Radar" button
   - Modal presentation style

✅ **`src/screens/DashboardScreen.js`**:
   - **Visual Interest Indicators:**
     - Cards with green border when they've nudged you
     - "Wants to meet" label on interested users
     - Makes interest signals visible in the feed
   - **Smart Nudge Logic:**
     - Nudging someone who already nudged you → Instant Green Light
     - "Nudge Back" button for users who nudged you
     - Regular "Nudge" for others
   - **Real-time Updates:**
     - Subscribes to incoming nudges
     - UI updates immediately when someone nudges you
     - Tracks both sent and received nudges

**Database:**
- `nudges` table with UNIQUE constraint on (from_user_id, to_user_id)
- SQL function: `check_mutual_nudge(user_a, user_b) RETURNS BOOLEAN`

**UX Flow:**
1. User A nudges User B → User A sees "Nudged ✓"
2. User B's feed updates → User A's card shows green border + "Wants to meet"
3. User B nudges User A's card → Immediate Green Light for both!

**Testing:**
See [TESTING_NUDGE_SYSTEM.md](./TESTING_NUDGE_SYSTEM.md) for complete test scenarios.

---

### 4. The "Off-Ramp" (Number Exchange) 🔮 FUTURE
**Status:** Future feature (after Nudge system)

- **Trigger:** Button appears only inside an active Green Light match
- **Mechanism:** Request → Accept → Display Number
  - User A requests number
  - User B gets notification → Accept/Decline
  - On accept: both see each other's numbers

- **Ephemeral:** Display number for 15 minutes only, then wipe from state
  - Store in `matches` table with `expires_at` timestamp
  - Client-side countdown timer
  - Auto-navigate away when expired

**Implementation Notes:**
- Add `phone_number` field to `users` table (optional, encrypted)
- Create `matches` table to track active matches
- Add push notifications (Expo Notifications)

---

### 5. The Self-Destruct (Safety) ✅ COMPLETE
**Status:** Fully implemented

- **TTL (Time to Live):** Profiles expire after 20 minutes of inactivity
  - SQL function: `auto_wipe_inactive_users()` ✅
  - Supabase Edge Function: `auto-cleanup` ✅
  - Scheduled via pg_cron: Every 5 minutes ✅
  - Deletes users where `last_heartbeat < NOW() - INTERVAL '20 minutes'`

- **Distance Exit:** If user moves >100m from a match, the match dissolves
  - Implemented in `src/lib/matchCleanup.js` ✅
  - Runs during every heartbeat (60 seconds) ✅
  - Checks distance to all mutual matches ✅
  - Auto-deletes nudges when distance > 100m ✅

**Implementation Complete:**

✅ **Supabase Edge Function** (`supabase/functions/auto-cleanup/index.ts`):
   - Calls `auto_wipe_inactive_users()` SQL function
   - Returns deleted count and timestamp
   - Scheduled to run every 5 minutes via pg_cron
   - Full error handling and logging

✅ **Distance-Based Dissolution** (`src/lib/matchCleanup.js`):
   - `cleanupDistantMatches()` - Check and delete distant matches
   - Integrated into heartbeat in `userContext.js`
   - Calculates distance to all mutual matches
   - Deletes both directions of nudge if > 100m

**Setup Guide:**
See [AUTO_WIPE_SETUP.md](./AUTO_WIPE_SETUP.md) for complete deployment instructions.

---

## 🎨 UI/UX Guidelines

### Color Palette
- **Black:** `#000000` (primary text, borders)
- **White:** `#FFFFFF` (backgrounds, buttons)
- **Action Green:** `#00FF00` (CTAs, status indicators, matches)
- **Gray:** `#808080` (secondary text, disabled states)
- **Gray Light:** `#F5F5F5` (inactive backgrounds)

**Implementation:** See `src/constants/theme.js`

### Style
- **Brutalist/Minimalist:** Bold typography, high contrast, no gradients
- **No bios:** Name + Age only
- **No "About Me" sections:** Let proximity speak
- **Direct CTAs:** "Nudge" not "Send Interest"

### Feedback
- **Visibility Status:**
  - ON: Green glow around profile photo, green pulse indicator
  - OFF: Grayscale UI, "You're invisible" message
- **Loading States:** ActivityIndicator with green color
- **Pull-to-Refresh:** Green tint color

---

## 📁 Project Structure

```
spot-app/
├── src/
│   ├── screens/
│   │   ├── CameraScreen.js       # ✅ Selfie capture
│   │   ├── SetupScreen.js        # ✅ Profile creation
│   │   ├── DashboardScreen.js    # ✅ Main radar view + nudges
│   │   └── GreenLightScreen.js   # ✅ Match screen with haptics
│   ├── lib/
│   │   ├── supabase.js           # ✅ Supabase client
│   │   ├── database.js           # ✅ DB operations
│   │   ├── location.js           # ✅ Location utilities
│   │   ├── userContext.js        # ✅ User state + heartbeat + cleanup
│   │   ├── nudges.js             # ✅ Nudge operations
│   │   └── matchCleanup.js       # ✅ Distance-based dissolution
│   ├── components/
│   │   └── (shared components)   # 🔮 As needed
│   └── constants/
│       └── theme.js              # ✅ Design system
├── supabase/
│   └── functions/
│       └── auto-cleanup/         # ✅ Edge Function for auto-wipe
├── supabase-setup.sql            # ✅ Complete schema
├── App.js                        # ✅ Navigation + context
├── app.json                      # ✅ Expo config
├── CLAUDE.md                     # 📍 This file
├── README.md                     # ✅ Documentation
├── QUICKSTART.md                 # ✅ Setup guide
├── SUPABASE_SETUP.md             # ✅ Backend setup
├── TESTING_NUDGE_SYSTEM.md       # ✅ Nudge testing guide
└── AUTO_WIPE_SETUP.md            # ✅ Auto-wipe setup guide

✅ = Complete
🚧 = In Progress
🔮 = Future
```

---

## 🗄 Database Schema (Supabase/PostgreSQL)

**Location:** See `supabase-setup.sql` for complete implementation

### `users` table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,                    -- Custom ID (user_<timestamp>_<random>)
  name TEXT NOT NULL,                     -- First name only
  age INTEGER NOT NULL,                   -- 18+ validation in app
  selfie_url TEXT,                        -- Supabase Storage URL
  status BOOLEAN DEFAULT true,            -- ON/OFF toggle
  location GEOGRAPHY(POINT, 4326),        -- PostGIS lat/long
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX users_location_idx ON users USING GIST(location);
CREATE INDEX users_status_idx ON users(status);
CREATE INDEX users_heartbeat_idx ON users(last_heartbeat);
```

### `nudges` table
```sql
CREATE TABLE nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  to_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)       -- Prevent duplicate nudges
);

-- Indexes
CREATE INDEX nudges_from_user_idx ON nudges(from_user_id);
CREATE INDEX nudges_to_user_idx ON nudges(to_user_id);
```

### SQL Functions

**Find Nearby Users:**
```sql
CREATE OR REPLACE FUNCTION find_nearby_users(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters INTEGER,
  current_user_id TEXT
)
RETURNS TABLE (id TEXT, name TEXT, age INTEGER, selfie_url TEXT, distance_meters INTEGER)
```

**Check Mutual Match:**
```sql
CREATE OR REPLACE FUNCTION check_mutual_nudge(user_a TEXT, user_b TEXT)
RETURNS BOOLEAN
```

**Auto-Wipe Inactive:**
```sql
CREATE OR REPLACE FUNCTION auto_wipe_inactive_users()
RETURNS INTEGER
```

---

## 🚀 Development Workflow

### Starting a New Feature

1. **Read this file** to understand current state
2. **Check task list** (see README.md or run `/tasks` in Claude Code)
3. **Update status** when starting work
4. **Follow existing patterns** in codebase

### Testing a Feature

1. **Unit logic:** Test functions in isolation
2. **Integration:** Test with real Supabase data
3. **Location mocking:** Use simulator location controls
4. **Multi-device:** Test with 2 simulators/devices

### Before Committing

1. **Check syntax:** Ensure no console errors
2. **Test flow:** Complete user journey works
3. **Update docs:** Update CLAUDE.md status if needed
4. **Clean imports:** Remove unused imports

---

## 🎯 Next Steps: Polish & Testing (Task #10)

Now that all core features are complete, focus on polish and real-world testing:

### Polish Tasks
- [ ] Add loading states and error boundaries
- [ ] Improve animation smoothness
- [ ] Add empty state illustrations
- [ ] Optimize image loading and caching
- [ ] Add retry logic for failed requests
- [ ] Implement offline detection

### Testing Tasks
- [ ] Test with 5+ real users simultaneously
- [ ] Test edge cases (airplane mode, poor connection, etc.)
- [ ] Verify auto-wipe works in production
- [ ] Test distance dissolution with real movement
- [ ] Performance testing with many nearby users
- [ ] Battery usage optimization

### Optional Enhancements
- [ ] Add sound effects for matches
- [ ] Implement push notifications (Expo Notifications)
- [ ] Add onboarding tutorial
- [ ] Create app icon and splash screen
- [ ] Add analytics (privacy-friendly)

---

## 📝 Prompt Templates for Claude Code

### Implementing a New Feature
```
Claude, read CLAUDE.md section [X]. Implement the [Feature Name] following the acceptance criteria listed. Use the existing patterns from [similar file].
```

### Debugging
```
Claude, the [feature] is not working as expected. Check CLAUDE.md requirements for [feature] and compare with the current implementation in [file]. What's missing?
```

### Code Review
```
Claude, review the [feature] implementation against CLAUDE.md. Does it meet all acceptance criteria? Are there any edge cases we missed?
```

### Testing
```
Claude, write a test scenario to verify that [specific behavior from CLAUDE.md] works correctly. Include setup, action, and expected result.
```

---

## 🔐 Security & Privacy Notes

- **No passwords:** Anonymous sessions only
- **No persistent IDs:** User IDs are session-based
- **Ephemeral data:** Auto-wipe after 20 minutes
- **No location history:** Only current location stored
- **Public selfies:** Supabase Storage bucket is public (by design)
- **No analytics:** No tracking beyond app functionality

---

## 📞 Support & Resources

- **Supabase Docs:** https://supabase.com/docs
- **Expo Docs:** https://docs.expo.dev
- **PostGIS Reference:** https://postgis.net/docs/
- **Project README:** See README.md for architecture details
- **Quick Setup:** See QUICKSTART.md for 10-minute setup

---

**Last Updated:** 2026-02-01
**Version:** 0.2.0 (Supabase Integration Complete)
