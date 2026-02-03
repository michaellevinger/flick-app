# HeyU Test Suite

## What This Does

This test suite verifies each component of the app works individually BEFORE loading the full app.

## How to Run

```bash
# Make sure test suite is active
# (App.js should be the test suite)

# Start Expo
npx expo start --clear

# Scan QR code or press 'a' for Android
```

## Tests Included

### Test 1: Basic Components ✅
- Tests React Native View, Text, Button
- Tests state management with useState
- Tests Alert dialogs

### Test 2: Theme & Constants ✅
- Tests if theme.js can be imported
- Verifies COLORS and SPACING constants
- Checks theme structure

### Test 3: Supabase Connection ✅
- Tests Supabase client initialization
- Tests database connection
- Verifies environment variables loaded

### Test 4: Camera Permissions ✅
- Tests expo-camera import
- Tests permission request flow
- Verifies camera access

### Test 5: Location ✅
- Tests expo-location import
- Tests location permissions
- Tests GPS coordinate retrieval

### Test 6: User Context ✅
- Tests UserContext can be imported
- Verifies UserProvider and useUser exports
- Checks context structure

## Navigation

- Each test has a "✅ PASS" button to go to next test
- Only appears when test passes
- Back button to return to previous test
- Summary screen shows all results

## Switching Back to Full App

```bash
# Restore full app
mv App.js App.test-suite.js
mv App.full.js App.js

# Restart
npx expo start --clear
```

## Troubleshooting

If a test fails:
1. Read the error message carefully
2. Check the specific component/file mentioned
3. Fix the issue
4. Re-run the test

If the app won't load at all:
- Check network connection
- Try `npx expo start --lan` instead of tunnel
- Verify phone and computer on same WiFi

## Expected Results

All tests should pass with green checkmarks ✅

If any test fails ❌, that component needs to be fixed before the full app will work.
