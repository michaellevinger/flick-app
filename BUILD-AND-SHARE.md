# Build & Share Flick App - Complete Guide

## Overview

3 ways to share your app with friends for testing:

1. **Expo Go** (2 mins) - Easiest, requires Expo Go app
2. **APK Build** (20 mins) - Real Android app, share file directly
3. **TestFlight** (1-2 days) - Professional iOS testing

---

## Option 1: Expo Go (Quickest)

### Setup (One-time)
Already done! Your server is running with tunnel mode.

### Share With Friends

**Step 1:** Get the shareable URL from your terminal
Look for: `exp://u.expo.dev/...` or scan the QR code

**Step 2:** Friends install Expo Go
- iOS: https://apps.apple.com/app/expo-go/id982107779
- Android: https://play.google.com/store/apps/details?id=host.exp.exponent

**Step 3:** Friends open the app
- iOS: Paste URL in Expo Go, or scan QR with camera app
- Android: Open Expo Go → Scan QR code

**Pros:**
✅ Instant - no build needed
✅ Hot reload - changes appear immediately
✅ Easy to update

**Cons:**
❌ Requires Expo Go app
❌ Less "real" feeling
❌ Your server must stay running

---

## Option 2: Android APK (Recommended for MVP Testing)

### Step 1: Create Expo Account (Free)

```bash
eas login
```

If you don't have an account, create one at: https://expo.dev/signup

### Step 2: Configure the Build

```bash
eas build:configure
```

Say "yes" to any prompts.

### Step 3: Build the APK

```bash
eas build -p android --profile preview
```

This will:
- Upload your code to Expo servers
- Build the APK in the cloud (15-20 mins)
- Give you a download link

**⏰ Wait time:** 15-20 minutes (first build)

### Step 4: Download the APK

Once complete, you'll see:
```
✔ Build finished
📦 Android application: https://expo.dev/accounts/[username]/projects/flick-fresh-dev/builds/[build-id]
```

Click the link → Download APK file (e.g., `flick-1.0.0.apk`)

### Step 5: Share With Friends

**Option A: Via Link (Easiest)**
- Upload APK to Google Drive / Dropbox
- Share link with friends
- Friends download and install

**Option B: Via AirDrop / Messages**
- Send APK file directly
- Friends open file → Install

**Option C: Via QR Code**
Expo creates a shareable page:
- Go to: https://expo.dev/accounts/[username]/projects/flick-fresh-dev/builds
- Share the QR code
- Friends scan → Download APK

### Friends Install APK (Android)

1. Download APK file
2. Tap to open
3. Android will warn: "Install unknown apps"
4. Tap "Settings" → Enable "Allow from this source"
5. Tap "Install"
6. Open Flick!

**Note:** Friends need to enable "Install from unknown sources" in Android settings

---

## Option 3: TestFlight (iOS - Professional)

**Requirements:**
- Apple Developer account ($99/year)
- 1-2 days for Apple review

### Step 1: Enroll in Apple Developer Program
https://developer.apple.com/programs/enroll/

### Step 2: Build for TestFlight

```bash
eas build -p ios --profile preview
```

### Step 3: Submit to TestFlight

```bash
eas submit -p ios
```

### Step 4: Add Testers
- Go to App Store Connect
- Add friends' email addresses
- They receive TestFlight invite
- Install TestFlight app → Install Flick

**Pros:**
✅ Professional beta testing
✅ Automatic updates
✅ Crash reports

**Cons:**
❌ Costs $99/year
❌ Takes 1-2 days for Apple review
❌ More complex setup

---

## Quick Comparison

| Method | Time | Cost | Feel | Best For |
|--------|------|------|------|----------|
| Expo Go | 2 mins | Free | Dev | Quick tests |
| APK | 20 mins | Free | Real | MVP testing |
| TestFlight | 2 days | $99/year | Pro | Beta release |

---

## Recommended Path for MVP

**Phase 1: Now (Expo Go)**
- Test with 1-2 close friends
- Iterate quickly
- Fix bugs

**Phase 2: This Week (APK)**
- Build APK once stable
- Share with 5-10 friends
- Gather feedback

**Phase 3: Pre-Launch (TestFlight)**
- Get Apple Developer account
- Submit to TestFlight
- Beta test with 50-100 users

---

## Build Commands Cheat Sheet

```bash
# Login to Expo
eas login

# Configure build (one-time)
eas build:configure

# Build Android APK
eas build -p android --profile preview

# Build iOS for TestFlight
eas build -p ios --profile production

# Check build status
eas build:list

# View build logs
eas build:view [build-id]
```

---

## Troubleshooting

### "eas: command not found"
```bash
npm install -g eas-cli
```

### Build fails - "No bundle identifier"
Add to `app.json`:
```json
"ios": {
  "bundleIdentifier": "com.flick.fresh"
}
```

### Friends can't install APK
- Android only allows APKs from "trusted sources"
- They need to enable "Install unknown apps" in Settings
- Or upload to Google Play Console (internal testing track)

### Want to update the app?
- **Expo Go:** Changes appear automatically
- **APK:** Build new APK, friends re-download
- **TestFlight:** Submit new build, auto-updates

---

## Next Steps

1. ✅ **Test yourself first** with Expo Go
2. ✅ **Build APK** when ready: `eas build -p android --profile preview`
3. ✅ **Share with 5-10 friends** for feedback
4. ✅ **Iterate based on feedback**
5. ✅ **Consider TestFlight** for iOS when approaching launch

---

## Cost Summary

- **Expo Go:** Free ✅
- **APK via EAS:** Free (includes 30 builds/month) ✅
- **TestFlight:** $99/year (Apple Developer Program)
- **Google Play:** $25 one-time (if publishing to Play Store)

---

Ready to build? Run:
```bash
eas login
eas build -p android --profile preview
```

Then grab coffee - build takes ~20 mins! ☕
