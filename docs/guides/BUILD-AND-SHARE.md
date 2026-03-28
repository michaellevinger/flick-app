# Build & Share Flick App - Complete Guide

## Overview

4 ways to run/share the app:

1. **Expo Go** (2 mins) - Quickest for UI work, but limited native features
2. **Development Build** (20 mins first build) - Full native features on your device
3. **APK Build** (20 mins) - Standalone Android app, share with testers
4. **TestFlight** (1-2 days) - Professional iOS beta testing

### When to use what

| | Expo Go | Dev Build | APK (preview) | TestFlight |
|---|---|---|---|---|
| Push notifications | No (removed in SDK 53) | Yes | Yes | Yes |
| Camera / haptics | Yes | Yes | Yes | Yes |
| Hot reload | Yes | Yes | No | No |
| Dev tools (login buttons, dev scripts) | Yes | Yes | No | No |
| Requires Mac running | Yes | Yes | No | No |
| Share with others | Live session only | No (your device) | Yes | Yes |

**Bottom line:** Use **Expo Go** for quick UI iteration. Switch to **Development Build** when you need push notifications or other native features that Expo Go doesn't support.

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

## Option 2: Development Build (Required for Push Notifications)

A development build is a real native app compiled with all native modules (like `expo-notifications`), but it still connects to your local Expo dev server for hot reload and dev tools. Think of it as "Expo Go but with your native code."

### Why you need this

Starting with Expo SDK 53, **push notification functionality was removed from Expo Go on Android**. Your push token will register, but notifications will never arrive. A development build solves this — it includes the full `expo-notifications` native module.

### Prerequisites

```bash
# Install EAS CLI globally (if not already)
npm install -g eas-cli

# Login to your Expo account
eas login
```

You also need your Android phone connected to the **same WiFi** as your Mac (the dev build connects to your local Expo server over LAN).

### EAS project ownership

The EAS project is linked to the `dorbiren` Expo account (project ID in `app.json` > `extra.eas.projectId`). If you're a different developer and get a permissions error when running `eas build`, you have two options:

1. **Use the existing project** — ask Dor to add you as a team member at https://expo.dev > Project Settings > Members.
2. **Re-link to your own account** — remove the `projectId` from `app.json` and run `eas init` to create a new project under your account. This won't affect the codebase, only which Expo account hosts the builds.

### Step 1: Build the development APK (one-time, ~20 min)

```bash
eas build -p android --profile development
```

This builds a debug APK in the cloud with all native modules compiled in. You only need to rebuild when you add/remove native packages (like a new `expo-*` library). Code changes are picked up via hot reload — no rebuild needed.

The `development` profile in `eas.json` is already configured:

```json
"development": {
  "android": {
    "buildType": "apk",
    "gradleCommand": ":app:assembleDebug"
  },
  "developmentClient": true,
  "distribution": "internal"
}
```

### Step 2: Install on your phone

When the build finishes, you'll get a download link:

```
https://expo.dev/accounts/[username]/projects/flick-fresh-dev/builds/[build-id]
```

1. Open that link **on your Android phone** (not your Mac)
2. Download the APK
3. Tap to install (enable "Install from unknown sources" if prompted)

You now have a "Flick" app icon on your phone. This app is a development client — it shows a launcher screen where you enter your dev server URL.

### Step 3: Start the dev server

```bash
npm run dev:male
# or
npm run dev:female
```

This starts Expo with `--lan` mode. Look for the URL in the terminal output:

```
Metro waiting on exp://192.168.x.x:8081
```

### Step 4: Connect the app

Open the Flick app on your phone. You'll see the Expo development client launcher:

1. The dev server should appear automatically under "Development servers"
2. If it doesn't, tap "Enter URL manually" and type: `http://192.168.x.x:8081` (the IP from your terminal)
3. The app loads with full hot reload support

### Step 5: Test push notifications

1. Tap **Login as Male** (or Female) on the Welcome screen
2. Accept the notification permission prompt when it appears
3. Check the terminal — you should see: `[Notifications] Push token: ExponentPushToken[...]`
4. In a separate terminal, run `npm run flick:me` or `npm run message:me`
5. Notifications should appear on your phone (even when the app is backgrounded)

### When to rebuild

You do **not** need to rebuild for code changes — hot reload handles that. You **do** need to rebuild when:

- Adding a new native package (e.g., `npx expo install expo-something-new`)
- Changing `app.json` plugin configuration
- Updating the Expo SDK version

### Troubleshooting

| Problem | Fix |
|---|---|
| App can't find dev server | Make sure phone and Mac are on the same WiFi. Check that the IP in the terminal matches your Mac's local IP. |
| "Network request failed" on launch | Firewall may be blocking port 8081. On Mac: System Settings > Network > Firewall > allow Node.js. |
| Push token registers but no notifications | You're running in Expo Go, not the dev build. Check the app icon — dev build shows "Flick", Expo Go shows the Expo icon. |
| Build fails with signing error | Run `eas credentials` to set up or reset Android signing. |
| Old build, need to update | Run `eas build -p android --profile development` again. |

---

## Option 3: Android APK (Recommended for MVP Testing)

### Step 1: Login to EAS

```bash
eas login
```

If you don't have an account, create one at https://expo.dev/signup. If you get a permissions error, see the **EAS project ownership** note in Option 2 above.

### Step 2: Build the APK

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

## Option 4: TestFlight (iOS - Professional)

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
| Expo Go | 2 mins | Free | Dev | Quick UI iteration |
| Dev Build | 20 mins (first) | Free | Dev + native | Push notifications, native features |
| APK (preview) | 20 mins | Free | Real | Sharing with testers |
| TestFlight | 2 days | $99/year | Pro | iOS beta release |

---

## Recommended Path for MVP

**Phase 1: Expo Go**
- Quick UI iteration and bug fixes
- No build step needed

**Phase 2: Development Build**
- Test push notifications on your own device
- Test any native features that Expo Go doesn't support
- One-time 20-min build, then hot reload from there

**Phase 3: APK (preview)**
- Build standalone APK once features are stable
- Share with 5-10 friends for feedback

**Phase 4: TestFlight**
- Apple Developer account needed ($99/year)
- Beta test with larger group

---

## Build Commands Cheat Sheet

```bash
# Login to Expo
eas login

# Configure build (one-time)
eas build:configure

# Build Android dev client (push notifications, native features + hot reload)
eas build -p android --profile development

# Build Android APK for sharing with testers
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
