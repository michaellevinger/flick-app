# Number Exchange (The Off-Ramp) - Setup Guide

## Overview

The Number Exchange feature allows matched users to securely share phone numbers with strict privacy controls:
- ✅ 15-minute self-destruct timer
- ✅ Proximity-based auto-wipe (>100m)
- ✅ Only accessible after mutual match (Green Light)
- ✅ Both users must consent

---

## 🗄 Database Setup

### Step 1: Run the Exchange Schema

After setting up the base database (`supabase-setup.sql`), run the exchange schema:

```bash
# In Supabase SQL Editor
```

Open `supabase-exchanges-schema.sql` and run it. This creates:

- **`exchanges` table** - Temporary number storage
- **`phone_number` column** in `users` table
- **SQL functions**:
  - `cleanup_expired_exchanges()` - Auto-delete after 15 min
  - `get_active_exchange()` - Get current exchange for user
- **RLS policies** - Row-level security for privacy

### Step 2: Verify Tables Created

```sql
-- Check exchanges table exists
SELECT * FROM exchanges LIMIT 1;

-- Check users table has phone_number column
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'phone_number';
```

---

## 🔄 Auto-Cleanup Integration

The Edge Function now handles both:
1. Inactive users (20 min)
2. Expired exchanges (15 min)

No additional setup needed - it's already included!

---

## 🎯 How It Works

### The Flow

1. **Match Happens** → Users see Green Light screen
2. **User A clicks** "Request Number" → Enters their phone number
3. **User B receives** modal: "User A wants to exchange numbers. Accept?"
4. **User B accepts** → Both navigate to Vault Screen
5. **Vault displays**:
   - Both phone numbers
   - 15-minute countdown timer
   - Quick actions (Call, Text, Save)
   - Privacy warnings
6. **Self-Destruct triggers** when:
   - Timer reaches 00:00, OR
   - Either user moves >100m away

### Privacy Guarantees

✅ **15-minute TTL** - Numbers permanently deleted after timer
✅ **Proximity-based wipe** - Checked every 30 seconds
✅ **No history** - No record after deletion
✅ **Consent required** - Both users must agree
✅ **Optional feature** - Can skip phone number entirely

---

## 📱 User Experience

### Setup Phase (Optional)

During profile creation, users can optionally provide:
- Phone number (not required)
- Can be added/updated later

### Green Light Phase

After matching, users see:
- **"Request Number"** button
- Tapping opens phone number input modal
- Sends request to other user

### Request/Response

**Sender sees:**
- "Waiting for response..." message
- Cannot send duplicate requests

**Receiver sees:**
- Modal: "[Name] wants to exchange numbers. Accept?"
- Warning: "Both numbers visible for 15 minutes"
- Accept / Decline buttons

### Vault Phase

Both users see Vault Screen with:

```
⚠️ Self-Destruct Timer
For your privacy, this data self-destructs in 14:32
Save it to your contacts now.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your Number
(555) 123-4567

Alice's Number
(555) 987-6543

[📞 Call] [💬 Text] [💾 Save]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔒 This exchange will self-destruct if:
• Timer reaches 00:00
• Either person moves >100m away
• You close this screen
```

### Quick Actions

- **Call** - Opens phone app with number
- **Text** - Opens messaging app
- **Save** - Shows copy prompt (manual save to contacts)

---

## 🧪 Testing the Feature

### Test Scenario 1: Basic Exchange

1. **Device A & B**: Create profiles with phone numbers
2. **Both**: Nudge each other → Green Light appears
3. **Device A**: Tap "Request Number"
4. **Device A**: Enter phone number → Tap "Send Request"
5. **Device B**: Modal appears with request
6. **Device B**: Tap "Accept"
7. **Both Devices**: Navigate to Vault Screen
8. **Verify**:
   - ✅ Both numbers visible
   - ✅ 15-minute timer counting down
   - ✅ Quick action buttons work
   - ✅ Warning messages displayed

### Test Scenario 2: 15-Minute Expiration

1. Continue from Scenario 1
2. Wait 15 minutes (or change timer in code for testing)
3. **Expected**: Both devices show "Self-Destruct" alert
4. **Navigate** to Dashboard
5. **Check database**:
   ```sql
   SELECT * FROM exchanges WHERE status = 'accepted';
   -- Should return 0 rows
   ```

### Test Scenario 3: Proximity Wipe

1. Continue from Scenario 1
2. **Device A**: Change simulator location >100m away
   - iOS: Debug → Location → Custom Location
   - Add 0.001 to latitude (~111m)
3. Wait 30 seconds (proximity check interval)
4. **Expected**: "Self-Destruct" alert with distance reason
5. **Check database**: Exchange deleted

### Test Scenario 4: Decline Request

1. **Devices**: Match via nudges
2. **Device A**: Request number
3. **Device B**: Tap "Decline"
4. **Expected**:
   - Request deleted
   - No vault access
   - Can request again later

### Test Scenario 5: No Phone Number

1. **Device A**: Profile without phone number
2. **Device B**: Profile with phone number
3. **Match** occurs
4. **Device B**: Try to request number from A
5. **Expected**: Error - "User hasn't set phone number"

---

## 🔧 Configuration

### Adjust Timer Duration

In `src/screens/VaultScreen.js`:

```javascript
const [timeRemaining, setTimeRemaining] = useState(900); // 900 = 15 minutes
```

Change `900` to desired seconds:
- 5 minutes = `300`
- 10 minutes = `600`
- 20 minutes = `1200`

### Adjust Proximity Check Interval

In `src/screens/VaultScreen.js`:

```javascript
proximityCheckInterval.current = setInterval(async () => {
  await checkProximity();
}, 30000); // 30 seconds
```

Change `30000` to desired milliseconds.

### Adjust Proximity Threshold

In `src/lib/vault.js` → `checkExchangeProximity()`:

```javascript
return {
  shouldWipe: distance > 100, // 100 meters
  distance,
};
```

Change `100` to desired distance in meters.

---

## 🐛 Troubleshooting

### "User hasn't set phone number"

**Cause**: Other user didn't provide phone during setup
**Solution**: They need to re-create profile with phone number
**Future**: Add "Update Phone" in settings

### Vault screen doesn't appear

**Check**:
1. Exchange accepted in database?
   ```sql
   SELECT * FROM exchanges WHERE status = 'accepted';
   ```
2. Navigation registered in App.js?
3. React Native debugger for errors

### Timer doesn't countdown

**Check**:
1. `timeRemaining` state updating?
2. `useEffect` cleanup function working?
3. Check console for `setInterval` errors

### Proximity wipe not working

**Check**:
1. Location permissions granted?
2. `checkProximity()` function running? (add console.log)
3. Distance calculation correct?
4. Test with exaggerated distance (1km+)

### Numbers not deleted after timer

**Check**:
1. Edge Function running?
   ```bash
   supabase functions logs auto-cleanup
   ```
2. SQL function working?
   ```sql
   SELECT cleanup_expired_exchanges();
   ```
3. Check `expires_at` timestamp correct

---

## 🔒 Security & Privacy

### What Gets Stored

**During active exchange:**
- Both phone numbers (encrypted in transit)
- Exchange status
- Expiration timestamp
- User IDs

**After expiration:**
- NOTHING - completely deleted

### What Doesn't Get Stored

- ❌ Call/text history
- ❌ Number usage logs
- ❌ Previous exchanges
- ❌ Declined requests

### RLS Policies

Row-Level Security ensures:
- Users only see their own exchanges
- Cannot read other people's numbers
- Cannot modify others' exchanges

---

## 📊 Database Queries

### View Active Exchanges

```sql
SELECT
  e.*,
  u1.name as user_a_name,
  u2.name as user_b_name,
  EXTRACT(EPOCH FROM (e.expires_at - NOW())) as seconds_remaining
FROM exchanges e
JOIN users u1 ON e.user_a_id = u1.id
JOIN users u2 ON e.user_b_id = u2.id
WHERE e.status = 'accepted'
AND e.expires_at > NOW()
ORDER BY e.created_at DESC;
```

### Manual Cleanup

```sql
-- Delete expired exchanges
SELECT cleanup_expired_exchanges();

-- Delete specific exchange
DELETE FROM exchanges WHERE id = 'exchange-id-here';

-- Delete all exchanges for testing
DELETE FROM exchanges;
```

### Usage Statistics

```sql
-- Total exchanges created today
SELECT COUNT(*) FROM exchanges
WHERE created_at > CURRENT_DATE;

-- Acceptance rate
SELECT
  COUNT(CASE WHEN status = 'accepted' THEN 1 END)::float / COUNT(*) * 100 as acceptance_rate
FROM exchanges
WHERE created_at > CURRENT_DATE;
```

---

## ✅ Launch Checklist

Before enabling number exchange in production:

- [ ] Database schema deployed
- [ ] Edge Function includes exchange cleanup
- [ ] Tested 15-minute expiration
- [ ] Tested proximity-based wipe
- [ ] Tested request/accept/decline flow
- [ ] Verified complete data deletion
- [ ] Privacy policy updated (mention number exchange)
- [ ] Terms of service include ephemeral data clause
- [ ] Users warned about self-destruct timer
- [ ] Quick actions (call/text/save) work on real devices

---

## 🎉 Success Criteria

Feature is working correctly if:

✅ Request/accept flow is smooth
✅ Vault displays both numbers correctly
✅ Timer counts down accurately
✅ Numbers deleted after 15 minutes
✅ Proximity wipe works when >100m
✅ No database records after expiration
✅ Real-time updates work
✅ Privacy warnings are prominent

---

## 📝 Notes

- Phone numbers are optional - users can skip this feature entirely
- Format validation is minimal - users can enter any format
- No verification (SMS codes, etc.) - just display what user entered
- International numbers supported (no country restrictions)
- Can only have 1 active exchange at a time per user pair

---

**The Off-Ramp is now complete!** Users can safely exchange numbers with automatic privacy protection. 🚀
