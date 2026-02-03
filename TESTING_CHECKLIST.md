# Nudge - End-to-End Testing Checklist

**Date**: 2026-02-03
**Status**: Ready for testing after storage bucket creation

---

## 🚀 Quick Start

```bash
# 1. Verify setup
./test-setup.sh

# 2. Start the app
npx expo start
```

---

## ✅ Test Scenarios

### **Scenario 1: Onboarding Flow** (Single Device)

**Prerequisites**: Fresh install or cleared data

**Steps**:
1. [ ] Launch app
2. [ ] Camera screen appears
3. [ ] Grant camera permission when prompted
4. [ ] Take a selfie (front camera)
5. [ ] Preview shows correctly
6. [ ] Click "Use This Photo"
7. [ ] Setup screen appears
8. [ ] Enter name (e.g., "Alex")
9. [ ] Enter age (e.g., "25")
10. [ ] Enter phone number (optional - try with and without)
11. [ ] Click "Continue"
12. [ ] **Expected**: Dashboard loads with profile

**Verify**:
- [ ] Photo appears in dashboard
- [ ] Name displayed correctly
- [ ] Status toggle is ON by default (green glow)
- [ ] Check Supabase Dashboard → users table has new entry
- [ ] Check Storage → selfies bucket has uploaded image

---

### **Scenario 2: Location & Radar** (Single Device)

**Prerequisites**: User profile created, status is ON

**Steps**:
1. [ ] Grant location permission when prompted
2. [ ] Wait 5 seconds for initial location update
3. [ ] Pull down to refresh
4. [ ] **Expected**: "No one nearby" message (if alone)

**Verify**:
- [ ] Check Supabase → users table → your user has `location` (PostGIS POINT)
- [ ] Check `last_heartbeat` is recent (within 60 seconds)
- [ ] Toggle status OFF → Profile photo goes grayscale
- [ ] Toggle status ON → Profile photo gets green glow

**Check Console Logs**:
```
Location updated: {latitude: X, longitude: Y}
Heartbeat sent
```

---

### **Scenario 3: Proximity Detection** (2 Devices Required)

**Prerequisites**: 2 devices with profiles created

**Setup**:
- Device A: Your phone
- Device B: Simulator OR second phone

**Steps**:
1. [ ] Create profile on Device A
2. [ ] Create profile on Device B
3. [ ] **Mock Location** (if using simulator):
   - iOS Simulator: Debug → Location → Custom Location
   - Set both devices to same location (e.g., 37.7749, -122.4194)
4. [ ] On Device A: Pull to refresh
5. [ ] **Expected**: Device B's profile appears in radar
6. [ ] Verify distance shown (should be 0m or very small)
7. [ ] On Device B: Pull to refresh
8. [ ] **Expected**: Device A's profile appears

**Verify**:
- [ ] Both devices see each other
- [ ] Distance is accurate
- [ ] Photos load correctly
- [ ] Names and ages display

---

### **Scenario 4: Nudge System** (2 Devices)

**Prerequisites**: Both devices see each other in radar

**Device A Actions**:
1. [ ] Tap "Nudge" button on Device B's card
2. [ ] **Expected**: Button changes to "Nudged ✓" (gray)
3. [ ] Card state persists after refresh

**Device B Actions**:
1. [ ] Pull to refresh (or wait for real-time update)
2. [ ] **Expected**: Device A's card now has:
   - Green border (3px)
   - "Wants to meet" label
   - "Nudge Back" button (instead of "Nudge")

**Verify Real-time**:
- [ ] Device B updates within 1-2 seconds (no refresh needed)

**Create Match**:
1. [ ] Device B taps "Nudge Back"
2. [ ] **Expected BOTH devices**: Green Light screen appears!
3. [ ] **Expected**: 3-pulse haptic vibration
4. [ ] Screen shows:
   - Full green background (#00FF00)
   - Pulse animation
   - Matched user's photo
   - Matched user's name

**Verify Database**:
- [ ] Check nudges table → 2 rows (A→B and B→A)
- [ ] Both have matching timestamps

---

### **Scenario 5: Number Exchange** (2 Devices)

**Prerequisites**: Both devices on Green Light screen (matched)

**Request Number (Device A)**:
1. [ ] Tap "Request Number" button
2. [ ] **Expected**: Button changes to "Waiting for response..."

**Accept Request (Device B)**:
1. [ ] See "Request Number" button OR real-time popup
2. [ ] Tap to accept
3. [ ] **Expected BOTH devices**: Navigate to Vault Screen

**Vault Screen (Both Devices)**:
- [ ] Both phone numbers displayed
- [ ] Your number on top
- [ ] Their number below
- [ ] 15:00 countdown timer starts
- [ ] Quick actions visible:
  - [ ] Call button (opens dialer)
  - [ ] Text button (opens messages)
  - [ ] Save button (copies to clipboard OR contact)

**Verify Database**:
- [ ] Check exchanges table → 1 row created
- [ ] status = 'accepted'
- [ ] expires_at = created_at + 15 minutes
- [ ] Both phone numbers stored

**Test TTL (15-Minute Countdown)**:
1. [ ] Watch timer count down
2. [ ] Wait 15 minutes (or manually update expires_at in DB)
3. [ ] **Expected**: Auto-navigate back to dashboard
4. [ ] Exchange deleted from database
5. [ ] Numbers no longer visible

---

### **Scenario 6: Proximity Wipe** (2 Devices)

**Prerequisites**: Active exchange in Vault

**Steps**:
1. [ ] Both devices in Vault with active exchange
2. [ ] Move Device A >100m away from Device B
   - Real world: Actually walk away
   - Simulator: Change custom location
3. [ ] Wait for next heartbeat (60 seconds max)
4. [ ] **Expected**: Exchange auto-deletes
5. [ ] Both devices navigate back to dashboard
6. [ ] Nudges also deleted (match dissolved)

**Verify Database**:
- [ ] exchanges table → row deleted
- [ ] nudges table → both rows deleted

---

### **Scenario 7: Distance Dissolution** (2 Devices)

**Prerequisites**: Two matched users (nudges exist)

**Steps**:
1. [ ] Both devices matched (nudges in both directions)
2. [ ] Move devices >100m apart
3. [ ] Wait 60 seconds (heartbeat interval)
4. [ ] Pull to refresh on both devices
5. [ ] **Expected**: Users no longer see each other
6. [ ] Nudges deleted from database

**Verify**:
- [ ] nudges table empty
- [ ] Can nudge same person again (fresh start)

---

### **Scenario 8: Auto-Wipe (20-Minute Inactivity)**

**Prerequisites**: Edge Function deployed (optional for now)

**Steps**:
1. [ ] Create a test user
2. [ ] Set status to OFF
3. [ ] Don't interact for 20 minutes
4. [ ] **Expected**: User auto-deleted from database
5. [ ] Selfie deleted from storage
6. [ ] All nudges deleted

**Verify**:
- [ ] users table → user row deleted
- [ ] storage/selfies → image file deleted
- [ ] nudges table → related nudges deleted

**Note**: This requires the Edge Function to be deployed. For now, you can test manually:
```sql
-- Run in Supabase SQL Editor
SELECT auto_wipe_inactive_users();
```

---

### **Scenario 9: Sign Out**

**Prerequisites**: Logged in user

**Steps**:
1. [ ] Tap "Sign Out" button
2. [ ] Confirm dialog appears
3. [ ] Confirm sign out
4. [ ] **Expected**: Navigate back to Camera screen
5. [ ] User deleted from database
6. [ ] Selfie deleted from storage

**Verify**:
- [ ] users table → user not found
- [ ] storage → selfie file deleted
- [ ] App resets to onboarding

---

## 🐛 Common Issues & Solutions

### **Issue**: "No one nearby" always shows

**Solutions**:
- Ensure both devices granted location permissions
- Check location is updating (pull to refresh)
- Verify both users have status = ON
- Try increasing radius temporarily (edit `src/constants/theme.js`)
- Check Supabase users table for location data

---

### **Issue**: Photos not uploading

**Solutions**:
- Verify selfies bucket exists and is PUBLIC
- Check .env file has correct credentials
- Grant camera/gallery permissions
- Check Expo console for errors
- Verify storage policies in Supabase Dashboard

---

### **Issue**: Real-time updates not working

**Solutions**:
- Check internet connection
- Verify Supabase real-time is enabled (Project Settings → API → Realtime)
- Check console for subscription errors
- Try pull to refresh manually

---

### **Issue**: Haptic feedback not working

**Solutions**:
- Physical device required (simulators don't vibrate)
- Check device vibration settings
- Try on iOS first (more reliable)

---

### **Issue**: Numbers not showing in Vault

**Solutions**:
- Ensure both users entered phone numbers during setup
- Check exchanges table in Supabase
- Verify expires_at is in the future
- Check console logs for errors

---

## 📊 Performance Benchmarks

Track these metrics during testing:

- [ ] **App Load Time**: Should be <3 seconds
- [ ] **Location Update**: First location within 5 seconds
- [ ] **Radar Refresh**: Results in <2 seconds
- [ ] **Photo Upload**: <5 seconds on good connection
- [ ] **Real-time Nudge**: Update within 1-2 seconds
- [ ] **Green Light Trigger**: Instant (<500ms)
- [ ] **Haptic Delay**: Immediate (<100ms)

---

## 🎯 Success Criteria

All scenarios must pass:
- [ ] Onboarding completes successfully
- [ ] Location tracking works
- [ ] Proximity detection accurate
- [ ] Nudges send and receive
- [ ] Mutual match triggers Green Light
- [ ] Haptics work on physical device
- [ ] Number exchange flow complete
- [ ] 15-minute TTL countdown works
- [ ] Proximity wipe triggers correctly
- [ ] Distance dissolution works
- [ ] Sign out cleans up data

---

## 🔍 Database Queries for Verification

```sql
-- Check all users
SELECT id, name, age, status,
       ST_AsText(location) as location,
       last_heartbeat
FROM users;

-- Check all nudges
SELECT from_user_id, to_user_id, created_at
FROM nudges
ORDER BY created_at DESC;

-- Check active exchanges
SELECT user_a_id, user_b_id, status,
       expires_at, created_at
FROM exchanges
WHERE expires_at > NOW();

-- Check storage files
-- (View in Supabase Dashboard → Storage → selfies)

-- Manually trigger auto-wipe
SELECT auto_wipe_inactive_users();

-- Find mutual matches
SELECT n1.from_user_id as user_a,
       n1.to_user_id as user_b
FROM nudges n1
INNER JOIN nudges n2
  ON n1.from_user_id = n2.to_user_id
  AND n1.to_user_id = n2.from_user_id;
```

---

## 📝 Testing Notes

**Date**: ___________
**Tester**: ___________
**Devices**:
- Device A: ___________
- Device B: ___________

**Results**:
- Scenarios Passed: ___ / 9
- Bugs Found: ___________
- Performance Notes: ___________

---

**Ready to test!** 🚀 Start with Scenario 1 and work your way through.
