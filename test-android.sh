#!/bin/bash
echo "Starting clean Android build..."
rm -rf .expo android ios node_modules/.cache
npx expo prebuild --clean --platform android
cd android
./gradlew clean
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
echo "App installed! Opening..."
adb shell am start -n com.flick.fresh/.MainActivity
