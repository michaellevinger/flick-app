# Camera Issues in Expo Go - Solutions

## Issue
CameraView shows black screen on some Android devices in Expo Go. This is a known limitation.

## Working Alternatives (Recommended for MVP)

### QR Scanner
✅ **Use "Skip (Dev Only)" button** - Joins test festival instantly

### Selfie
✅ **Use "Choose from Gallery"** - Better photos, better UX

Both work perfectly and allow full app testing!

## If Camera Is Critical

Build a development build (camera works reliably):

```bash
# Install development client
npm install expo-dev-client

# Build development APK
eas build -p android --profile development

# Install on device
# Camera will work perfectly in dev build
```

**Time:** ~20 mins for first build
**Cost:** Free (uses free build credits)

## Why This Happens

Expo Go is a pre-built app that includes many packages. Sometimes native modules (like camera) have conflicts with device-specific implementations. Development builds compile specifically for your device, avoiding these issues.

## Recommendation for MVP Testing

**Use the working alternatives** (Skip + Gallery). They work perfectly and are actually better UX:
- Gallery photos are higher quality
- Skip button speeds up testing
- No camera frustration

Save camera debugging for production build when you have more time.
