# Resume Prompt for Next Session

**Last Updated:** 2026-02-03 16:20

---

## 🚀 Quick Resume Prompt:

```
I'm working on HeyU app (proximity-based social app).

PROJECT: /Users/michaellevinger/dev/testing
GITHUB: https://github.com/MikeyLevinger/heyu-app

CURRENT STATUS (2026-02-03 Evening):
- ✅ All features coded and complete
- ✅ Supabase fully configured (database + storage + policies VERIFIED)
- ✅ Comprehensive test suite created - ALL 6 TESTS PASSED
- ✅ App loads successfully via QR code scanning
- ✅ Camera screen works and captures photos
- ✅ Setup form working
- ✅ Storage policies confirmed (3 policies exist)
- 🧪 READY to test profile creation with upload
- ⏳ Need to test dashboard and remaining features

SETUP REQUIRED:
- Start Expo: `npx expo start --localhost --clear`
- **Scan QR code** with Expo Go (MOST RELIABLE METHOD)
- Alternative: Connect via USB and press `a` (less reliable)
- Or use iOS Simulator (requires Xcode)

WHAT TO DO:
1. Read SESSION_NOTES.md for complete context (scroll to bottom for latest)
2. Help test profile creation and storage upload
3. Test dashboard, location, proximity features
4. Continue Task #10: Polish & Testing

KEY FILES:
- SESSION_NOTES.md - Complete session history
- PROJECT_STATUS.md - Current project status
- TEST_SUITE_README.md - Test suite documentation
- TESTING_CHECKLIST.md - Full testing scenarios
```

---

## 📋 Context Summary:

### What Works ✅
- Test suite (all 6 component tests pass)
- Camera screen with permission handling
- Photo capture
- Setup form input
- Supabase connection
- Theme and constants
- User context
- Location services

### Currently Testing 🧪
- **NEXT:** Profile creation with photo upload (storage policies verified!)
- Dashboard screen loading after profile creation
- Location tracking activation
- User data persistence

### Not Yet Tested ⏳
- Proximity detection (2 devices)
- Nudge system
- Mutual matching
- Green Light screen
- Number exchange
- Auto-wipe functionality

### Known Issues 🐛
- Metro bundler cache aggressive (requires frequent `--clear`)
- **QR code scanning most reliable** (USB `a` command sometimes fails to connect)
- WiFi/tunnel connections unstable
- expo-camera v17 API changes (now using CameraView)

---

## 🛠 Quick Commands:

```bash
# Start development server
cd /Users/michaellevinger/dev/testing
npx expo start --localhost --clear

# Clear everything and restart
rm -rf .expo node_modules/.cache
npx expo start --localhost --clear --reset-cache

# Run test suite instead of full app
# (swap App.js with App.test-suite.js)

# Check git status
git status
git log --oneline -10
```

---

## 🔗 Important Links:

- **Supabase Dashboard**: https://supabase.com/dashboard/project/oithyuuztrmohcbfglrh
- **Storage Bucket**: https://supabase.com/dashboard/project/oithyuuztrmohcbfglrh/storage/buckets
- **Database Tables**: https://supabase.com/dashboard/project/oithyuuztrmohcbfglrh/editor
- **GitHub Repo**: https://github.com/MikeyLevinger/heyu-app

---

## 💡 Tips for Next Session:

1. **Use QR code scanning** - Most reliable connection method ⭐
2. **Clear Metro cache** if you see old errors: `--clear --reset-cache`
3. **Check SESSION_NOTES.md bottom** for latest updates
4. **Close/reopen Expo Go app** if changes don't appear
5. **Use test suite** (App.test-suite.js) to isolate issues
6. **Wait for "Bundled XXXXms"** message before expecting app to load

---

**Bookmark this file!** Everything you need to resume development quickly.
