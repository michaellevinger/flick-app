# Event Isolation Implementation

## What Was Implemented ✅

Event isolation ensures users only see other users from the same event/wedding. When someone scans a QR code, they join that specific "room" and cannot see users from other events.

## Changes Made

### 1. Database Function Created
**File:** `migrations/add-event-isolation.sql`

- ✅ Adds `festival_id` column to `users` table (if not exists)
- ✅ Creates index on `festival_id` for performance
- ✅ Creates `find_users_in_festival()` SQL function
- ✅ Filters users by same festival ID
- ✅ Applies gender preference filtering
- ✅ Returns only active users (within 20 minutes)

### 2. App Code Updated
**File:** `src/lib/database.js`

- ✅ Added `findUsersInFestival()` function
- ✅ Calls the SQL function with festival_id and gender preferences
- ✅ Handles errors and returns normalized data

### 3. Existing Flow Verified
The app already had the infrastructure in place:

- ✅ `QRScannerScreen` extracts festival ID from QR code
- ✅ `NameScreen` → `BirthdayScreen` → `GenderScreen` → `LookingForScreen` → `BioScreen` → `PhotosScreen` all pass `festivalId`
- ✅ `userContext.createUser()` stores `festival_id` in database
- ✅ `DashboardScreen` already calls `findUsersInFestival()` with user's festival_id

## How It Works 🎯

### User Flow:

1. **Scan QR Code** → Extracts `festivalId` (e.g., "sarah-john-wedding-2026")
2. **Create Profile** → Store `festival_id` with user data
3. **View Radar** → Only shows users with matching `festival_id`

### Example:

```
Sarah & John's Wedding QR Code → festivalId: "sarah-john-wedding-abc123"

Users who scan this QR:
- Alice (festival_id: "sarah-john-wedding-abc123") ✅
- Bob (festival_id: "sarah-john-wedding-abc123") ✅
- Charlie (festival_id: "sarah-john-wedding-abc123") ✅

Users from different events:
- Dave (festival_id: "mike-emma-wedding-xyz789") ❌ HIDDEN
- Eve (festival_id: "coachella2024") ❌ HIDDEN
```

### SQL Query Logic:

```sql
WHERE u.festival_id = user_festival_id  -- Same event only
  AND u.id != current_user_id           -- Not yourself
  AND u.status = true                   -- Active users
  AND u.last_heartbeat > NOW() - INTERVAL '20 minutes'  -- Online
  AND (gender preferences match)        -- Mutual compatibility
```

## Next Steps - ACTION REQUIRED! 🚨

### You Must Run the Migration:

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project
   - Navigate to SQL Editor

2. **Run the Migration**
   ```bash
   # Copy the contents of this file:
   migrations/add-event-isolation.sql

   # Paste into Supabase SQL Editor
   # Click "Run"
   ```

3. **Verify Success**
   You should see these messages:
   ```
   NOTICE: SUCCESS: festival_id column exists on users table
   NOTICE: SUCCESS: find_users_in_festival function exists
   NOTICE: Event isolation migration completed successfully!
   ```

## Testing Event Isolation 🧪

### Test Scenario 1: Same Event (Should See Each Other)

1. **Device A:**
   - Scan QR for "Test Wedding 1"
   - Create profile as "Alice"

2. **Device B:**
   - Scan SAME QR for "Test Wedding 1"
   - Create profile as "Bob"

3. **Expected Result:**
   - Alice sees Bob in radar ✅
   - Bob sees Alice in radar ✅

### Test Scenario 2: Different Events (Should NOT See Each Other)

1. **Device A:**
   - Scan QR for "Test Wedding 1"
   - Create profile as "Alice"

2. **Device B:**
   - Scan QR for "Test Wedding 2" (DIFFERENT event)
   - Create profile as "Charlie"

3. **Expected Result:**
   - Alice does NOT see Charlie ❌
   - Charlie does NOT see Alice ❌

### Test Scenario 3: Gender Filtering + Event Isolation

1. **Device A:**
   - Scan QR for "Test Wedding 1"
   - Profile: Female looking for Male

2. **Device B:**
   - Scan SAME QR for "Test Wedding 1"
   - Profile: Male looking for Female

3. **Device C:**
   - Scan SAME QR for "Test Wedding 1"
   - Profile: Female looking for Male

4. **Expected Result:**
   - Device A (Female) sees Device B (Male) ✅
   - Device A (Female) does NOT see Device C (Female) ❌
   - Device B (Male) sees Device A (Female) ✅
   - Device B (Male) does NOT see Device C (Female) ❌

## Debugging

### Check User's Festival ID:

```sql
SELECT id, name, festival_id FROM users WHERE name = 'Alice';
```

### Check Who Should See Each Other:

```sql
SELECT * FROM find_users_in_festival(
  'sarah-john-wedding-abc123',  -- festival_id
  'user_alice',                 -- current user
  'female',                     -- current user gender
  'male'                        -- current user looking for
);
```

### Check All Users in an Event:

```sql
SELECT id, name, gender, looking_for, festival_id
FROM users
WHERE festival_id = 'sarah-john-wedding-abc123';
```

## Benefits of Event Isolation 🎉

✅ **Privacy:** Wedding guests don't appear in other events
✅ **Focus:** Users only see relevant matches from their event
✅ **B2B Value:** Each event is a separate "instance" of the app
✅ **Scalability:** Multiple events can run simultaneously without interference
✅ **Analytics:** Track engagement per event/wedding

## Technical Notes

- **Performance:** Uses database index on `festival_id` for fast queries
- **No Location Filtering:** Removed 500m radius check (events are isolated by QR, not location)
- **Active Users Only:** Shows users active within last 20 minutes
- **Gender Filtering:** Applied on top of event isolation
- **Cascade Delete:** If festival deleted, users' festival_id set to NULL

## Files Modified

- ✅ `migrations/add-event-isolation.sql` (NEW)
- ✅ `src/lib/database.js` (Added `findUsersInFestival` function)
- ✅ `docs/EVENT-ISOLATION-IMPLEMENTATION.md` (This file)

## Rollback (If Needed)

If you need to revert to location-based filtering:

```sql
-- Remove festival_id column
ALTER TABLE users DROP COLUMN IF EXISTS festival_id;

-- Drop the festival function
DROP FUNCTION IF EXISTS find_users_in_festival;
```

Then in `src/lib/database.js`, change DashboardScreen back to use `findNearbyUsers()`.

---

**Status:** ✅ Implementation Complete - Migration Ready to Run
**Date:** 2026-02-26
**Next Action:** Run `migrations/add-event-isolation.sql` in Supabase
