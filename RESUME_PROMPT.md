# Resume Prompt for Next Session

**Last Updated:** 2026-02-03 16:20

---

## 🚀 Quick Resume Prompt:

```
I'm working on HeyU app (proximity-based social app).

PROJECT: /Users/michaellevinger/dev/testing
GITHUB: https://github.com/MikeyLevinger/heyu-app

CURRENT STATUS (2026-02-03):
- ✅ All features coded and complete
- ✅ Supabase fully configured (database + storage + policies)
- ✅ Comprehensive test suite created - ALL 6 TESTS PASSED
- ✅ App loads via USB connection on Android
- ✅ Camera screen works and captures photos
- 🚧 Testing profile creation with storage upload
- ⏳ Need to test full user flow

SETUP REQUIRED:
- Start Expo: `npx expo start --localhost --clear`
- Connect Android phone via USB (USB debugging enabled)
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

### Currently Testing 🚧
- Profile creation with photo upload to Supabase Storage
- Dashboard screen loading
- Location tracking activation

### Not Yet Tested ⏳
- Proximity detection (2 devices)
- Nudge system
- Mutual matching
- Green Light screen
- Number exchange
- Auto-wipe functionality

### Known Issues 🐛
- Metro bundler cache aggressive (requires frequent `--clear`)
- Android Expo Go requires USB connection (WiFi unstable)
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

1. **Start with USB connection** - Most reliable for Android
2. **Clear Metro cache** if you see old errors
3. **Check SESSION_NOTES.md bottom** for latest updates
4. **Close/reopen Expo Go app** if changes don't appear
5. **Use test suite** (App.test-suite.js) to isolate issues

---

**Bookmark this file!** Everything you need to resume development quickly.
