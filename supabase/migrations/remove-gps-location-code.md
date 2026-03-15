# Remove GPS/Location Code - Migration Guide

**Date:** 2026-03-10
**Reason:** Simplify app to be purely event-based (no distance filtering)

## Summary

Removing all GPS/location tracking functionality. The app will show all users in the same festival/event regardless of physical distance.

### Before (500M Radar Model):
- Users needed to be within 500 meters to see each other
- Location permissions required
- PostGIS location column in database
- Heartbeat updates with location
- Distance-based match cleanup

### After (Event-Only Model):
- Users in same festival_id see each other (no distance limit)
- No location permissions needed
- No location tracking
- Simpler, more reliable
- Better for weddings/events where venue size < 500m anyway

---

## Files Being Deleted

### 1. `src/lib/location.js` - ENTIRE FILE
- `requestLocationPermission()`
- `getCurrentLocation()`
- `calculateDistance()`
- `parseGeographyPoint()`
- `formatDistance()`

### 2. `src/lib/matchCleanup.js` - ENTIRE FILE (if exists)
- Distance-based match dissolution
- No longer needed

---

## Files Being Modified

### 3. `src/lib/userContext.js`
**Remove:**
- `updateLocation()` function
- Location tracking in heartbeat
- All imports from `./location`

**Keep:**
- User state management
- Heartbeat (without location)
- Festival tracking

### 4. `src/lib/database.js`
**Remove:**
- `findNearbyUsers()` function
- `updateUserLocation()` function
- `location` parameter from `upsertUser()`
- PostGIS POINT formatting

**Keep:**
- `upsertUser()` (without location)
- All other user operations

### 5. `src/screens/DashboardScreen.js`
**Remove:**
- `initializeLocation()` function
- `requestLocationPermission` import
- `formatDistance` import and usage
- All location-related state
- Distance display in UI

**Keep:**
- `findUsersInFestival()` calls (event-based)
- All matching/flick logic
- Real-time subscriptions

### 6. `src/screens/VaultScreen.js`
**Remove:**
- `getCurrentLocation` import
- Distance-based vault cleanup logic

**Keep:**
- Time-based vault cleanup (15min TTL)

### 7. `src/constants/theme.js`
**Remove:**
- `PROXIMITY_RADIUS` constant

**Keep:**
- All other theme constants

---

## Database Changes (Optional - for cleanup)

The `location` column in the `users` table can be dropped, but it's not required. Leaving it doesn't hurt.

```sql
-- Optional: Remove location column from users table
ALTER TABLE users DROP COLUMN IF EXISTS location;

-- Optional: Drop PostGIS function (if not used elsewhere)
DROP FUNCTION IF EXISTS find_nearby_users;

-- Optional: Drop location index
DROP INDEX IF EXISTS users_location_idx;
```

**Note:** Don't run these unless you're sure you want to permanently remove location data.

---

## Testing After Removal

1. **Guest Flow:**
   - Scan QR code
   - Complete profile
   - See other users in same event immediately (no location prompt)

2. **Matching:**
   - Flick users in same event
   - Verify matches work
   - Check chat functionality

3. **No Permission Prompts:**
   - Verify app never asks for location permission
   - Check Settings → Permissions (should be empty)

4. **Event Switching:**
   - Join event A → see users in A
   - Scan new QR for event B → see users in B (not A)

---

## Rollback Plan

If you need to restore location functionality:

1. Restore these files from git:
   ```bash
   git checkout main -- src/lib/location.js
   git checkout main -- src/lib/matchCleanup.js
   ```

2. Restore location code in other files:
   ```bash
   git diff main -- src/lib/userContext.js
   git diff main -- src/lib/database.js
   git diff main -- src/screens/DashboardScreen.js
   ```

3. Reinstall expo-location:
   ```bash
   npm install expo-location
   ```

---

## Benefits of Removal

✅ **Simpler:** No location permissions or tracking
✅ **More Reliable:** No GPS accuracy issues
✅ **Better UX:** Users see everyone at event immediately
✅ **Privacy:** No location data collected
✅ **Faster:** No distance calculations
✅ **Event-Focused:** Matches original wedding use case

---

## Implementation Checklist

- [ ] Delete `src/lib/location.js`
- [ ] Delete `src/lib/matchCleanup.js` (if exists)
- [ ] Update `src/lib/userContext.js` (remove location tracking)
- [ ] Update `src/lib/database.js` (remove location functions)
- [ ] Update `src/screens/DashboardScreen.js` (remove location init)
- [ ] Update `src/screens/VaultScreen.js` (remove location imports)
- [ ] Update `src/constants/theme.js` (remove PROXIMITY_RADIUS)
- [ ] Remove `expo-location` from `package.json`
- [ ] Test guest flow end-to-end
- [ ] Verify users see each other in same event
- [ ] Commit changes with clear message
