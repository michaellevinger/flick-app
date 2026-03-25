# Fix Google Sign-In DEVELOPER_ERROR

## The Problem
Google Sign-In requires an **Android OAuth Client** (not just Web client) with your app's SHA-1 certificate fingerprint.

## Step 1: Get Your App's SHA-1 Fingerprint

Run this command in your terminal:

```bash
eas credentials -p android
```

- Select your project
- Select "Keystore: Build Credentials..."
- Look for **SHA1 Fingerprint**
- Copy it (looks like: `A1:B2:C3:D4:...`)

## Step 2: Create Android OAuth Client in Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click **"+ Create Credentials"** → **"OAuth client ID"**
3. Application type: **"Android"**
4. Name: `Flick Android`
5. Package name: `com.michaellevinger.flick` (from app.json)
6. **SHA-1 certificate fingerprint:** Paste the SHA-1 from Step 1
7. Click **"Create"**

## Step 3: Update Your Code

The Android OAuth client doesn't give you a Client ID - it uses the Web Client ID.

**You already have this configured!** ✅ No code changes needed.

## Step 4: Wait 5-10 Minutes

Google needs to propagate the changes. Then test again.

---

## Alternative: Quick Test with Debug SHA-1

If you want to test immediately, you can also add your local debug keystore SHA-1:

```bash
# Get debug keystore SHA-1 (for local testing)
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep SHA1
```

Add this SHA-1 to Google Cloud Console the same way.

---

## Troubleshooting

If it still doesn't work after 10 minutes:
1. Verify package name matches: `com.michaellevinger.flick`
2. Verify Web Client ID in .env matches Google Console
3. Try clearing app data and reinstalling
4. Check Google Cloud Console → APIs & Services → Google Sign-In API is enabled
