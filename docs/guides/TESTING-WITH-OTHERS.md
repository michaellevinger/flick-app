# Testing Flick With Another Person

Two options depending on how long the session is and what device they have.

---

## Option 1: Expo Go + Tunnel (5 minutes, no build needed)

Best for: a quick live session with one person. Your Mac must stay awake while they test.
Works on: both iOS and Android.

### Step 1 — Start the tunnel

```bash
npx expo start --tunnel
```

A QR code appears in the terminal. A public URL like `exp://u.expo.dev/...` is created — it works from any network, not just yours.

### Step 2 — Your tester installs Expo Go

- iOS: search "Expo Go" on the App Store
- Android: search "Expo Go" on the Play Store

### Step 3 — They open the app

**iOS:** Open the Camera app, point it at the QR code. Tap the banner that appears.

**Android:** Open Expo Go → tap "Scan QR code" → point at the QR code.

The app loads on their phone within seconds.

### Step 4 — Join the same event

Both of you need to be in the same festival/event to appear on each other's radar.
Use the dev skip button (QR scanner → "Skip - Join Test Event") on both devices.

### Notes

- If you save a file, the app hot-reloads on their phone automatically.
- If the tunnel URL expires, just restart with `npx expo start --tunnel`.
- `--tunnel` uses ngrok under the hood. If it fails, run `npx expo install @expo/ngrok` first.

---

## Option 2: EAS Android APK (20 min build, shareable link)

Best for: sending to someone who will test on their own time, or testing without your Mac running.
Works on: Android only.

Your app is already fully configured for EAS builds (project ID, package name, bundle ID all set in `app.json` and `eas.json`).

### Step 1 — Make sure you are logged in to EAS

```bash
eas whoami
```

If not logged in:

```bash
eas login
```

### Step 2 — Build the APK

```bash
eas build -p android --profile preview
```

This uploads your code to Expo's build servers and compiles it in the cloud. Takes 15–20 minutes. You will get a link when it finishes, like:

```
https://expo.dev/accounts/[username]/projects/flick-fresh-dev/builds/[build-id]
```

### Step 3 — Share the APK

Open that link in a browser and download the `.apk` file. Then share it however you like:

- Google Drive / Dropbox link
- AirDrop
- iMessage / WhatsApp

### Step 4 — They install it

1. Download the APK on their Android phone
2. Tap the file to open it
3. Android will show a warning: "Install from unknown sources"
4. Tap **Settings** → enable **"Allow from this source"** → go back and tap **Install**
5. Open Flick

### Notes

- This is a real standalone app — no Expo Go needed, no Mac running.
- Each time you make changes and want them to test the new version, you need to run a new build.
- Check your remaining free builds: `eas build:list`
- EAS free tier includes 30 builds/month.

---

## After they install — joining the same event

Regardless of which option you use, both users need to be in the same event to interact:

1. Both open the app
2. Both go to the QR scanner
3. Both tap **"Skip - Join Test Event"** (dev button, visible because `__DEV__` is true in Expo Go, but NOT in the APK build)

> **APK note:** The `__DEV__` skip button is stripped in production builds. To test with an APK, you need a real QR code for the `test-festival` event, or generate one with `node scripts/generate-qr.js`.

---

## Quick comparison

| | Expo Go + Tunnel | EAS APK |
|---|---|---|
| Setup time | 5 minutes | 20 minutes (first build) |
| Platforms | iOS + Android | Android only |
| Mac must be running | Yes | No |
| Dev skip button works | Yes | No |
| Tester needs Expo Go | Yes | No |
| Share a link | No (live session only) | Yes |
| Best for | Live debugging sessions | Independent testing |
