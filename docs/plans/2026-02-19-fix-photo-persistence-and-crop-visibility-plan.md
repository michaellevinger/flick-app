---
title: Fix photo persistence after save and improve crop visibility
type: fix
status: active
date: 2026-02-19
---

# Fix Photo Persistence After Save and Improve Crop Visibility

## Overview

Two critical bugs are preventing users from successfully managing multiple profile photos:

1. **Photos disappear after save**: When users add photos via ManagePhotosScreen and tap "Save", the additional photos are saved to the database but don't appear when returning to the Profile screen. Only the main photo shows.

2. **Crop interface unclear**: The square 1:1 crop box is hard to see when users take or select photos, making it difficult to frame their face properly.

## Problem Statement

### Issue 1: Photo Persistence Bug

**Current Behavior**:
- User navigates to Profile → Manage Photos
- Adds 2-3 photos using camera or gallery
- Reorders photos using ↑↓ arrows
- Taps "Save" → sees success alert
- Returns to Profile → only main photo visible, additional photos gone

**Expected Behavior**:
- All saved photos should display in Profile screen
- Photos should persist across app restarts
- Photo order should be maintained

### Issue 2: Crop Visibility

**Current Behavior**:
- User taps to add photo
- Crop interface appears with square (1:1) aspect ratio
- Crop box grid/overlay is barely visible against light backgrounds
- Users can't clearly see what will be cropped

**Expected Behavior**:
- Clear, visible crop grid regardless of photo content
- Intuitive crop handles or visual indicators
- Easy to adjust crop area before confirming

## Root Cause Analysis

### Photo Persistence Bug

**Primary Cause**: Missing field mapping in `refreshUser()`

**Location**: `src/lib/userContext.js:361`

```javascript
// Current code (BROKEN)
const updatedUser = {
  id: data.id,
  name: data.name,
  age: data.age,
  height: data.height,
  selfieUrl: data.selfie_url,
  status: Boolean(data.status),
  location: data.location,
  phoneNumber: data.phone_number,
  gender: data.gender,
  lookingFor: data.looking_for,
  festival_id: data.festival_id,
  bio: data.bio,
  // ❌ MISSING: photos: data.photos
};
```

**Why This Breaks**:
1. ManagePhotosScreen saves photos → calls `updateUserPhotos()` → database updated successfully ✅
2. ManagePhotosScreen calls `refreshUser()` → fetches from database
3. `refreshUser()` creates updated user object but **omits `photos` field**
4. Local state now has correct `selfieUrl` but empty/missing `photos` array
5. Profile screen shows only `user.selfieUrl`, additional photos are gone

**State Flow**:
```
ManagePhotosScreen.handleSave()
  → uploadPhotos(userId, [photo1, photo2, photo3])  ✅ Upload succeeds
  → updateUserPhotos(userId, [url1, url2, url3])   ✅ Database updated
  → refreshUser()                                   ❌ photos field not retrieved
    → loadUser() reads AsyncStorage                ❌ Stale data without photos
  → User sees only main photo
```

### Crop Visibility Issue

**Potential Causes**:
1. **No explicit crop overlay styling** - ImagePicker uses default system UI which may have low contrast
2. **API enum mismatch** - Using `ImagePicker.CameraType.front` (enum) instead of `'front'` (string literal)
3. **Square aspect ratio** - 1:1 crop may not be familiar to users (Instagram-style)

**Locations**:
- `src/screens/ManagePhotosScreen.js:30-53` (takePhotoWithCrop)
- `src/screens/ManagePhotosScreen.js:55-78` (pickFromGallery)
- `src/screens/CameraScreen.js:191-195` (gallery picker)

## Proposed Solution

### Fix 1: Add `photos` Field to refreshUser()

**Change**: Add single line to userContext.js

```javascript
// src/lib/userContext.js:361
const updatedUser = {
  id: data.id,
  name: data.name,
  age: data.age,
  height: data.height,
  selfieUrl: data.selfie_url,
  photos: data.photos || [], // ✅ ADD THIS LINE
  status: Boolean(data.status),
  location: data.location,
  phoneNumber: data.phone_number,
  gender: data.gender,
  lookingFor: data.looking_for,
  festival_id: data.festival_id,
  bio: data.bio,
};
```

**Impact**:
- Photos array will be restored from database when user refreshes
- ManagePhotos save flow will work correctly
- No breaking changes to existing functionality

### Fix 2: Improve Crop Interface Visibility

**Option A: Add explicit crop UI config** (Recommended)
```javascript
// src/screens/ManagePhotosScreen.js
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
  // ✅ ADD THESE:
  presentationStyle: 'fullScreen', // Maximize crop interface
  selectionLimit: 1,
});
```

**Option B: Switch to custom crop library**
- Consider `react-native-image-crop-picker` for more control
- Adds dependency but gives better UX customization
- Can add custom overlay styles and guidelines

**Option C: Change aspect ratio to 4:5 (portrait)**
```javascript
aspect: [4, 5], // Taller crop box, more familiar for portraits
```

**Recommendation**: Try Option A first (add presentation config), fallback to Option C if still unclear.

### Fix 3: Fix ImagePicker CameraType enum

```javascript
// src/screens/ManagePhotosScreen.js:43
// BEFORE (potential API mismatch):
cameraType: ImagePicker.CameraType.front,

// AFTER (explicit string):
cameraType: 'front',
```

## Technical Considerations

### Data Integrity

**Database Schema** (Supabase):
```sql
users (
  selfie_url TEXT,           -- Main photo URL
  photos JSONB DEFAULT '[]'  -- Array of all photo URLs
)
```

**Invariant**: `photos[0]` should always equal `selfie_url`

**Verification Needed**:
- Check if `updateUserPhotos()` maintains this invariant
- Consider adding DB constraint or trigger

### State Synchronization

**Current Flow** (with fix):
```
Database (source of truth)
    ↓ refreshUser()
AsyncStorage (cache)
    ↓ loadUser()
React State (user context)
    ↓ props
Profile/ManagePhotos screens
```

**After Fix**: Photos array flows through all layers correctly.

### Performance

**Photo Array Size**: Max 3 photos per user
**URL Format**: `https://[project].supabase.co/storage/v1/object/public/selfies/[filename].jpg`
**Impact**: Negligible - array operations on 3 items are instant

## Acceptance Criteria

### Photo Persistence
- [ ] Save 3 photos in ManagePhotos screen (requires device testing)
- [ ] Tap "Save" button → success alert shows (requires device testing)
- [ ] Navigate back to Profile screen (requires device testing)
- [x] Verify all 3 photos are visible in grid layout - **IMPLEMENTED**
- [ ] Close and reopen app → photos still present (requires device testing)
- [ ] Reorder photos → save → order persists (requires device testing)
- [ ] Remove photo → save → deletion persists (requires device testing)
- [x] Photos persist when switching between tabs - **FIXED**
- [x] Photo grid displays in 2-column layout - **IMPLEMENTED**
- [x] Photos are tappable to view full-screen - **IMPLEMENTED**

### Crop Visibility
- [ ] Tap "Add Photo" → choose camera or gallery (requires device testing)
- [ ] Crop interface appears with clear grid/overlay (requires device testing)
- [ ] Can see entire crop area boundaries (requires device testing)
- [ ] Crop box is visible against both light and dark photos (requires device testing)
- [ ] Can easily adjust crop before confirming (requires device testing)
- [ ] After confirming, cropped image matches expected framing (requires device testing)

### Edge Cases
- [ ] Save with 0 photos → validation error (need at least 1)
- [ ] Save with 1 photo → saves correctly
- [ ] Cancel crop → no photo added, no error
- [ ] Upload failure → error message shown, photos not lost
- [ ] Slow network → loading indicator shown, no duplicate uploads

## Implementation Plan

### Phase 1: Fix Photo Persistence ✅ COMPLETE

#### Step 1: Add photos field to refreshUser() ✅
**File**: `src/lib/userContext.js:354`
```javascript
photos: data.photos || [],
```
✅ **Completed** - Added missing photos field to refreshUser() function

#### Step 2: Verify database query includes photos ✅
**File**: `src/lib/userContext.js:340`
```javascript
.select('*') // Already includes photos field
```
✅ **Verified** - Database query returns all fields including photos array

#### Step 3: Fix tab navigation photo sync ✅
**File**: `src/screens/ManagePhotosScreen.js`
```javascript
// Added useFocusEffect to sync photos when navigating back
useFocusEffect(
  React.useCallback(() => {
    if (user?.photos && user.photos.length > 0) {
      setPhotos(user.photos);
    }
  }, [user?.photos])
);
```
✅ **Completed** - Photos now persist when switching between tabs

### Phase 2: Update Profile Display ✅ COMPLETE

**Implementation**: Option C (Instagram-style thumbnail grid) - COMPLETED

**What was built**:
1. Created `PhotoViewScreen.js` - Full-screen photo viewer with carousel
2. Added photo grid to `ProfileScreen.js`:
   - 2-column responsive grid layout
   - "Photos" section header with "Manage" button
   - "Main" badge on first photo
   - Tappable photos that open full-screen viewer
3. Added PhotoViewScreen to navigation stack in App.js

✅ **Completed** - Photo grid with full-screen viewer fully implemented

### Phase 3: Improve Crop Visibility ✅ COMPLETE

#### Step 1: Add presentation config ✅
**Files**:
- `src/screens/ManagePhotosScreen.js:48-56` (camera)
- `src/screens/ManagePhotosScreen.js:75-83` (gallery)
- `src/screens/CameraScreen.js:191-198`

```javascript
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
  presentationStyle: 'fullScreen', // ✅ ADDED
  selectionLimit: 1,               // ✅ ADDED
});
```
✅ **Completed** - All ImagePicker calls now have presentation config

#### Step 2: Fix cameraType enum ✅
**File**: `src/screens/ManagePhotosScreen.js:53`
```javascript
cameraType: 'front', // String literal instead of enum
```
✅ **Completed** - Fixed CameraType enum to string literal

#### Step 3: Test on device
- [ ] Add photo with light background → verify crop visible
- [ ] Add photo with dark background → verify crop visible
- [ ] Test on both iOS and Android

### Phase 4: Testing & Validation (20 min)

**Test Scenarios**:
```javascript
// Test 1: Basic save flow
ManagePhotos.test.js
describe('Photo Save', () => {
  it('persists photos after save and navigation', async () => {
    // 1. Add 3 photos
    // 2. Save
    // 3. Navigate to Profile
    // 4. Verify 3 photos present
  });
});

// Test 2: Refresh user includes photos
userContext.test.js
it('refreshUser() retrieves photos array from database', async () => {
  const mockData = { id: 'user1', photos: ['url1', 'url2'] };
  // Mock Supabase query
  // Call refreshUser()
  // Assert user.photos === ['url1', 'url2']
});
```

**Manual Testing**:
1. Fresh user → add 3 photos → save → check Profile
2. Existing user → edit photos → reorder → save → check Profile
3. Remove photo → save → verify deletion
4. Crop photo → check framing after confirm
5. Cancel crop → verify no side effects

## Implementation Notes

### ProfileScreen Display Decision

**Current**: ProfileScreen.js shows only the circular avatar with `user.selfieUrl`

**After Fix**: Need to decide:
1. Keep as-is (user sees single photo, but photos are saved)
2. Add photo count badge ("3 photos")
3. Show full carousel (like UserProfileScreen)

**Recommendation**: Keep simple for now. ProfileScreen is for the current user to edit their profile. The "Manage Photos" button is the CTA. Other users see the full carousel in UserProfileScreen.

**If showing carousel is desired**, copy logic from UserProfileScreen:
```javascript
// src/screens/UserProfileScreen.js:30-32
const allPhotos = user?.photos || [user?.selfieUrl].filter(Boolean);
// Then render image carousel
```

### Debugging Tips

**Enable verbose logging**:
```javascript
// src/lib/userContext.js:355
console.log('RefreshUser: fetched from DB', data);
console.log('RefreshUser: photos field', data.photos);
console.log('RefreshUser: mapped photos', updatedUser.photos);
```

**Check AsyncStorage**:
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
const userData = await AsyncStorage.getItem('user');
console.log('AsyncStorage user:', JSON.parse(userData).photos);
```

## Testing Checklist

### Unit Tests
- [ ] `refreshUser()` maps `photos` field correctly
- [ ] `updateUserPhotos()` saves array to database
- [ ] `uploadPhotos()` handles multiple files

### Integration Tests
- [ ] Save flow: ManagePhotos → database → refreshUser → Profile
- [ ] Reorder photos → save → order persists
- [ ] Remove photo → save → deletion persists

### Manual Testing
- [ ] Add 3 photos → save → verify in Profile
- [ ] Reorder with ↑↓ → save → order maintained
- [ ] Remove photo → save → photo gone
- [ ] Crop photo → framing matches preview
- [ ] App restart → photos persist

### Device Testing
- [ ] iOS simulator - crop visible
- [ ] Android emulator - crop visible
- [ ] Real iOS device - photos persist
- [ ] Real Android device - photos persist

## Success Metrics

**Photo Persistence**:
- 100% of saved photos appear in Profile after save
- 0 reports of "photos disappeared" after this fix

**Crop Visibility**:
- Users can clearly see crop boundaries on first try
- No confusion about which part of photo will be used

## Dependencies & Risks

### Dependencies
- **expo-image-picker** (already installed) - version compatibility
- **@react-native-async-storage/async-storage** - state persistence
- **Supabase client** - database queries

### Risks

**Low Risk**:
- ✅ Fix is single-line addition to existing function
- ✅ No database schema changes needed
- ✅ No breaking changes to API

**Potential Issues**:
- ⚠️ If database doesn't have `photos` field for old users → fallback to `[]` works
- ⚠️ ImagePicker API differences between Expo versions → test on target devices
- ⚠️ AsyncStorage sync timing → mitigated by reading from database

### Rollback Plan

**If photo persistence breaks**:
1. Revert single line in userContext.js
2. Photos will behave as before (main photo only)
3. No data loss - photos still in database

**If crop visibility worse**:
1. Revert presentationStyle config
2. Try aspect ratio change (4:5 instead of 1:1)
3. Consider custom crop library

## References & Research

### Internal Code
- `/Users/michaellevinger/dev/testing/src/lib/userContext.js:335-367` - refreshUser() bug location
- `/Users/michaellevinger/dev/testing/src/screens/ManagePhotosScreen.js:111-159` - Save flow with logs
- `/Users/michaellevinger/dev/testing/src/lib/database.js:122-135` - updateUserPhotos()
- `/Users/michaellevinger/dev/testing/src/screens/UserProfileScreen.js:30-45` - Photo carousel example

### Git History
- `243c958` - "fix: Change crop to square (1:1) and add save debugging" (latest)
- `b7b517f` - "feat: Improve selfie crop UX and add simple photo reordering"
- `810ee64` - "fix: Remove react-native-reanimated to resolve Worklets version mismatch"

### External Resources
- [Expo ImagePicker Docs](https://docs.expo.dev/versions/latest/sdk/imagepicker/) - API reference
- [React Native State Management](https://reactnative.dev/docs/state) - Context patterns
- [AsyncStorage Best Practices](https://react-native-async-storage.github.io/async-storage/docs/usage)

### Database Schema
```sql
-- users table (Supabase)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  selfie_url TEXT,
  photos JSONB DEFAULT '[]',
  -- other fields...
);
```

## Bonus Implementation

### Photo Grid Display ✅ COMPLETED

**Beyond Original Scope**: User requested photo grid display similar to Instagram-style layout.

**What Was Built**:
1. **PhotoViewScreen** (`src/screens/PhotoViewScreen.js`):
   - Full-screen photo viewer with dark background
   - Swipeable horizontal carousel
   - Photo counter header ("Photos 1/3")
   - Dots indicator for navigation
   - Close button to return

2. **Photo Grid in ProfileScreen**:
   - 2-column responsive grid layout
   - "Photos" section header with "Manage" button
   - "Main" badge on first photo
   - Tappable photos navigate to full-screen viewer
   - Proper spacing and styling

3. **Navigation Integration**:
   - Added PhotoViewScreen to navigation stack
   - Modal presentation style
   - Passes photos array and initial index

**User Benefit**: Users can now see all their photos in their profile and view them full-screen by tapping, providing better visibility into their profile presentation.

## Future Enhancements

**Out of Scope for This Fix**:
- [ ] Custom crop library with better styling
- [ ] Photo compression before upload
- [ ] Drag-and-drop photo reordering (removed due to Worklets conflict)
- [ ] Delete old photos from storage when replaced
- [ ] Photo zoom/pinch gestures in PhotoViewScreen

**Consider Later**:
- [ ] Remove `selfie_url` redundancy (use `photos[0]` everywhere)
- [ ] Add data integrity constraint: `photos[0] === selfie_url`
- [ ] Server-side validation: max 3 photos, min 1 photo

---

## Quick Reference

**Files to Modify**:
1. `src/lib/userContext.js:361` - Add `photos: data.photos || [],`
2. `src/screens/ManagePhotosScreen.js:43,68` - Change `ImagePicker.CameraType.front` → `'front'`
3. `src/screens/ManagePhotosScreen.js:66,193` - Add `presentationStyle: 'fullScreen'`
4. `src/screens/CameraScreen.js:193` - Add `presentationStyle: 'fullScreen'`

**Estimated Time**: 1-2 hours
**Complexity**: Low (mostly config changes + 1 line fix)
**Impact**: High (fixes critical UX issue)