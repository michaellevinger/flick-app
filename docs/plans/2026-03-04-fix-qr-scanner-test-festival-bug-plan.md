---
title: Fix QR Scanner Test Festival Bug
type: fix
status: active
date: 2026-03-04
priority: critical
---

# Fix QR Scanner Test Festival Bug

## Overview

**Critical bug**: Users see "Coachella 2024" test data in their event banner instead of their actual scanned event. This occurs when developers use the "Skip (Dev Only)" button, which hardcodes `'coachella2024'` as the festival ID. The test festival ID persists through AsyncStorage and database, causing users to join a non-existent test event instead of their real wedding/event.

**Impact**:
- Blocks users from joining real events
- Breaks event isolation (core feature)
- Confuses users with incorrect event names
- Prevents testing with multiple simultaneous events

**Affected Components**:
- QR Scanner (Skip button)
- Dashboard (Event banner display)
- Database (Test festivals and orphaned users)
- AsyncStorage (Cached festival IDs)

## Problem Statement / Motivation

### Current Behavior (Buggy)

1. Developer opens app → Taps "Scan Event QR"
2. Developer taps "Skip - Join Test Event" button
3. **Bug**: `QRScannerScreen.js:42` hardcodes `handleBarCodeScanned({ data: 'coachella2024' })`
4. AsyncStorage stores: `festivalId: "coachella2024"`
5. User profile created with: `festival_id: "coachella2024"`
6. Dashboard displays: "Coachella 2024" event banner
7. User stuck in test event, cannot see real event users

### Root Causes

**Primary Cause**: Hardcoded test festival ID in skip button
```javascript
// src/screens/QRScannerScreen.js:42-44
const handleSkip = () => {
  handleBarCodeScanned({ data: 'coachella2024' }); // ⚠️ THE BUG
};
```

**Contributing Factors**:
1. **Test Data Pollution**: Database contains sample festivals inserted during setup:
   - `'coachella2024'`, `'tomorrowland2024'`, `'lollapalooza2024'`
   - `'test-wedding-1'`, `'test-wedding-2'`

2. **Persistence Layer**: Festival ID persists through multiple mechanisms:
   - AsyncStorage: `await AsyncStorage.setItem('festivalId', 'coachella2024')`
   - Database: `user.festival_id = 'coachella2024'`

3. **Schema Mismatch**: `get_festival_info` SQL function references `description` column that doesn't exist in `festivals` table schema

4. **Incomplete Cache Clearing**: "Clear Cache (Debug)" button only clears AsyncStorage, not database user records

### Why This Matters

**Business Impact**:
- **B2B Value Prop at Risk**: Event hosts expect isolated guest pools per wedding/event
- **User Trust**: Showing wrong event name destroys credibility
- **Testing Blocked**: Cannot test multi-event scenarios with hardcoded festival ID

**Technical Impact**:
- **Event Isolation Broken**: Core feature requires correct festival_id associations
- **Data Integrity**: Orphaned users reference deleted festivals
- **Developer Experience**: Testing is cumbersome and error-prone

## Proposed Solution

### High-Level Approach

**Phase 1: Database Cleanup** (Prerequisite)
1. Audit existing users with test festival IDs
2. Add missing `description` column to `festivals` table
3. Run schema fix migration (`fix-get-festival-info.sql`)
4. Clear affected users' festival associations
5. Delete test festivals from database

**Phase 2: Code Fixes**
1. Update skip button to use static `'test-festival'` ID (already exists in schema)
2. Add `__DEV__` guard to hide skip button in production
3. Add festival validation in Dashboard (detect invalid festival_id on mount)
4. Improve "Clear Cache" button to delete database user records

**Phase 3: Testing & Validation**
1. Test skip button with fresh install
2. Test affected user recovery (manually set deleted festival_id)
3. Test clear cache with existing profile
4. Test real QR scan end-to-end
5. Verify no regression in existing flows

### Implementation Strategy

Use **static test festival** approach (Option A from SpecFlow):
- Leverage existing `'test-festival'` ID from `festivals-schema.sql:41`
- No need to dynamically create festivals
- Simple, reliable, no database pollution

```javascript
// NEW: src/screens/QRScannerScreen.js:42-44
const handleSkip = () => {
  handleBarCodeScanned({ data: 'test-festival' }); // ✅ Uses existing test festival
};
```

## Technical Considerations

### Architecture Impacts

**Event Isolation System**:
- No changes to core isolation logic
- Maintains foreign key relationship: `users.festival_id → festivals.id`
- SQL function `find_users_in_festival()` unchanged

**State Management**:
- AsyncStorage remains primary cache for festival ID
- UserContext continues managing user state
- Dashboard festival lookup unchanged (just gets correct data)

### Schema Changes Required

**Add Missing Column**:
```sql
-- migrations/add-description-column.sql
ALTER TABLE festivals ADD COLUMN IF NOT EXISTS description TEXT;
```

**Foreign Key Constraint** (Optional but Recommended):
```sql
-- Ensure data integrity for future
ALTER TABLE users
ADD CONSTRAINT users_festival_id_fkey
FOREIGN KEY (festival_id) REFERENCES festivals(id)
ON DELETE SET NULL;
```

### Performance Implications

- **No performance impact**: Same query patterns, just different festival IDs
- **Database cleanup**: Removes unused test data (marginal storage savings)
- **Migration time**: <5 seconds (small dataset)

### Security Considerations

- **Skip Button Exposure**: Add `__DEV__` guard to prevent production users from joining test events
- **Data Cleanup**: Ensure test festivals don't contain PII (they don't)
- **Cascade Deletes**: SET NULL instead of CASCADE to preserve user data if festival is deleted

### Data Migration Risks

**Critical Decision Points**:

1. **What happens to existing users with `festival_id = 'coachella2024'`?**
   - **Solution**: Update to NULL before deleting festivals
   ```sql
   UPDATE users
   SET festival_id = NULL
   WHERE festival_id IN ('coachella2024', 'tomorrowland2024', ...);
   ```

2. **Will `get_festival_info` break without `description` column?**
   - **Solution**: Add column before running function migration
   ```sql
   ALTER TABLE festivals ADD COLUMN IF NOT EXISTS description TEXT;
   ```

3. **What if production users exist with test festival IDs?**
   - **Solution**: Run audit query first, notify users via email if needed
   ```sql
   SELECT festival_id, COUNT(*)
   FROM users
   WHERE festival_id IN ('coachella2024', ...)
   GROUP BY festival_id;
   ```

## Acceptance Criteria

### Functional Requirements

- [ ] **Skip button uses `'test-festival'` ID** instead of `'coachella2024'`
  - File: `src/screens/QRScannerScreen.js:42-44`
  - Verification: Tap skip button → Dashboard shows "Test Festival" banner

- [ ] **Skip button hidden in production** via `__DEV__` guard
  - File: `src/screens/QRScannerScreen.js:185`
  - Verification: Production build doesn't show skip button

- [ ] **Test festivals deleted from database**
  - Migration: `migrations/cleanup-test-festivals.sql`
  - Verification: `SELECT * FROM festivals WHERE id IN ('coachella2024', ...)` returns 0 rows

- [ ] **`description` column added to festivals table**
  - Migration: `migrations/add-description-column.sql`
  - Verification: `\d festivals` shows description column

- [ ] **`get_festival_info` function fixed** to match schema
  - Migration: `migrations/fix-get-festival-info.sql`
  - Verification: `SELECT * FROM get_festival_info('test-festival')` returns valid result

- [ ] **Dashboard validates festival on mount**
  - File: `src/screens/DashboardScreen.js`
  - Verification: User with deleted festival_id sees error modal → redirects to QRScanner

- [ ] **Clear Cache deletes database user records**
  - File: `src/screens/WelcomeScreen.js:41-62`
  - Verification: Tap "Clear Cache" → `SELECT * FROM users WHERE id = '...'` returns 0 rows

### Edge Cases Handled

- [ ] **User with deleted festival_id**: Shows error modal → redirects to QR scanner
- [ ] **Existing user scans new QR**: Updates festival_id correctly
- [ ] **Multiple developers use skip button**: Each joins same `'test-festival'` (shared test pool)
- [ ] **Clear cache on fresh install**: Doesn't crash (handles null user gracefully)
- [ ] **Network failure during festival lookup**: Shows error toast, allows retry

### Testing Requirements

**Unit Tests** (Optional - Manual Testing Acceptable):
- `validateAndJoinFestival` handles non-existent festival IDs
- `getCurrentFestival` returns null gracefully when festival deleted
- `handleClearCache` clears both AsyncStorage and database

**Integration Tests**:
1. **Skip Button Flow**:
   - Fresh install → Tap skip → Create profile → Dashboard shows "Test Festival"

2. **Affected User Recovery**:
   - Manually set user's festival_id to 'coachella2024' in database
   - Open app → Dashboard shows error modal → Redirects to QRScanner

3. **Clear Cache Full Reset**:
   - Create profile → Tap "Clear Cache (Debug)"
   - Verify AsyncStorage empty: `await AsyncStorage.getItem('user')` → null
   - Verify database empty: `SELECT * FROM users WHERE id = '...'` → 0 rows

4. **Real QR Scan After Fix**:
   - Create new event via "Host An Event"
   - Scan generated QR code
   - Dashboard shows correct event name (not "Test Festival")

5. **Production Build Verification**:
   - Build production APK/IPA
   - QR Scanner screen doesn't show skip button

## Success Metrics

**Primary KPIs**:
- ✅ **Bug Reports**: Zero bug reports about "Coachella 2024" appearing in production
- ✅ **Event Isolation**: 100% of users see only their event's attendees
- ✅ **Developer Testing**: Skip button works for 100% of dev test runs

**Secondary Metrics**:
- **Data Cleanliness**: Zero users with `festival_id IN ('coachella2024', ...)`
- **Migration Success Rate**: 100% (no failed migrations)
- **User Recovery Rate**: 100% of affected users can rejoin events via QR scan

## Dependencies & Risks

### Prerequisites

**Database Access**:
- [x] Supabase SQL Editor access
- [x] Permission to run ALTER TABLE commands
- [x] Permission to DELETE rows from festivals table

**Development Environment**:
- [x] Expo CLI installed
- [x] React Native debugger
- [x] Test device/simulator

### External Dependencies

- **None**: All fixes are self-contained within app and database

### Blocking Issues

- **None Identified**: All prerequisites met, migrations ready to run

### Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Migration deletes production users** | Low | 🔴 Critical | Run audit query first; backup affected rows |
| **`get_festival_info` breaks before schema fix** | Medium | 🟡 High | Add description column before running function migration |
| **Users stuck with deleted festival_id** | High | 🟡 High | Add validation in Dashboard to detect + redirect |
| **Skip button still hardcoded after deploy** | Low | 🟡 High | Code review + test skip button before release |
| **Clear Cache doesn't fully reset state** | Medium | 🟢 Medium | Add database deletion to clear cache function |

### Rollback Plan

If migration causes issues:

```sql
-- Restore test festivals from backup
INSERT INTO festivals
SELECT * FROM festivals_backup;

-- Restore affected users (if needed)
UPDATE users
SET festival_id = 'test-festival'
WHERE festival_id IS NULL AND created_at > '2026-03-04';
```

## Implementation Phases

### Phase 1: Pre-Migration Audit (15 minutes)

**File**: None (SQL queries in Supabase)

1. Check for affected users: ✅ **COMPLETE - Zero affected users**
```sql
-- migrations/audit-affected-users.sql
SELECT festival_id, COUNT(*) as user_count
FROM users
WHERE festival_id IN ('coachella2024', 'tomorrowland2024', 'lollapalooza2024', 'test-wedding-1', 'test-wedding-2')
GROUP BY festival_id;
```

2. Verify description column exists: ✅ **COMPLETE - Column exists**
```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'festivals' AND column_name = 'description';
```

3. Backup test festivals:
```sql
CREATE TABLE festivals_backup AS
SELECT * FROM festivals
WHERE id IN ('coachella2024', 'tomorrowland2024', 'lollapalooza2024', 'test-wedding-1', 'test-wedding-2');
```

**Acceptance**:
- [x] Audit query results documented - Zero affected users
- [x] Backup table created successfully - No test festivals found (already clean)
- [x] Zero production users affected (or notification sent)

### Phase 2: Schema Fixes (10 minutes)

**File**: `migrations/add-description-column.sql` (NEW)

```sql
-- Add missing description column
ALTER TABLE festivals ADD COLUMN IF NOT EXISTS description TEXT;

-- Verify column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'festivals'
ORDER BY ordinal_position;
```

**File**: `migrations/fix-get-festival-info.sql` (EXISTING)

Run existing migration to fix function. Verify it works:

```sql
-- Test function
SELECT * FROM get_festival_info('test-festival');
```

**Acceptance**:
- [x] `description` column exists in festivals table
- [x] `get_festival_info('test-festival')` returns valid result
- [x] No SQL errors in Supabase logs

### Phase 3: Data Cleanup (10 minutes)

**File**: `migrations/clear-affected-users.sql` (NEW)

```sql
-- Clear affected users' festival associations
UPDATE users
SET festival_id = NULL
WHERE festival_id IN ('coachella2024', 'tomorrowland2024', 'lollapalooza2024', 'test-wedding-1', 'test-wedding-2');

-- Show affected count
SELECT COUNT(*) as cleared_users FROM users WHERE festival_id IS NULL;
```

**File**: `migrations/cleanup-test-festivals.sql` (EXISTING)

Run existing migration to delete test festivals. Verify:

```sql
-- Should return 0 rows
SELECT * FROM festivals
WHERE id IN ('coachella2024', 'tomorrowland2024', 'lollapalooza2024', 'test-wedding-1', 'test-wedding-2');
```

**Acceptance**:
- [ ] Test festivals deleted from database
- [ ] No users reference deleted festivals
- [ ] `'test-festival'` still exists for dev testing

### Phase 4: Code Updates (45 minutes)

#### 4.1: Fix Skip Button ✅ **COMPLETE**

**File**: `src/screens/QRScannerScreen.js`

```javascript
// OLD (Line 42-44):
const handleSkip = () => {
  handleBarCodeScanned({ data: 'coachella2024' }); // ❌ HARDCODED
};

// NEW:
const handleSkip = () => {
  handleBarCodeScanned({ data: 'test-festival' }); // ✅ Uses existing test festival
};
```

#### 4.2: Add __DEV__ Guard ✅ **COMPLETE**

**File**: `src/screens/QRScannerScreen.js` (Line ~185)

```javascript
// OLD:
<TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
  <Text style={styles.skipButtonText}>Skip - Join Test Event</Text>
</TouchableOpacity>

// NEW:
{__DEV__ && (
  <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
    <Text style={styles.skipButtonText}>Skip - Join Test Event</Text>
  </TouchableOpacity>
)}
```

#### 4.3: Add Festival Validation ✅ **COMPLETE**

**File**: `src/screens/DashboardScreen.js`

Add after existing useEffect hooks (around line 200):

```javascript
// Validate festival on mount
useEffect(() => {
  const validateFestival = async () => {
    if (!user?.festival_id) return;

    try {
      const festival = await getCurrentFestival(user.id);

      if (!festival) {
        Alert.alert(
          'Event Not Found',
          'This event is no longer available. Please scan a new QR code to join an event.',
          [
            {
              text: 'Scan QR Code',
              onPress: () => navigation.replace('QRScanner'),
            },
          ],
          { cancelable: false }
        );
      }
    } catch (error) {
      console.error('Error validating festival:', error);
    }
  };

  validateFestival();
}, [user?.festival_id]);
```

#### 4.4: Improve Clear Cache ✅ **COMPLETE**

**File**: `src/screens/WelcomeScreen.js` (Lines 41-62)

```javascript
// OLD:
const handleClearCache = async () => {
  try {
    await AsyncStorage.removeItem('festivalId');
    await AsyncStorage.removeItem('user');
    Alert.alert('Success', 'Cache cleared! Please restart the app.');
  } catch (error) {
    Alert.alert('Error', 'Failed to clear cache');
  }
};

// NEW:
const handleClearCache = async () => {
  Alert.alert(
    'Clear All Data',
    'This will delete your profile and all data. Continue?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear Everything',
        style: 'destructive',
        onPress: async () => {
          try {
            // Get user ID before clearing AsyncStorage
            const userData = await AsyncStorage.getItem('user');
            const user = userData ? JSON.parse(userData) : null;

            // Clear AsyncStorage first (never fails)
            await AsyncStorage.removeItem('festivalId');
            await AsyncStorage.removeItem('user');

            // Then try to delete from database
            if (user?.id) {
              const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', user.id);

              if (error) throw error;
            }

            Alert.alert('Success', 'All data cleared!');
          } catch (error) {
            console.error('Clear cache error:', error);
            Alert.alert(
              'Partial Success',
              'Cache cleared. Database cleanup may have failed. You can still use the app.'
            );
          }
        },
      },
    ]
  );
};
```

**Acceptance**:
- [x] Skip button updated (code review)
- [x] `__DEV__` guard added (code review)
- [x] Festival validation added (code review)
- [x] Clear Cache improved (code review)
- [ ] No TypeScript/ESLint errors
- [ ] App builds successfully

### Phase 5: Testing (1 hour)

**Test Scenarios**:

1. **Skip Button Test** (Fresh Install):
   - Uninstall app → Reinstall
   - Tap "Scan Event QR" → Tap "Skip - Join Test Event"
   - Create profile (name + age)
   - **Expected**: Dashboard shows "Test Festival" banner
   - **Pass Criteria**: ✅ Shows "Test Festival", not "Coachella 2024"

2. **Affected User Recovery Test**:
   - Manually update user in Supabase: `UPDATE users SET festival_id = 'deleted-festival' WHERE id = '...'`
   - Open app → Dashboard loads
   - **Expected**: Error modal appears → "Scan QR Code" button → Redirects to QRScanner
   - **Pass Criteria**: ✅ Error detected, user redirected gracefully

3. **Clear Cache Test**:
   - Create profile → Navigate to Dashboard
   - Tap "Clear Cache (Debug)" button on WelcomeScreen
   - Confirm deletion → Check Supabase SQL Editor
   - **Expected**: User row deleted from database
   - **Pass Criteria**: ✅ `SELECT * FROM users WHERE id = '...'` returns 0 rows

4. **Real QR Scan Test**:
   - Use "Host An Event" → Create new event
   - Generate QR code (use `generate-qr.html` tool)
   - Scan QR code with second device
   - **Expected**: Dashboard shows correct event name (not "Test Festival")
   - **Pass Criteria**: ✅ Correct event name displayed

5. **Production Build Test**:
   - Build production APK: `eas build --platform android --profile production`
   - Install on device → Open QRScanner
   - **Expected**: Skip button not visible
   - **Pass Criteria**: ✅ Skip button hidden in production

**Regression Tests**:
- [ ] Existing user can still see radar
- [ ] Nudge system works (send/receive)
- [ ] Chat system works (send messages)
- [ ] Profile photos upload correctly
- [ ] Location tracking still active (60s heartbeat)

**Acceptance**:
- [ ] All 5 test scenarios pass
- [ ] No regressions in existing features
- [ ] No console errors or warnings

## References & Research

### Internal References

**Core Bug Files**:
- `src/screens/QRScannerScreen.js:42-44` - Hardcoded skip button (THE BUG)
- `src/screens/DashboardScreen.js:175-184` - Festival display logic
- `src/screens/WelcomeScreen.js:41-62` - Clear Cache button
- `src/lib/festivals.js` - Festival validation and queries
- `src/lib/userContext.js` - User state management

**Database Schema**:
- `festivals-schema.sql:37-42` - Sample festival inserts
- `festivals-schema.sql:2-13` - Festivals table definition
- `migrations/add-event-isolation.sql` - Event isolation system
- `migrations/fix-get-festival-info.sql` - Function fix (has schema bug)
- `migrations/cleanup-test-festivals.sql` - Test data removal

**Documentation**:
- `CLAUDE.md:89-116` - User Flow (QR-First B2B Model)
- `CLAUDE.md:249-300` - The 500M Radar feature spec
- `QR-SYSTEM-GUIDE.md` - QR code system documentation
- `PROGRESS-2026-02-26.md` - Bug report and next steps

### External References

**React Native**:
- [AsyncStorage Best Practices](https://reactnative.dev/docs/asyncstorage) - Cache management patterns
- [Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/) - QR scanning implementation

**Supabase**:
- [Database Migrations](https://supabase.com/docs/guides/database/migrations) - Running SQL migrations
- [Foreign Key Constraints](https://supabase.com/docs/guides/database/tables#foreign-key-constraints) - ON DELETE behaviors

**PostgreSQL**:
- [ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html) - Adding columns
- [ON DELETE Actions](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK) - CASCADE vs SET NULL

### Related Work

**Previous Issues**:
- None (first major bug fix)

**Related Features**:
- Event Isolation System (implemented in `migrations/add-event-isolation.sql`)
- Auto-Wipe System (implemented in `supabase/functions/auto-cleanup/`)
- QR Generation Tools (`generate-qr.html`, `generate-qr.js`)

### Key Learnings from Research

**From repo-research-analyst**:
- Skip button hardcodes 'coachella2024' in QRScannerScreen.js:42
- Test festivals seeded during database setup (festivals-schema.sql:37-42)
- AsyncStorage and database both cache festival ID (dual persistence)
- Dashboard calls `getCurrentFestival(user.id)` to fetch festival info
- Event isolation via `find_users_in_festival()` SQL function

**From learnings-researcher**:
- No formal `docs/solutions/` directory exists yet
- Project uses React Context for state management
- Auto-wipe after 20 minutes (Supabase Edge Function + pg_cron)
- Clear Cache only clears AsyncStorage, not database
- Test data should use isolated event IDs to avoid collision

**From spec-flow-analyzer**:
- **14 gaps identified** across 5 categories (data consistency, skip logic, UX, migration, schema)
- **11 critical questions** raised (4 blockers, 7 non-blockers)
- **Schema mismatch**: `description` column missing from festivals table
- **Data consistency risk**: No FK constraints defined for users.festival_id
- **User recovery gap**: No in-app flow for users stuck with deleted festival_id

## Notes & Considerations

### Design Decisions

**Why use static `'test-festival'` instead of dynamic IDs?**
- ✅ **Simple**: No database writes needed from client
- ✅ **Reliable**: Festival already exists in schema
- ✅ **Shared**: Multiple devs can test together in same pool
- ❌ **Tradeoff**: Can't test isolated multi-event scenarios (acceptable for MVP)

**Why SET NULL instead of CASCADE on festival deletion?**
- ✅ **Preserves user data**: User records remain intact
- ✅ **Graceful degradation**: Users see error modal, can rejoin
- ❌ **Tradeoff**: Orphaned users need manual recovery (rare edge case)

**Why hide skip button in production with `__DEV__`?**
- ✅ **Security**: Prevents production users from joining test events
- ✅ **Simplicity**: No server-side role checking needed
- ❌ **Tradeoff**: Harder to test production builds (must use real QR codes)

### Future Enhancements

**Post-Fix Improvements** (Not in Scope):
- [ ] Add telemetry to track skip button usage
- [ ] Add visual "TEST MODE" badge when in test-festival
- [ ] Support multiple test festivals for parallel dev testing
- [ ] Auto-expire test festivals after 24 hours
- [ ] Add admin panel for festival management

**Documentation Needs**:
- [ ] Update QR-SYSTEM-GUIDE.md with skip button behavior
- [ ] Add troubleshooting section to README.md
- [ ] Document Clear Cache behavior (clears both cache + database)

### AI-Era Development Notes

**Prompts That Worked Well**:
- "Research the QR scanning implementation and identify why users see test data"
- "Analyze the event isolation system and festival ID lifecycle"
- "Identify edge cases in the QR bug fix specification"

**Human Review Required**:
- ✅ **Migration execution order**: Human must verify schema before running functions
- ✅ **Production data audit**: Human must check for affected users before cleanup
- ✅ **Rollback readiness**: Human must verify backups before deleting data

**Testing Emphasis**:
- Given rapid AI-assisted implementation, focus extra attention on:
  - Migration rollback procedures
  - Affected user recovery flows
  - Production build verification (skip button hidden)

---

## Quick Start Checklist

Ready to implement? Follow this checklist:

### 🗄️ Database (30 minutes)
- [ ] Run audit query for affected users
- [ ] Add `description` column to festivals table
- [ ] Run `fix-get-festival-info.sql` migration
- [ ] Clear affected users' festival_id (SET NULL)
- [ ] Run `cleanup-test-festivals.sql` migration
- [ ] Verify `'test-festival'` still exists

### 💻 Code (45 minutes)
- [ ] Update skip button to use `'test-festival'`
- [ ] Add `__DEV__` guard around skip button
- [ ] Add festival validation in Dashboard
- [ ] Improve Clear Cache to delete database records
- [ ] Run linter and fix errors
- [ ] Build successfully (dev + production)

### 🧪 Testing (1 hour)
- [ ] Test skip button (fresh install)
- [ ] Test affected user recovery (manual DB edit)
- [ ] Test clear cache (verify DB deletion)
- [ ] Test real QR scan (end-to-end)
- [ ] Test production build (skip button hidden)
- [ ] Run regression tests (radar, nudge, chat)

### 🚀 Deploy
- [ ] Commit changes to git
- [ ] Push to remote repository
- [ ] Build production APK/IPA
- [ ] Deploy to TestFlight/Google Play (internal testing)
- [ ] Monitor for errors in production

---

**Estimated Total Time**: 2-3 hours
**Priority**: 🔴 Critical (blocks event joining)
**Complexity**: Medium (migration + code changes)
**Risk Level**: Low (well-understood bug, clear solution)
