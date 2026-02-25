# fix: Photo persistence, crop visibility, and profile photo grid

## Summary

Fixes two critical photo management bugs and adds photo grid display to ProfileScreen:

1. **Photo Persistence Bug** - Photos saved in ManagePhotosScreen would disappear after navigating away
2. **Crop Visibility Issue** - Square crop box was hard to see when taking/selecting photos
3. **Photo Grid Display** - New feature: Display all user photos in a 2-column grid with full-screen viewer

## Changes

### Photo Persistence Fixes
- **Root cause**: Missing `photos` field in `refreshUser()` function (userContext.js:354)
- **Fix 1**: Added `photos: data.photos || []` to refreshUser mapping
- **Fix 2**: Added `useFocusEffect` to ManagePhotosScreen to sync photos when navigating between tabs
- **Impact**: Photos now persist correctly across navigation and app restarts

### Crop Visibility Improvements
- Fixed CameraType enum: Changed `ImagePicker.CameraType.front` → `'front'` (string literal)
- Added `presentationStyle: 'fullScreen'` to all ImagePicker calls
- Added `selectionLimit: 1` for consistency
- **Impact**: Crop interface should be more visible (requires device testing to confirm)

### Photo Grid Display (New Feature)
- Created `PhotoViewScreen.js` - Full-screen photo viewer with:
  - Swipeable horizontal carousel
  - Photo counter ("Photos 1/3")
  - Dots navigation indicator
  - Dark background with close button
- Updated `ProfileScreen.js` with:
  - 2-column responsive photo grid
  - "Photos" section header with "Manage" button
  - "Main" badge on first photo
  - Tappable photos that navigate to full-screen viewer
- Added PhotoViewScreen to navigation stack (modal presentation)

## Testing

### Manual Testing Required
- [ ] Add 3 photos in ManagePhotos screen
- [ ] Verify crop interface is clearly visible (light and dark backgrounds)
- [ ] Save photos and navigate to Profile tab
- [ ] Verify all 3 photos appear in grid layout
- [ ] Switch to Radar tab and back to Profile
- [ ] Verify photos still visible (tab navigation persistence)
- [ ] Tap photos to view full-screen
- [ ] Swipe between photos in full-screen viewer
- [ ] Close and reopen app
- [ ] Verify photos persist after app restart

### Files Changed
- `src/lib/userContext.js` - Added photos field to refreshUser()
- `src/screens/ManagePhotosScreen.js` - Fixed CameraType, added presentationStyle, added useFocusEffect
- `src/screens/CameraScreen.js` - Added presentationStyle to gallery picker
- `src/screens/ProfileScreen.js` - Added photo grid section
- `src/screens/PhotoViewScreen.js` - New full-screen photo viewer (created)
- `App.js` - Added PhotoViewScreen to navigation stack
- `docs/plans/2026-02-19-fix-photo-persistence-and-crop-visibility-plan.md` - Updated with completion status

## Technical Details

**State Flow (Fixed)**:
```
ManagePhotosScreen.handleSave()
  → uploadPhotos() ✅
  → updateUserPhotos() ✅
  → refreshUser() ✅ (now includes photos field)
  → AsyncStorage updated ✅
  → User context refreshed ✅
  → ProfileScreen shows photos ✅
```

**Tab Navigation Fix**:
```javascript
// ManagePhotosScreen now syncs on focus
useFocusEffect(
  React.useCallback(() => {
    if (user?.photos && user.photos.length > 0) {
      setPhotos(user.photos);
    }
  }, [user?.photos])
);
```

## Post-Deploy Monitoring & Validation

**What to monitor:**
- User reports of photos disappearing (should be zero)
- Photo upload success rates
- No console errors related to photo state

**Validation checks:**
- Test photo persistence on iOS and Android devices
- Verify crop interface visibility on real devices (simulator may differ)
- Confirm photo grid displays correctly on various screen sizes

**Expected healthy behavior:**
- Photos persist across all navigation scenarios
- Photo grid displays in 2-column layout
- Full-screen photo viewer works smoothly

**Failure signals:**
- Photos still disappearing after navigation
- Crop interface still hard to see
- Photo grid layout broken on certain devices

**Validation window & owner:**
- Window: Immediate testing after merge
- Owner: @michaellevinger

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
