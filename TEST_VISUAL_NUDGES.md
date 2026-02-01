# Testing Visual Nudge System - Quick Guide

## ✅ Pre-Test Checklist

Before testing, verify:
- [ ] Supabase credentials are in `src/lib/supabase.js`
- [ ] You have 2 devices/simulators available
- [ ] Both devices can run Expo

## 🚀 Quick Start

### 1. Start the App

```bash
npx expo start
```

Then:
- Press `i` twice for 2 iOS simulators
- OR press `a` twice for 2 Android emulators
- OR scan QR on 2 physical devices

### 2. Set Mock Locations (Simulators Only)

**iOS Simulator:**
- Simulator 1: Debug → Location → Custom Location → `37.7749, -122.4194` (San Francisco)
- Simulator 2: Debug → Location → Custom Location → `37.7750, -122.4194` (nearby)

**Android Emulator:**
- Emulator 1: Extended Controls (⋮) → Location → `37.7749, -122.4194`
- Emulator 2: Extended Controls (⋮) → Location → `37.7750, -122.4194`

---

## 🎯 Test 1: Basic Visual Indicators

**What we're testing:** When User A nudges User B, User B sees visual indicators.

### Steps:

1. **Device A (Alice):**
   - Take selfie
   - Enter name: "Alice", age: 25
   - Reach dashboard (status should be ON)

2. **Device B (Bob):**
   - Take selfie
   - Enter name: "Bob", age: 27
   - Reach dashboard (status should be ON)

3. **Both Devices:**
   - Pull down to refresh
   - Verify you see each other in the radar

4. **Device A (Alice):**
   - Find Bob in the radar feed
   - Tap **"Nudge"** button
   - ✅ Alert: "Nudge Sent - Bob will see you're interested!"
   - ✅ Button changes to "Nudged ✓" (gray)

5. **Device B (Bob) - CHECK IMMEDIATELY:**
   - Within 1 second, Alice's card should update with:
     - ✅ **Green left border** (3px thick)
     - ✅ **Light green background glow**
     - ✅ **Green border around Alice's selfie** (3px)
     - ✅ **Wave emoji (👋)** next to Alice's name
     - ✅ **"Wants to meet"** label in green (instead of distance)
     - ✅ **"Nudge Back"** button (instead of "Nudge")

### Expected UI on Bob's Device:

```
┃ ┌──────────────────────────────────┐
┃ │  ⚫️ [Alice's Photo with border]  │ ← Green left border
┃ │      Alice 👋                    │ ← Wave emoji
┃ │      Wants to meet [Nudge Back]  │ ← Green text & special button
┗━┷━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
   ↑ Light green background
```

**PASS/FAIL:** _________

---

## 🎯 Test 2: Instant Match on "Nudge Back"

**What we're testing:** Tapping "Nudge Back" triggers immediate Green Light.

### Steps:

1. Continue from Test 1 (Alice has nudged Bob, Bob sees green indicators)

2. **Device B (Bob):**
   - Tap **"Nudge Back"** on Alice's card
   - ✅ **No alert should appear** (this is important!)
   - ✅ **Immediately** navigate to Green Light screen

3. **Both Devices (Simultaneously):**
   - ✅ Full-screen **bright green** background
   - ✅ **Pulse animation** (circle growing/shrinking)
   - ✅ **Phone vibrates** (3 pulses: heavy → heavy → medium)
   - ✅ Matched user's **photo and name** displayed
   - ✅ Text: "You matched with [Name]"
   - ✅ "Back to Radar" button at bottom

4. **Timing Check:**
   - From tapping "Nudge Back" to Green Light should be **<500ms**
   - Both screens should light up **within 1 second** of each other

**PASS/FAIL:** _________

---

## 🎯 Test 3: Multiple Interested Users

**What we're testing:** Multiple people can nudge you, all show green indicators.

### Steps:

1. **Device C (Charlie):**
   - Create new profile: "Charlie", age: 28
   - Make sure location is within 100m of Bob
   - Tap "Nudge" on Bob

2. **Device B (Bob) - CHECK:**
   - ✅ Now sees **TWO** cards with green indicators:
     - Alice's card (from Test 1)
     - Charlie's card (new)
   - ✅ Both have green borders
   - ✅ Both show "Wants to meet"
   - ✅ Both have "Nudge Back" button

3. **Device B (Bob):**
   - Can tap "Nudge Back" on either Alice OR Charlie
   - Each triggers separate Green Light

**PASS/FAIL:** _________

---

## 🎯 Test 4: Real-time Update Speed

**What we're testing:** Visual updates happen within 1 second.

### Steps:

1. Start a timer app on your phone
2. **Device A:** Tap "Nudge" → Start timer
3. **Device B:** When you see green border appear → Stop timer
4. ✅ Time should be **<2 seconds** (ideally <1 second)

**Measured Time:** _________ seconds

**PASS/FAIL:** _________

---

## 🎯 Test 5: After Match Behavior

**What we're testing:** After matching, users can return to radar.

### Steps:

1. After Green Light appears (from Test 2)
2. **Both Devices:**
   - Tap **"Back to Radar"** button
   - ✅ Return to dashboard
   - ✅ Both users still in radar feed
   - ✅ Both buttons show "Nudged ✓"
   - ✅ Cards might still have green indicators (they already matched)

**PASS/FAIL:** _________

---

## 🎯 Test 6: Pull-to-Refresh Updates

**What we're testing:** Manual refresh updates nudge status.

### Steps:

1. **Device A:** Nudge a new user (Device D)
2. **Device D:** Don't refresh yet
3. **Device D:** Pull down to refresh
4. ✅ Should see Device A's card with green indicators after refresh

**PASS/FAIL:** _________

---

## 🐛 Troubleshooting

### "No one nearby" even with 2 devices

**Solution:**
1. Verify both users have status toggle **ON**
2. Check location permissions granted
3. Verify you're using nearby coordinates (within 100m)
4. For testing: Change `PROXIMITY_RADIUS` in `src/constants/theme.js` to `100000` (100km)

### Green indicators not appearing

**Check:**
1. Open React Native debugger (Cmd+D on iOS, Cmd+M on Android)
2. Look for errors in console
3. Verify Supabase real-time is enabled for `nudges` table
4. Check Network tab - should see WebSocket connection
5. Manually refresh: Pull down on radar feed

### Green Light not appearing

**Check:**
1. Verify both nudges exist in Supabase:
   ```sql
   SELECT * FROM nudges;
   ```
2. Test SQL function:
   ```sql
   SELECT check_mutual_nudge('user_a_id', 'user_b_id');
   ```
3. Check React Native debugger for navigation errors

### Visual indicators are wrong

**Expected colors:**
- Border: `#00FF00` (bright green)
- Background: `#00FF0033` (green with 20% opacity)
- Text: `#00FF00` (bright green)

**Check:**
- Verify `COLORS.green` and `COLORS.greenGlow` in `src/constants/theme.js`

---

## 📊 Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| 1. Visual Indicators | ⬜ PASS / ⬜ FAIL | |
| 2. Instant Match | ⬜ PASS / ⬜ FAIL | |
| 3. Multiple Users | ⬜ PASS / ⬜ FAIL | |
| 4. Real-time Speed | ⬜ PASS / ⬜ FAIL | |
| 5. After Match | ⬜ PASS / ⬜ FAIL | |
| 6. Pull-to-Refresh | ⬜ PASS / ⬜ FAIL | |

---

## 📸 Screenshot Checklist

Capture these moments:

- [ ] Standard card (no interest)
- [ ] Card with green indicators ("Wants to meet")
- [ ] "Nudge Back" button
- [ ] Green Light screen
- [ ] Multiple green-bordered cards
- [ ] After returning from match

---

## ✅ Success Criteria

**All tests pass if:**
- ✅ Green indicators appear within 1 second
- ✅ "Nudge Back" triggers instant Green Light (no alert)
- ✅ Visual design matches specification (green border, emoji, label)
- ✅ Multiple interested users all show correctly
- ✅ Both devices vibrate on match
- ✅ Real-time updates work reliably

---

## 🎉 If All Tests Pass

Congratulations! The visual nudge system is working perfectly. The app now:
- Makes interest signals **visible** instead of hidden
- Reduces friction with "Nudge Back" button
- Provides instant matching feedback
- Updates in real-time (<1 second)

**Next steps:**
- Test with real GPS movement (walk around)
- Test with poor network connection
- Test edge cases (airplane mode, etc.)
- Move to Task #10: Polish & Testing

---

## 📝 Notes

Use this space to record any issues or observations:

```
_______________________________________________________
_______________________________________________________
_______________________________________________________
```
