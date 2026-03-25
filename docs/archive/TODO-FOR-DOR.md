# TODO List for Dor - flick App

**Last Updated:** 2026-03-10
**Current Branch:** `fix/host-event-auth-flow`

---

## 🔥 Critical Issues (Fix First)

### 1. App Crash on QR Scan
**Priority:** URGENT
**Issue:** App crashes after users scan QR code and complete profile setup
**Status:** Debugging in progress
**Steps to Reproduce:**
1. Scan event QR code
2. Complete profile (name, age, gender, preferences)
3. App crashes on Dashboard screen

**Debug Steps:**
- Check Supabase Postgres logs for errors
- Check Supabase API logs for failed requests
- Test with two devices in same event
- Verify RLS policies allow guest users to read/write

**Files to Check:**
- `src/screens/DashboardScreen.js:258` - `findUsersInFestival()` call
- `src/lib/festivals.js:41` - RPC call to `find_users_in_festival`
- Supabase RLS policies on `users` and `festivals` tables

---

### 2. Users Can't See Each Other in Same Event
**Priority:** URGENT
**Issue:** Two users scan same QR code but don't see each other on radar
**Possible Causes:**
- Gender preference mismatch (most common)
- RLS policy blocking reads
- Database function filtering incorrectly
- Users not in same festival_id

**Debug Steps:**
1. Check console logs on both devices:
   ```
   📍 YOUR LOCATION: [lat, lng]
   🎪 YOUR FESTIVAL: [festival-id]
   Compatible users in festival: [count]
   ```
2. Verify both users have same `festival_id` in database
3. Check gender preferences are compatible:
   - Male looking for Female + Female looking for Male = ✅
   - Male looking for Female + Male looking for Female = ❌
4. Test RPC function directly in Supabase SQL Editor

**Files to Check:**
- `src/lib/festivals.js:41-60` - `findUsersInFestival()`
- Supabase function: `find_users_in_festival` (check filters)

---

## 🚧 In Progress

### 3. Google Sign-In DEVELOPER_ERROR (Android)
**Priority:** HIGH
**Issue:** Google Sign-In fails on Android with DEVELOPER_ERROR
**Solution:** Documented in `GOOGLE-SIGNIN-FIX.md`

**Steps to Fix:**
1. Run `eas credentials -p android` to get SHA-1 fingerprint
2. Go to Google Cloud Console: https://console.cloud.google.com/apis/credentials
3. Create Android OAuth Client with:
   - Package name: `com.michaellevinger.flick`
   - SHA-1 from step 1
4. Wait 5-10 minutes for propagation
5. Test Google Sign-In again

**Files:**
- `GOOGLE-SIGNIN-FIX.md` - Complete instructions
- `.env` - Already configured with Web Client ID
- `src/screens/HostAuthScreen.js:71-106` - Google Sign-In implementation

---

### 4. Apple Sign-In (iOS)
**Priority:** MEDIUM
**Status:** Not tested yet

**Steps:**
1. Configure Apple OAuth in Supabase dashboard
2. Add Apple credentials from Apple Developer Console
3. Build iOS app with EAS
4. Test Apple Sign-In flow

**Files:**
- `src/screens/HostAuthScreen.js:108-144` - Apple Sign-In implementation

---

## ✅ Recently Completed

- [x] Email/password authentication for host accounts
- [x] Host profile creation with RLS policies
- [x] Database migration for `host_profiles` and `auth_host_id`
- [x] Event creation flow for authenticated hosts
- [x] Google/Apple Sign-In UI (implementation done, OAuth config pending)

---

## 📋 Testing Tasks

### 5. Test Host Authentication Flow (Android)
**Priority:** MEDIUM
**Status:** Pending Google OAuth fix

**Test Cases:**
1. Email/Password Sign Up
   - Create new account with email/password
   - Verify "Account Created" alert
   - Verify host profile created in Supabase
   - Verify navigation to CreateEvent screen
2. Email/Password Sign In
   - Sign in with existing credentials
   - Verify navigation to CreateEvent screen
3. Error Cases
   - Invalid email format
   - Short password (< 8 chars)
   - Wrong credentials
   - Duplicate email (already exists)
4. Google Sign-In (after OAuth fix)
5. Create Event
   - Fill event details
   - Generate QR code
   - Verify event in Supabase with `auth_host_id`

---

### 6. Test Host Authentication Flow (iOS)
**Priority:** LOW
**Status:** Pending iOS build

**Test Cases:**
- Same as Android (#5)
- Plus: Apple Sign-In flow

---

### 7. Verify Guest Flow Unchanged
**Priority:** MEDIUM
**Status:** FAILING (crash issue)

**Test Cases:**
1. Guest QR Scan Flow
   - Scan event QR code
   - Complete profile setup (name, age, gender, preferences)
   - See Dashboard with other users in same event
   - Flick users to match
2. Verify guest users don't need authentication
3. Verify guest profiles don't interfere with host profiles

**Current Issue:** App crashes after profile setup (see #1)

---

## 🎯 Feature Requests (Future Work)

### 8. QR Scanner App Download Redirect
**Priority:** MEDIUM
**User Request:** "for the scanners. i want when they scan the QR - to direct them to download the app if it's not downloaded"

**Solution Options:**
1. **Deep Links + Web Fallback:**
   - QR code links to: `https://helloflick.com/event/[code]`
   - If app installed: Opens app directly
   - If not installed: Shows web page with App Store / Play Store buttons

2. **Smart App Banners:**
   - Add iOS Smart App Banner to website
   - Add Android App Links

**Files to Create:**
- `website/event/[code].html` - Landing page for non-app users
- Update `app.json` with deep linking configuration

---

### 9. Push Notifications
**Priority:** LOW
**Status:** Not started

**Requirements:**
- Match notifications
- Message notifications
- Event reminders

**Implementation:**
- Use Expo Notifications
- Set up Firebase Cloud Messaging (Android)
- Set up APNs (iOS)

---

### 10. App Store Submission
**Priority:** MEDIUM
**Status:** Pending testing completion

**Prerequisites:**
- All critical bugs fixed (#1, #2)
- Google Sign-In working (#3)
- Testing complete (#5, #6, #7)

**Steps:**
1. iOS App Store
   - Create app listing
   - Prepare screenshots
   - Write app description
   - Submit for review
2. Google Play Store
   - Create app listing
   - Prepare screenshots
   - Write app description
   - Submit for review

**Resources:**
- `BUILD-AND-SHARE.md` - Build instructions

---

## 🗂️ Project Structure Reference

### Key Files

**Authentication:**
- `src/lib/authContext.js` - Host authentication context
- `src/hooks/useAuth.js` - Auth hook
- `src/screens/HostAuthScreen.js` - Host sign-in/sign-up UI
- `migrations/add-host-auth-idempotent.sql` - Database schema
- `migrations/fix-host-profiles-insert-policy.sql` - RLS fix

**Guest Flow:**
- `src/screens/QRScannerScreen.js` - QR code scanner
- `src/screens/NameScreen.js` - Profile setup
- `src/screens/BirthdayScreen.js` - Age input
- `src/screens/GenderScreen.js` - Gender selection
- `src/screens/LookingForScreen.js` - Preference selection
- `src/screens/DashboardScreen.js` - Main radar/user list

**Event Management:**
- `src/screens/CreateEventScreen.js` - Event creation
- `src/screens/EventSuccessScreen.js` - QR code display
- `src/lib/events.js` - Event operations
- `src/lib/festivals.js` - Festival/event queries

**Database:**
- `src/lib/database.js` - User operations
- `src/lib/supabase.js` - Supabase client
- `supabase-setup.sql` - Complete schema (legacy)

**Matching:**
- `src/lib/flicks.js` - Flick/match operations
- `src/screens/MatchesScreen.js` - Matches list
- `src/screens/ChatScreen.js` - 1-on-1 chat

---

## 🔧 Development Setup

**Prerequisites:**
- Node.js and npm
- Expo CLI
- EAS CLI
- Android Studio (for Android builds)
- Xcode (for iOS builds, macOS only)

**Environment Variables (.env):**
```
EXPO_PUBLIC_SUPABASE_URL=https://oithyuuztrmohcbfglrh.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[get from Supabase]
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=1289730z720-dge6e3gq8jqrr4f8bc4ucr23qd99dcde.apps.googleusercontent.com
```

**Build Commands:**
```bash
# Install dependencies
npm install

# Run on Expo Go (development)
npx expo start

# Build Android APK
eas build --platform android --profile preview

# Build iOS
eas build --platform ios --profile preview
```

---

## 📚 Documentation

- `CLAUDE.md` - Complete project overview
- `README.md` - Architecture and features
- `QUICKSTART.md` - Setup guide
- `SUPABASE_SETUP.md` - Backend setup
- `BUILD-AND-SHARE.md` - Build and distribution guide
- `GOOGLE-SIGNIN-FIX.md` - Fix for Google OAuth error
- `docs/plans/2026-03-08-feat-email-password-authentication-plan.md` - Email/password auth spec
- `docs/plans/2026-03-07-fix-host-event-authentication-flow-plan.md` - Host auth flow spec

---

## 🐛 Known Issues

1. **App crashes after QR scan** (Critical - see #1)
2. **Users can't see each other in same event** (Critical - see #2)
3. **Google Sign-In DEVELOPER_ERROR on Android** (Medium - see #3)
4. **Apple Sign-In not configured** (Low - see #4)

---

## 💡 Tips

- Always test on real devices, not just simulators
- Check Supabase logs when debugging database issues
- Use `console.log()` liberally - check with shake gesture on device
- Pull-to-refresh on Dashboard to reload users
- RLS policies can be tricky - test with SQL Editor first
- EAS builds take 5-10 minutes - be patient

---

**Questions?** Check the docs or ask Michael.
