# Testing the Nudge System

This guide will help you test the complete Nudge & Green Light feature.

## What's Been Implemented

✅ **Send Nudge**: Tap "Nudge" button on any nearby user
✅ **Visible Interest Signals**: Users who nudged you show with green border + "Wants to meet" label
✅ **Nudge Back**: One-tap match when nudging someone who already nudged you
✅ **Visual Feedback**: Cards highlight interested users with wave emoji (👋)
✅ **Mutual Match Detection**: Instant Green Light when reciprocated
✅ **Green Light Screen**: Full-screen green with haptic pulse
✅ **Real-time Updates**: Interest signals update instantly
✅ **Haptic Feedback**: Heavy vibration on match

## Prerequisites

Before testing, make sure:
- [ ] Supabase is set up and credentials are in `src/lib/supabase.js`
- [ ] You've run `supabase-setup.sql` (includes nudges table)
- [ ] You have 2 devices or simulators available
- [ ] Both devices can run the app

## Testing Setup

### Option 1: Two Physical Devices (Ideal)

1. Install Expo Go on both devices
2. Run `npx expo start` on your computer
3. Scan QR code on both devices
4. Stand within 100m of each other

### Option 2: Two Simulators (Easier)

1. Open 2 iOS simulators or Android emulators
2. Run `npx expo start`
3. Press `i` twice (or `a` twice) to open app on both
4. Set custom locations that are near each other:
   - **iOS**: Debug → Location → Custom Location
   - **Android**: Extended Controls → Location

### Option 3: One Simulator + One Physical (Mixed)

1. Run app on simulator and physical device
2. Mock location on simulator to match your real location

## Test Scenarios

### Scenario 1: One-Way Nudge

**Expected Behavior**: User A nudges User B, and B sees visual indicator.

**Steps:**
1. On **Device A**: Create profile as "Alice"
2. On **Device B**: Create profile as "Bob"
3. Verify both see each other in radar (pull to refresh if needed)
4. On **Device A**: Tap "Nudge" next to Bob
5. **Expected Result on Device A**:
   - Alert appears: "Nudge Sent - Bob will see you're interested!"
   - Button changes to "Nudged ✓" (gray, disabled)
6. **Expected Result on Device B** (real-time update):
   - Alice's card shows green left border
   - Alice's card has light green background glow
   - Alice's selfie has green 3px border
   - Wave emoji (👋) appears next to Alice's name
   - Label shows "Wants to meet" (in green)
   - Button changes to "Nudge Back"
   - No Green Light screen yet

### Scenario 2: Mutual Match (The Green Light!)

**Expected Behavior**: When Bob taps "Nudge Back" on Alice's card, instant Green Light for both!

**Steps:**
1. Continue from Scenario 1 (Alice has already nudged Bob)
2. On **Device B** (Bob): See Alice's card with green indicators
3. On **Device B** (Bob): Tap "Nudge Back" button
4. **Expected Result on Device B** (immediate):
   - Green Light screen appears instantly (no alert)
   - Screen is bright green with pulse animation
   - Phone vibrates (3 pulses: heavy → heavy → medium)
   - Shows Alice's photo and name
   - Text: "You matched with Alice"
5. **Expected Result on Device A** (Alice, simultaneously):
   - Green Light screen appears at the same time
   - Same visual/haptic feedback
   - Shows Bob's photo and name
   - Text: "You matched with Bob"

### Scenario 3: Returning from Green Light

**Steps:**
1. From Green Light screen, tap "Back to Radar"
2. **Expected Result**:
   - Returns to dashboard
   - Both users still see each other in radar
   - Both buttons show "Nudged ✓"

### Scenario 4: Already Nudged Prevention

**Steps:**
1. After nudging a user, try tapping "Nudge" again
2. **Expected Result**:
   - Button is disabled (gray)
   - No action occurs
   - Text shows "Nudged ✓"

### Scenario 5: Real-time Visual Updates

**Expected Behavior**: User B's UI updates instantly when User A nudges them.

**Steps:**
1. On **Device A** (new user "Charlie"): Nudge "Diana"
2. On **Device B** (Diana): Watch the radar feed
3. **Expected Result on Device B** (within 1 second):
   - Charlie's card updates with green border
   - "Wants to meet" label appears
   - Wave emoji (👋) appears
   - Button changes to "Nudge Back"
   - Card background gets green glow
4. When Diana taps "Nudge Back" → Instant Green Light for both!

### Scenario 6: Multiple Users

**Steps:**
1. Have 3+ users within range
2. User A nudges User B and User C
3. **Expected Result**:
   - User A can nudge multiple people
   - Each shows "Nudged ✓" individually
   - Match only happens when reciprocated

## Debugging Checklist

### "No one nearby yet" even with multiple devices

- [ ] Check that both users have status toggle ON
- [ ] Verify location permissions are granted
- [ ] Pull down to refresh
- [ ] Check Supabase Table Editor → users table (both users should exist)
- [ ] Verify `PROXIMITY_RADIUS` is set correctly (default 100m)
- [ ] For testing, temporarily increase radius in `src/constants/theme.js`

### "Nudge" button does nothing

- [ ] Check React Native debugger console for errors
- [ ] Verify Supabase credentials are correct
- [ ] Check Supabase → Table Editor → nudges table exists
- [ ] Check that `check_mutual_nudge()` function exists in database

### Green Light screen doesn't appear

- [ ] Check that both users actually nudged each other
- [ ] Verify `check_mutual_nudge()` function works:
   ```sql
   SELECT check_mutual_nudge('user_a_id', 'user_b_id');
   ```
- [ ] Check React Native debugger for navigation errors
- [ ] Verify GreenLightScreen is in App.js navigation stack

### No haptic feedback

- [ ] Check that device supports haptics (not all simulators do)
- [ ] Try on physical device
- [ ] Verify `expo-haptics` is installed
- [ ] Check that device is not in silent/vibration-off mode

### Real-time subscription not working

- [ ] Check Supabase → Database → Replication settings
- [ ] Verify real-time is enabled for `nudges` table
- [ ] Check console for subscription errors
- [ ] Try refreshing the page/app

## Database Verification

### Check if nudge was sent

```sql
SELECT * FROM nudges WHERE from_user_id = 'user_id_here';
```

### Check for mutual match

```sql
SELECT check_mutual_nudge('user_a_id', 'user_b_id');
-- Returns: true or false
```

### View all nudges

```sql
SELECT
  n.*,
  u1.name as from_name,
  u2.name as to_name
FROM nudges n
JOIN users u1 ON n.from_user_id = u1.id
JOIN users u2 ON n.to_user_id = u2.id
ORDER BY n.created_at DESC;
```

### Cleanup nudges (for testing)

```sql
DELETE FROM nudges;
```

## Expected User Experience

1. **Discovery**: See people nearby in radar
2. **Interest**: Tap "Nudge" on someone interesting
3. **Feedback**: Button shows "Nudged ✓"
4. **Their View**: They see your card with green border + "Wants to meet"
5. **Reciprocation**: If interested, they tap "Nudge Back"
6. **Match**: Instant GREEN LIGHT + vibration for both
7. **Action**: "They're nearby. Go say hi!"

**Key Difference from Before**: Interest signals are now **visible** in the feed, not hidden. No more guessing who might be interested!

## Performance Notes

- Nudges are checked instantly via Supabase RPC
- Real-time subscriptions use WebSocket (very fast)
- Haptic feedback fires in <100ms
- Green Light screen animates smoothly (60fps)

## What's Not Implemented Yet

🚧 **Number Exchange**: "Exchange Number" button is a placeholder
🚧 **Match History**: No persistent log of matches
🚧 **Distance-based Dissolution**: Matches don't auto-delete when users move >100m apart (yet)
🚧 **Push Notifications**: No background notifications when nudged

## Next Steps

After confirming the Nudge system works:
1. Test with real users in the wild
2. Implement number exchange flow
3. Add match persistence (temporary)
4. Implement auto-dissolution when distance > 100m
5. Polish animations and timing

---

**Need Help?**
- Check Supabase logs: Dashboard → Logs
- Check React Native debugger: Shake device → Remote Debugging
- Review CLAUDE.md for implementation details
