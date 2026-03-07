# Nuclear Option - Complete Fresh Start

The "failed to download remote update" error is persistent. Here's the nuclear option:

## Option 1: Create Brand New Expo Project

```bash
# Move to parent directory
cd /Users/michaellevinger/dev

# Create fresh project
npx create-expo-app flick-fresh --template blank

# Copy your source code
cp -r testing/src flick-fresh/
cp -r testing/assets flick-fresh/
cp testing/.env flick-fresh/
cp testing/supabase-festival-rooms-safe.sql flick-fresh/

# Update app.json in new project
cd flick-fresh
```

Then manually add dependencies from old package.json.

## Option 2: Use Simulator ONLY (No Expo Go)

The error is coming from Expo Go app trying to fetch updates. Use simulator instead:

### For iOS Simulator:
```bash
# Fix Xcode path first
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

# Then start
npx expo start
# Press 'i' for iOS simulator
```

### For Android Emulator:
```bash
# Make sure Android Studio is installed
# Create an AVD (Android Virtual Device) in Android Studio

# Then start
npx expo start
# Press 'a' for Android emulator
```

## Option 3: Build Development Client

Instead of using Expo Go (which is causing the update issue), build a development client:

```bash
# Install expo-dev-client
npx expo install expo-dev-client

# Build for your device
npx eas build --profile development --platform ios
# or
npx eas build --profile development --platform android
```

This creates a custom version of Expo Go just for your app, no update checks.

## Why This Is Happening

Expo Go app is configured to check for updates for the project ID in the original eas.json. Even though we removed it, Expo Go has it cached on your phone.

**The fix:** Use a simulator OR create a completely new project with different ID.
