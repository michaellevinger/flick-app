# How to Start the Flick App

## ✅ Simplest Method: Use Your Phone

1. **Install Expo Go on your iPhone:**
   - Open App Store
   - Search for "Expo Go"
   - Install it

2. **Start the dev server:**
   ```bash
   cd /Users/michaellevinger/dev/testing
   npx expo start
   ```

3. **Scan the QR code:**
   - Open the Camera app on your iPhone
   - Point it at the QR code in the terminal
   - Tap the notification to open in Expo Go

## Alternative: Fix Xcode (If you want iOS Simulator)

If Xcode is not fully installed:
```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodegen install
```

Then try:
```bash
npx expo start --ios
```

## Test the QR Room System

Once the app opens:
1. Take a selfie (Camera Screen)
2. Enter your profile info (Setup Screen)
3. Tap "Skip (Dev Only)" on QR Scanner to join Coachella 2024
4. You'll see the Dashboard with festival banner

## Everything is Ready!

- ✅ Code is complete
- ✅ Database is set up (festivals table exists)
- ✅ Assets are in place (icons created from logo)
- ✅ Dependencies installed

The app just needs to run - use your phone with Expo Go for the easiest testing!
