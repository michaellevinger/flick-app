# App Store Submission Checklist - flick

## 🔍 Pre-Flight Checks (Run Before Building)

### 1. Code Quality & Functionality
- [ ] **All features work end-to-end** (QR scan, profile creation, radar, flicks, chat)
- [ ] **No console errors or warnings** in production build
- [ ] **No hardcoded test data** (verified: test-festival is dev-only with __DEV__ guards)
- [ ] **Location permissions work** on both iOS and Android
- [ ] **Camera permissions work** for selfie capture and QR scanning
- [ ] **Network requests handle failures** gracefully (offline mode, timeouts)
- [ ] **Images load correctly** (Supabase storage URLs accessible)
- [ ] **Deep links work** (if applicable)

### 2. Privacy & Permissions (App Store Requirements)

**Required Permission Strings (iOS - Info.plist / Android - AndroidManifest.xml):**
- [ ] **NSCameraUsageDescription**: "flick needs camera access to take your profile photo and scan event QR codes"
- [ ] **NSPhotoLibraryUsageDescription**: "flick needs photo library access to select profile photos"
- [ ] **NSLocationWhenInUseUsageDescription**: "flick uses your location to show you singles nearby at your event (within 500m)"

**Privacy Policy (REQUIRED):**
- [ ] **Create privacy policy** hosted at public URL
- [ ] **Add to app.json**: `"privacyPolicyUrl": "https://helloflick.com/privacy"`
- [ ] **Include in app settings** or about screen
- [ ] **Cover**: Location data, camera/photos, user profiles, chat messages, data deletion

**Data Collection Disclosure:**
- [ ] Location (precise) - Used for proximity matching
- [ ] Photos - Profile pictures
- [ ] User Content - Name, age, gender, chat messages
- [ ] No data sold to third parties
- [ ] Data deleted on account deletion

### 3. Content & Design (Rejection Prevention)

**iOS App Store Guidelines:**
- [ ] **No adult/explicit content** in screenshots or app icon
- [ ] **Age rating appropriate** (17+ for dating apps)
- [ ] **No misleading claims** ("guaranteed matches", etc.)
- [ ] **All UI elements functional** (no placeholder buttons)
- [ ] **Handles empty states** gracefully (no users nearby, no matches)
- [ ] **Error messages are helpful** (not just "Error occurred")

**Android Play Store Guidelines:**
- [ ] **Target API Level 34** (Android 14) - Required as of Aug 2024
- [ ] **64-bit support** enabled
- [ ] **No dangerous permissions** without justification
- [ ] **Content rating questionnaire** completed honestly

### 4. App Metadata (Required for Submission)

**App Information:**
- [ ] **App Name**: flick - Turn a Look into Hello
- [ ] **Subtitle/Tagline**: "Meet singles at your event" (30 chars max for iOS)
- [ ] **Description**: Write compelling copy (see template below)
- [ ] **Keywords** (iOS): dating, events, weddings, singles, nearby, local, matchmaking
- [ ] **Category**: Social Networking (primary), Lifestyle (secondary)
- [ ] **Age Rating**: 17+ (Dating apps category)

**Visual Assets:**
- [ ] **App Icon** (1024x1024px) - No transparency, no rounded corners
- [ ] **Screenshots** (Required):
  - iOS: 6.7" (iPhone 15 Pro Max), 5.5" (iPhone 8 Plus)
  - Android: Phone (16:9), Tablet (optional)
  - Show: QR scan, profile, radar, matches, chat
- [ ] **Preview Video** (optional but recommended) - 15-30 seconds

### 5. Legal & Compliance

- [ ] **Terms of Service** created and linked
- [ ] **Privacy Policy** created and linked (GDPR/CCPA compliant)
- [ ] **Age verification** (18+ only) - Implemented in SetupScreen
- [ ] **User reporting** - Implemented
- [ ] **User blocking/unmatching** - Implemented
- [ ] **Account deletion** - Implemented (Clear Cache + database deletion)
- [ ] **COPPA compliance** (no users under 13, enforced at 18+)

### 6. Testing Requirements

**iOS TestFlight (Recommended):**
- [ ] **Submit to TestFlight** first (internal or external testing)
- [ ] **Test on real devices** (iPhone 12+, iOS 15+)
- [ ] **Test all features** with beta testers (5-10 people)
- [ ] **Collect feedback** and fix critical bugs
- [ ] **Wait 24-48 hours** before App Store submission

**Android Internal Testing:**
- [ ] **Upload to Internal Testing** track first
- [ ] **Test on multiple devices** (Samsung, Pixel, different Android versions)
- [ ] **Check APK size** (<150MB recommended)

### 7. Performance & Stability

- [ ] **App launches in <3 seconds** on modern devices
- [ ] **No crashes** during normal use
- [ ] **Memory usage reasonable** (<200MB for mobile app)
- [ ] **Network timeouts handled** (Supabase requests don't hang)
- [ ] **Images optimized** (compressed, lazy loaded)
- [ ] **Battery usage reasonable** (location updates every 60s, not continuous)

### 8. Supabase Backend Checks

- [ ] **Production database** has proper indexes
- [ ] **Row Level Security (RLS)** policies enabled (security!)
- [ ] **API rate limits** configured (prevent abuse)
- [ ] **Storage bucket** has size limits (prevent storage abuse)
- [ ] **Edge Functions** deployed (auto-cleanup working)
- [ ] **Backup strategy** in place (Supabase automatic backups enabled)

---

## 📝 App Description Template

**Short Description (80 chars):**
"Meet singles at your event. Scan the QR code, flick to match, chat instantly."

**Full Description:**

```
flick - Turn a Look into Hello

Meet singles at weddings, festivals, and events. No swiping through strangers — just real people, right there with you.

HOW IT WORKS
1. Scan the event QR code
2. Create your profile (photo + name)
3. See singles within 500 meters
4. Flick to match
5. Chat when you both flick

FEATURES
✓ Event-Based Matching - Only see people at your event
✓ Real Proximity - Find singles within 500m
✓ Instant Messaging - Chat when you match
✓ Privacy First - Your location is never shown
✓ Ladies First - Women control the conversation (straight matches)

PERFECT FOR
• Wedding guests
• Festival attendees
• Corporate events
• Social gatherings

WHY FLICK?
Dating apps are exhausting. flick brings back real-world romance. That cute person across the room? flick helps you say hello.

PRIVACY & SAFETY
• 18+ only
• Report & block users
• Delete your account anytime
• Location only used for proximity (never shared)
• Read our privacy policy: helloflick.com/privacy

Questions? hello@helloflick.com
```

---

## 🚀 Build & Submission Commands

### Step 1: Configure EAS (First Time Only)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure
```

### Step 2: Build for iOS (TestFlight First)

```bash
# Build for iOS (production)
eas build --platform ios --profile production

# Wait for build to complete (15-30 minutes)
# Download IPA when ready
```

### Step 3: Submit to TestFlight

```bash
# Submit to TestFlight (requires Apple Developer account)
eas submit --platform ios

# OR manually upload IPA via Xcode → Transporter app
```

### Step 4: Build for Android

```bash
# Build for Android (production)
eas build --platform android --profile production

# Wait for build to complete (10-20 minutes)
# Download AAB when ready
```

### Step 5: Submit to Google Play Console

```bash
# Submit to Google Play (requires Play Console account)
eas submit --platform android

# OR manually upload AAB via Play Console
```

---

## ⚠️ Common Rejection Reasons & How to Avoid

### iOS App Store

1. **Incomplete Information** → Fill out all metadata fields
2. **Poor Privacy Policy** → Use template, host at helloflick.com/privacy
3. **Broken Features** → Test thoroughly on real device
4. **Misleading App Name** → "flick" is fine, don't add "Best Dating App"
5. **Age Rating Mismatch** → Select 17+ for dating apps
6. **Location Permission** → Clearly explain why you need it (proximity matching)

### Google Play Store

1. **Target API Too Old** → Must target API 34 (Android 14)
2. **Missing Content Rating** → Fill out questionnaire honestly (17+)
3. **Privacy Policy Missing** → Include link in Play Console listing
4. **Dangerous Permissions** → Justify location/camera in description
5. **64-bit Requirement** → Ensure enabled in eas.json

---

## 📋 Pre-Submission Testing Checklist

Run these tests before submitting:

### Critical Flows
- [ ] Scan QR code (real QR, not skip button)
- [ ] Create profile with photo
- [ ] See nearby users (with test users in same event)
- [ ] Send flick
- [ ] Receive flick
- [ ] Chat (text + images)
- [ ] Unmatch
- [ ] Sign out

### Edge Cases
- [ ] No internet connection
- [ ] Poor network (throttle in dev tools)
- [ ] Location disabled
- [ ] Camera denied
- [ ] No users nearby
- [ ] Invalid QR code
- [ ] Festival not found

---

## 🎯 Launch Strategy Recommendation

**Phase 1: TestFlight Beta (1-2 weeks)**
1. Submit to TestFlight (iOS) + Internal Testing (Android)
2. Invite 10-20 beta testers
3. Test at a real wedding/event
4. Collect feedback, fix bugs
5. Iterate 1-2 times

**Phase 2: App Store Submission**
1. Address all beta feedback
2. Create polished screenshots/video
3. Write compelling app description
4. Submit to both stores simultaneously
5. Expect 1-3 day review (iOS), 1-7 days (Android)

**Phase 3: Post-Launch**
1. Monitor crash reports
2. Watch Supabase usage/costs
3. Respond to reviews quickly
4. Plan v1.1 with user feedback

---

## 💰 Costs to Consider

- **Apple Developer Account**: $99/year (REQUIRED for iOS)
- **Google Play Console**: $25 one-time (REQUIRED for Android)
- **Supabase (Pro)**: $25/month (recommended for production)
- **EAS Build**: Free tier (slower), or $29/month (unlimited builds)
- **Domain (helloflick.com)**: Already purchased ✓
- **Total Year 1**: ~$200-400

---

## 🆘 If You Get Rejected

**Don't panic!** 50% of first-time submissions get rejected.

1. **Read rejection email carefully** - Apple/Google explains exactly what's wrong
2. **Fix the issue** - Usually minor (missing permission text, wrong age rating)
3. **Resubmit immediately** - Don't wait
4. **Appeal if unfair** - Use App Review Board (rare but possible)

**Most common fixes:**
- Add missing permission usage descriptions
- Update privacy policy link
- Change age rating to 17+
- Add content warning for dating app

---

## ✅ Quick Start: Your Next Steps

1. **Check app.json configuration** (permissions, version, bundle IDs)
2. **Create privacy policy** page at helloflick.com/privacy
3. **Sign up for developer accounts** (Apple $99, Google $25)
4. **Install EAS CLI**: `npm install -g eas-cli`
5. **Configure EAS**: `eas build:configure`
6. **Build iOS**: `eas build --platform ios --profile production`
7. **Submit to TestFlight**: `eas submit --platform ios`
8. **Repeat for Android**

Good luck! 🚀
