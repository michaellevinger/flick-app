# Next Session - Immediate Tasks

**Created:** 2026-02-03 22:59
**Priority:** HIGH

---

## 🎯 First Thing To Do:

### Test Profile Creation (5 minutes)

**Status:** Everything is ready, just needs testing!

**Steps:**
1. Start Expo: `npx expo start --localhost --clear`
2. **Scan QR code** with Expo Go on phone
3. Wait for app to load (Camera screen appears)
4. Take a selfie
5. Fill in name and age
6. Press **"Continue"**

**Expected Result:**
- ✅ Profile uploads successfully to Supabase
- ✅ Dashboard screen loads
- ✅ Your photo and name appear
- ✅ Status toggle shows ON (green glow)

**If It Fails:**
- Check Supabase Dashboard → Storage → selfies (does file appear?)
- Check Supabase Dashboard → Table Editor → users (does row exist?)
- Look at terminal for error logs
- Screenshot any errors

---

## 🧪 After Profile Creation Works:

### Test 2: Location & Dashboard (10 minutes)

1. ✅ Verify status toggle works (ON/OFF)
2. ✅ Grant location permission when prompted
3. ✅ Check terminal for "Location updated" logs
4. ✅ Pull down to refresh
5. ✅ Verify "No one nearby" message appears

**Check Supabase:**
- Go to Table Editor → users
- Verify your user has:
  - `location` field populated (PostGIS POINT)
  - `last_heartbeat` timestamp recent
  - `status` = true

---

### Test 3: Two-Device Proximity (20 minutes)

**Requirements:** 2 phones OR 1 phone + 1 simulator

**Steps:**
1. Create profile on Device A
2. Create profile on Device B
3. Both grant location permissions
4. Mock location to same spot:
   - Simulator: Debug → Location → Custom Location
   - Physical: Use location spoofing app or be physically close
5. Pull to refresh on both devices
6. **Expected:** See each other in radar with distance

---

### Test 4: Nudge System (10 minutes)

**Requires:** 2 devices seeing each other

1. Device A: Tap "Nudge" on Device B's card
2. Device B: Pull to refresh
3. **Expected:** Device B sees Device A with green border + "Wants to meet"
4. Device B: Tap "Nudge Back"
5. **Expected:** Both devices show Green Light screen with haptics!

---

## 📋 Testing Checklist

Copy this for your testing session:

```
Profile Creation:
[ ] Camera loads
[ ] Photo captured
[ ] Name and age entered
[ ] Profile created successfully
[ ] Dashboard loads
[ ] Photo displays correctly
[ ] Name displays correctly

Dashboard:
[ ] Status toggle ON by default
[ ] Status toggle switches OFF
[ ] Profile photo has green glow when ON
[ ] Profile photo grayscale when OFF

Location:
[ ] Location permission granted
[ ] Location updates in Supabase
[ ] Pull to refresh works
[ ] "No one nearby" message appears

Two Devices (if available):
[ ] Both profiles created
[ ] Both see each other in radar
[ ] Distance shown correctly
[ ] Real-time updates work

Nudge System (if 2 devices):
[ ] Send nudge works
[ ] Receive nudge shows green border
[ ] Mutual match triggers Green Light
[ ] Haptic feedback works

Sign Out:
[ ] Sign out button works
[ ] Confirmation dialog appears
[ ] Returns to camera screen
[ ] User deleted from Supabase
[ ] Selfie deleted from storage
```

---

## 🐛 Known Issues to Watch For:

1. **Metro cache errors** → Solution: `npx expo start --clear --reset-cache`
2. **White blank screen** → Solution: Press `r` in terminal or shake device → Reload
3. **"No apps connected"** → Solution: Close Expo Go, rescan QR code
4. **Storage upload fails** → Solution: Verify storage policies exist (already done!)

---

## 🔗 Quick Links for Testing:

- **Supabase Dashboard:** https://supabase.com/dashboard/project/oithyuuztrmohcbfglrh
- **Users Table:** https://supabase.com/dashboard/project/oithyuuztrmohcbfglrh/editor/table/users
- **Storage Bucket:** https://supabase.com/dashboard/project/oithyuuztrmohcbfglrh/storage/buckets/selfies
- **Storage Policies:** https://supabase.com/dashboard/project/oithyuuztrmohcbfglrh/storage/policies

---

## 💾 Before Testing:

Make sure latest code is pulled:
```bash
cd /Users/michaellevinger/dev/testing
git pull origin main
git log --oneline -5
```

Latest commit should be: `9dae43d` or newer

---

## 📸 Screenshot These If Errors Occur:

1. Error screen on phone
2. Terminal output
3. Supabase users table
4. Supabase storage bucket
5. Network tab in Supabase dashboard

---

**Good luck! The app is SO close to fully working!** 🚀
