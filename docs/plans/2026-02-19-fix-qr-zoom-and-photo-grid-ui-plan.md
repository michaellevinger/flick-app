---
title: Fix QR Zoom & Photo Grid UI
type: fix
status: active
date: 2026-02-19
---

# Fix QR Zoom & Photo Grid UI

## Overview

Enhance photo management UX in ManagePhotosScreen by implementing a 2-column grid layout with full-screen photo viewer, and verify QR scanner pinch-to-zoom functionality.

## Problem Statement

### Current Issues
1. **QR Scanner Zoom:** Need to verify that pinch-to-zoom works correctly (may already be implemented)
2. **Photo Grid Layout:** ManagePhotosScreen uses a vertical list with full-width horizontal tiles, making it hard to get a visual overview of all photos
3. **Photo Viewing:** No way to view photos full-screen from the photo management screen

### User Impact
- Vertical list layout feels inefficient for managing 1-3 photos
- No quick way to preview photos at full resolution
- QR codes at distance or in poor lighting may be hard to scan without zoom

## Proposed Solution

### 1. QR Scanner Verification ✅
**Status:** Likely already complete - just needs testing

**Current Implementation:**
```javascript
// src/screens/QRScannerScreen.js:146-151
<CameraView
  zoom={zoom}
  enableZoomGesture={true}
  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
/>
```

**Action Required:**
- Test on physical device
- Verify zoom range (0 to 1.0 scale)
- Confirm scan success at various zoom levels
- Document any issues found

### 2. Photo Grid Transformation
**Transform vertical list → 2-column grid layout**

**Current Pattern (Vertical List):**
```
┌──────────────────────────┐
│  [Photo 1 - Full Width]  │
│  Main | ↑↓ | ✕            │
├──────────────────────────┤
│  [Photo 2 - Full Width]  │
│      | ↑↓ | ✕            │
├──────────────────────────┤
│  [Photo 3 - Full Width]  │
│      | ↑↓ | ✕            │
└──────────────────────────┘
```

**Target Pattern (2-Column Grid):**
```
┌────────────┬────────────┐
│ [Photo 1]  │ [Photo 2]  │
│  Main | ✕  │    ↑↓ | ✕  │
│    ↑↓      │            │
├────────────┼────────────┤
│ [Photo 3]  │ [+ Add]    │
│    ↑↓ | ✕  │            │
└────────────┴────────────┘
```

**Design Decisions:**

| **Aspect** | **Decision** | **Rationale** |
|------------|--------------|---------------|
| **Grid Columns** | 2 columns | Balances overview with touch target size |
| **Aspect Ratio** | 1:1 (square) | Consistent with PhotosScreen.js pattern, all photos cropped square during upload |
| **Reorder Logic** | ↑ = left/up, ↓ = right/down (row-major order) | Photo [1]↓ swaps with [2], Photo [2]↓ swaps with [3] |
| **Boundary Buttons** | Grayed out (disabled) | Photo [1] has gray ↑, Photo [3] has gray ↓ |
| **Main Photo Badge** | Top-left corner of first photo | Existing pattern from PhotosScreen.js |
| **Remove Button** | Top-right corner (✕) | Existing pattern, requires confirmation |
| **Add Photo Button** | Inside grid as empty cell (when < 3 photos) | Follows PhotosScreen.js 3-column pattern |
| **Single Photo** | Left-aligned in grid | Maintains consistent layout structure |
| **Empty State** | Show message + "Add Photo" button | Clear guidance for new users |

### 3. Full-Screen Photo Viewer
**Add tap-to-view navigation**

**Navigation Flow:**
```
ManagePhotosScreen (Grid)
    ↓ (User taps photo thumbnail)
PhotoViewScreen (Full-screen carousel)
    ↓ (User closes or swipes back)
ManagePhotosScreen (Returns to grid)
```

**PhotoViewScreen Features:**
- Horizontal swipeable carousel (already exists)
- Page counter: "Photos 1/3"
- Dot indicators at bottom
- Close button (✕) at top
- Black background
- Photos shown with `resizeMode="contain"`

## Technical Approach

### Architecture Changes

**File Changes:**
```
src/screens/ManagePhotosScreen.js
├── Replace FlatList with 2-column grid layout
├── Add photo tap handler → navigate to PhotoViewScreen
├── Update reorder logic for grid positions
└── Adjust styles for 2-column tiles

src/screens/PhotoViewScreen.js
└── No changes needed (already complete)

App.js (Navigation)
└── Ensure PhotoViewScreen is registered (already done)
```

### Implementation Plan

#### Phase 1: Verify QR Zoom (Est: 15 min)
1. Test pinch-to-zoom on physical device
2. Verify `enableZoomGesture={true}` works correctly
3. Test QR scanning at 1x, 2x, 3x zoom levels
4. Document zoom behavior in comments
5. ✅ Mark as complete or create follow-up if issues found

#### Phase 2: Transform Grid Layout (Est: 1-2 hours)

**Step 1: Update Data Structure**
```javascript
// Current: FlatList with vertical scrolling
<FlatList
  data={photos}
  renderItem={({ item, index }) => ...}
/>

// Target: 2-column grid
<View style={styles.photoGrid}>
  {photos.map((uri, index) => (
    <TouchableOpacity
      key={index}
      style={styles.photoTile}
      onPress={() => handlePhotoPress(index)}
    >
      <Image source={{ uri }} style={styles.photo} />
      {/* Badges, buttons */}
    </TouchableOpacity>
  ))}

  {canAddMore && (
    <TouchableOpacity style={styles.addPhotoTile}>
      {/* Add photo UI */}
    </TouchableOpacity>
  )}
</View>
```

**Step 2: Update Reorder Logic**

**Current Logic (Vertical List):**
```javascript
// Photo [0] ↓ swaps with [1]
// Photo [1] ↑ swaps with [0]
// Photo [1] ↓ swaps with [2]
```

**New Logic (2-Column Grid):**
```javascript
// Grid positions (row-major order):
// [0] [1]
// [2] [x]

// Photo [0] ↓ swaps with [1] (move right in row)
// Photo [1] ↑ swaps with [0] (move left in row)
// Photo [1] ↓ swaps with [2] (move down to next row)
// Photo [2] ↑ swaps with [1] (move up to previous row)

const movePhotoUp = (index) => {
  if (index === 0) return; // Boundary: first photo
  const newPhotos = [...photos];
  [newPhotos[index - 1], newPhotos[index]] = [newPhotos[index], newPhotos[index - 1]];
  setPhotos(newPhotos);
};

const movePhotoDown = (index) => {
  if (index === photos.length - 1) return; // Boundary: last photo
  const newPhotos = [...photos];
  [newPhotos[index], newPhotos[index + 1]] = [newPhotos[index + 1], newPhotos[index]];
  setPhotos(newPhotos);
};
```

**Step 3: Add Tap-to-View Navigation**
```javascript
const handlePhotoPress = (index) => {
  navigation.navigate('PhotoView', {
    photos: photos,
    initialIndex: index,
  });
};
```

**Step 4: Update Styles**
```javascript
// Adapt from PhotosScreen.js (3-column → 2-column)
photoGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginBottom: 24,
  marginHorizontal: -6, // Negative margin for gap effect
},
photoTile: {
  width: '47%', // 2 columns with gap
  aspectRatio: 1, // Square tiles
  borderRadius: 12,
  overflow: 'hidden',
  marginHorizontal: 6,
  marginBottom: 12,
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#EEEEEE',
  position: 'relative',
},
photo: {
  width: '100%',
  height: '100%',
  resizeMode: 'cover',
},
addPhotoTile: {
  width: '47%',
  aspectRatio: 1,
  borderRadius: 12,
  borderWidth: 2,
  borderColor: '#CCCCCC',
  borderStyle: 'dashed',
  backgroundColor: '#F5F5F5',
  justifyContent: 'center',
  alignItems: 'center',
  marginHorizontal: 6,
  marginBottom: 12,
},
```

**Step 5: Position Reorder Buttons**
```javascript
// Overlay buttons on grid tiles (not outside like horizontal tiles)
reorderButtons: {
  position: 'absolute',
  bottom: 4,
  left: 4,
  right: 4,
  flexDirection: 'row',
  justifyContent: 'center',
  gap: 8,
},
reorderButton: {
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: 'rgba(255,255,255,0.95)',
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#C44CE0',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
},
```

#### Phase 3: Handle Edge Cases (Est: 30 min)

**1. Empty State (0 Photos)**
```javascript
{photos.length === 0 ? (
  <View style={styles.emptyState}>
    <Text style={styles.emptyStateIcon}>📷</Text>
    <Text style={styles.emptyStateTitle}>No photos yet</Text>
    <Text style={styles.emptyStateText}>
      Add up to 3 photos to your profile
    </Text>
    <TouchableOpacity
      style={styles.addPhotoButton}
      onPress={handleAddPhoto}
    >
      <Text style={styles.addPhotoButtonText}>Add Photo</Text>
    </TouchableOpacity>
  </View>
) : (
  <View style={styles.photoGrid}>
    {/* Grid content */}
  </View>
)}
```

**2. Main Photo Removal Confirmation**
```javascript
const removePhoto = (index) => {
  Alert.alert(
    'Remove Photo',
    index === 0
      ? 'Remove your main photo? The next photo will become your main photo.'
      : 'Remove this photo?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const newPhotos = photos.filter((_, i) => i !== index);
          setPhotos(newPhotos);
        },
      },
    ]
  );
};
```

**3. Boundary Button States**
```javascript
<TouchableOpacity
  style={[
    styles.reorderButton,
    index === 0 && styles.reorderButtonDisabled
  ]}
  onPress={() => movePhotoUp(index)}
  disabled={index === 0}
>
  <Text style={[
    styles.reorderButtonText,
    index === 0 && styles.reorderButtonTextDisabled
  ]}>↑</Text>
</TouchableOpacity>
```

**4. Failed Upload Handling**
```javascript
// In handleSave() catch block
catch (error) {
  console.error('Error saving photos:', error);
  Alert.alert(
    'Upload Failed',
    `Failed to save photos: ${error.message}`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Retry', onPress: handleSave },
    ]
  );
}
```

## Acceptance Criteria

### QR Scanner
- [x] Pinch-to-zoom implemented (enableZoomGesture={true})
- [x] Zoom state properly managed
- [x] UI hint text visible: "Pinch to zoom in or out"
- [ ] Physical device testing (iOS/Android) - requires device
- [ ] QR codes scannable at various zoom levels - requires device

### Photo Grid Layout
- [x] 2-column grid implemented (47% width)
- [x] Square aspect ratio (1:1) maintained for all tiles
- [x] "Main" badge visible on first photo only (white bg, purple text)
- [x] Remove button (✕) visible on all photos (top-right)
- [x] Reorder buttons (↑↓) visible on all photos (bottom center overlay)
- [x] "Add Photo" button appears in grid when < 3 photos
- [x] Empty state shows when 0 photos with clear CTA

### Photo Reordering
- [x] ↑ button swaps with previous photo (index - 1)
- [x] ↓ button swaps with next photo (index + 1)
- [x] First photo has grayed-out ↑ button
- [x] Last photo has grayed-out ↓ button
- [x] Reorder updates immediately (optimistic update)
- [x] "Main" badge follows first photo after reorder (automatic)

### Photo Removal
- [x] Remove button shows confirmation dialog
- [x] Main photo removal shows special warning message
- [x] Next photo auto-promoted to "Main" after removal (automatic)
- [x] Grid re-layouts correctly after removal (flexWrap)
- [x] Minimum 1 photo enforced (handleSave validation)

### Full-Screen Viewer
- [x] Tapping photo in grid opens PhotoViewScreen
- [x] Viewer opens to correct photo (initialIndex passed)
- [x] Horizontal swipe navigation works (PhotoViewScreen existing)
- [x] Page counter shows "Photos 1/3" (PhotoViewScreen existing)
- [x] Dot indicators show current position (PhotoViewScreen existing)
- [x] Close button (✕) returns to grid (PhotoViewScreen existing)
- [x] Back gesture returns to grid (React Navigation default)
- [x] Grid scroll position preserved (React Navigation automatic)

### Edge Cases
- [ ] Single photo (left-aligned in grid, no ↑ button)
- [ ] Two photos (both visible, "Add Photo" appears)
- [ ] Upload failure shows retry option
- [ ] Permission denial shows clear error message
- [ ] Reorder buttons disabled during save operation
- [ ] Network offline shows appropriate error

## Testing Matrix

### Manual Testing Scenarios

| **Scenario** | **Steps** | **Expected Result** |
|--------------|-----------|---------------------|
| **QR Zoom** | 1. Open app → QR Scanner<br>2. Place QR code 5+ feet away<br>3. Pinch to zoom 2-3x<br>4. Scan code | QR code scans successfully at zoomed level |
| **Grid with 1 Photo** | 1. Navigate to ManagePhotosScreen with 1 photo<br>2. Observe layout | Photo left-aligned, no ↑ button, "Add Photo" tile visible |
| **Grid with 2 Photos** | 1. Navigate with 2 photos<br>2. Observe layout | Both photos visible, "Add Photo" in grid, reorder works |
| **Grid with 3 Photos** | 1. Navigate with 3 photos<br>2. Observe layout | Grid full (2+1 layout), no "Add Photo" button visible |
| **Reorder Photos** | 1. Tap ↓ on Photo [1]<br>2. Observe swap | Photo [1] swaps with Photo [2], "Main" badge stays on [0] |
| **Tap to View** | 1. Tap Photo [2] in grid<br>2. Observe viewer | PhotoViewScreen opens showing Photo 2 with counter "2/3" |
| **Remove Main Photo** | 1. Tap ✕ on Photo [1] (Main)<br>2. Confirm dialog<br>3. Observe result | Dialog warns about main photo, Photo [2] promoted to Main |
| **Remove Non-Main Photo** | 1. Tap ✕ on Photo [2]<br>2. Confirm dialog<br>3. Observe result | Photo [2] removed, grid re-layouts, Main stays on [1] |
| **Empty State** | 1. Sign out and create new profile<br>2. Navigate to ManagePhotosScreen | Empty state shows: "📷 No photos yet" + "Add Photo" button |
| **Upload Failure** | 1. Turn on Airplane Mode<br>2. Add photo and tap Save<br>3. Observe error | Alert shows "Upload Failed" with Retry option |

### Device Testing
- [ ] **iPhone SE (small screen):** Touch targets adequate, text readable
- [ ] **iPhone 15 Pro Max (large screen):** Grid doesn't look too sparse
- [ ] **Android device:** Back button works, permissions handled correctly
- [ ] **Tablet (iPad):** Layout scales appropriately

### Performance Testing
- [ ] Grid renders smoothly with 3 high-res photos
- [ ] Reorder swaps happen instantly (< 100ms)
- [ ] PhotoView navigation animates smoothly (60fps)
- [ ] No memory leaks when opening/closing viewer repeatedly

## Implementation Files

### Files to Modify

**src/screens/ManagePhotosScreen.js**
```javascript
// Changes:
// 1. Replace FlatList with View + flexWrap layout (line 205-274)
// 2. Add handlePhotoPress navigation (new function)
// 3. Update reorder logic (already correct for array swaps)
// 4. Update styles for 2-column grid (line 288-488)
// 5. Add empty state UI (new section)
```

**Pattern Reference:**
```javascript
// Use PhotosScreen.js lines 188-227 as template
// Key differences:
// - Change width from 31.33% (3-col) to 47% (2-col)
// - Keep reorder buttons (PhotosScreen doesn't have them)
// - Add tap-to-view navigation (PhotosScreen goes to Dashboard)
```

### Files to Test

**src/screens/QRScannerScreen.js**
```javascript
// Line 24: const [zoom, setZoom] = useState(0);
// Line 146: zoom={zoom}
// Line 151: enableZoomGesture={true}
// Test: Pinch gesture on physical device
```

**src/screens/PhotoViewScreen.js**
```javascript
// No changes needed - already complete
// Test: Navigation from ManagePhotosScreen works
// Test: Route params { photos, initialIndex } passed correctly
```

## Visual Mockups

### 2-Column Grid States

**3 Photos (Full Grid):**
```
┌─────────────────────────────────┐
│ Manage Photos            [Save] │
├─────────────────────────────────┤
│ Add up to 3 photos • Use ↑↓     │
│                                  │
│  ┌────────┐  ┌────────┐        │
│  │Photo 1 │  │Photo 2 │        │
│  │Main ✕  │  │    ✕   │        │
│  │   ↑↓   │  │   ↑↓   │        │
│  └────────┘  └────────┘        │
│  ┌────────┐                     │
│  │Photo 3 │                     │
│  │    ✕   │                     │
│  │   ↑↓   │                     │
│  └────────┘                     │
│                                  │
│  💡 Drag to reorder photos...   │
└─────────────────────────────────┘
```

**1 Photo (Empty Grid):**
```
┌─────────────────────────────────┐
│ Manage Photos            [Save] │
├─────────────────────────────────┤
│ Add up to 3 photos • Use ↑↓     │
│                                  │
│  ┌────────┐  ┌────────┐        │
│  │Photo 1 │  │   +    │        │
│  │Main ✕  │  │  Add   │        │
│  │   ↑↓   │  │ Photo  │        │
│  └────────┘  └────────┘        │
│                                  │
│  💡 Add more photos to get      │
│     5x more matches!             │
└─────────────────────────────────┘
```

**0 Photos (Empty State):**
```
┌─────────────────────────────────┐
│ Manage Photos            [Save] │
├─────────────────────────────────┤
│                                  │
│           📷                     │
│                                  │
│      No photos yet               │
│                                  │
│  Add up to 3 photos to your     │
│  profile to get started          │
│                                  │
│  ┌─────────────────────┐        │
│  │     Add Photo       │        │
│  └─────────────────────┘        │
└─────────────────────────────────┘
```

### Full-Screen Viewer

**PhotoViewScreen (Already Implemented):**
```
┌─────────────────────────────────┐
│ [✕]         Photos 2/3      [ ] │ ← Header overlay
│                                  │
│                                  │
│                                  │
│         ┌─────────┐             │
│         │ Photo 2 │             │
│         │ (Full)  │             │
│         │         │             │
│         └─────────┘             │
│                                  │
│                                  │
│                                  │
│         ● ○ ●                   │ ← Dot indicators
└─────────────────────────────────┘
```

## Success Metrics

### Functional Metrics
- ✅ QR scanner zoom verified working (or issues documented)
- ✅ All photos visible in 2-column grid
- ✅ Tap-to-view navigation functional
- ✅ Reorder logic works correctly for all positions
- ✅ No crashes or data loss

### UX Metrics
- Grid layout feels more visual and organized than vertical list
- Reorder interactions feel natural (↑↓ match visual direction)
- Full-screen viewer provides quick photo preview
- Empty state provides clear guidance
- Error states provide actionable recovery options

## Dependencies & Risks

### Dependencies
✅ **PhotoViewScreen** - Already exists (no changes needed)
✅ **React Navigation** - Already configured for modal presentation
✅ **expo-camera** - Already installed (v17.0.10)
✅ **expo-image-picker** - Already installed (v17.0.10)

### Risks

| **Risk** | **Likelihood** | **Impact** | **Mitigation** |
|----------|---------------|-----------|----------------|
| **QR zoom already broken** | Low | Medium | Test on device first, document issues if found |
| **Grid layout breaks on small screens** | Medium | Medium | Test on iPhone SE, adjust tile sizes if needed |
| **Reorder logic confuses users** | Low | Low | Follow standard array swap pattern (well-understood) |
| **Touch targets too small** | Low | Medium | Use 32px minimum for reorder buttons (meets accessibility) |
| **Photo upload fails silently** | Low | High | Already has error handling, add retry option |
| **Grid doesn't match design** | Low | Low | Use existing PhotosScreen pattern (proven design) |

### Breaking Changes
- None - purely UI enhancement
- Existing data structure unchanged (array of photo URLs)
- No database migrations required
- Backward compatible with existing photos

## Future Considerations

### Out of Scope (Future Enhancements)
- [ ] Drag-and-drop reordering (requires react-native-draggable-flatlist, version mismatch currently)
- [ ] Pinch-to-zoom in full-screen viewer (iOS built-in, not critical)
- [ ] Crop photo from full-screen viewer (requires re-upload logic)
- [ ] Photo filters or editing (scope creep)
- [ ] GIF/video support (different media types)
- [ ] Batch upload (max 3 photos, not needed)

### Technical Debt
- None - clean implementation using existing patterns
- Removed DraggableFlatList (version mismatch) - current ↑↓ buttons are simpler

### Extensibility
- Grid pattern can scale to 4-6 photos if product changes max limit
- PhotoViewScreen supports any number of photos (uses FlatList)
- Reorder logic works for any array size (not hardcoded to 3)

## References & Research

### Internal References
- **PhotosScreen.js** (lines 188-227) - 3-column grid pattern
- **PhotoViewScreen.js** (complete file) - Full-screen carousel implementation
- **ManagePhotosScreen.js** (current implementation) - Vertical list to be replaced
- **QRScannerScreen.js** (lines 146-151) - Zoom implementation to verify

### External References
- React Native FlatList: https://reactnative.dev/docs/flatlist
- expo-camera docs: https://docs.expo.dev/versions/latest/sdk/camera/
- React Navigation Modal: https://reactnavigation.org/docs/modal/

### Institutional Learnings
- **Photo persistence pattern** - Always include `photos` field in `refreshUser()`
- **Focus-based syncing** - Use `useFocusEffect` to resync state on tab navigation
- **Square crop standard** - 1:1 aspect ratio for all dating app photos (lines 51, 79)
- **ImagePicker cameraType** - Use string `'front'` not enum `CameraType.front` (compatibility issue documented)

---

## Implementation Checklist

### Pre-Implementation
- [ ] Review SpecFlow analysis (Critical Questions Q1-Q5 addressed)
- [ ] Test QR zoom on physical device (verify already working)
- [ ] Review PhotosScreen.js grid pattern (template for 2-column)
- [ ] Review PhotoViewScreen.js navigation (ensure route params match)

### Phase 1: QR Verification (15 min)
- [x] Verify pinch-to-zoom already implemented (enableZoomGesture={true})
- [x] Confirm zoom state properly managed (line 146)
- [x] Verify UI hint text present (line 169)
- [ ] Test on physical device (iOS/Android) - requires device testing
- [ ] Update CLAUDE.md if changes needed

### Phase 2: Grid Transformation (1-2 hours)
- [x] Replace FlatList with 2-column View layout
- [x] Adapt styles from PhotosScreen.js (31.33% → 47%)
- [x] Update reorder button positioning (overlay on tiles)
- [x] Add handlePhotoPress navigation handler
- [x] Add tap-to-view full-screen navigation
- [x] Add empty state UI (0 photos)

### Phase 3: Edge Cases (30 min)
- [x] Add main photo removal confirmation with enhanced message
- [x] Add boundary button states (already grayed out)
- [x] Upload failure retry logic (already exists in handleSave)
- [x] Add empty state with clear CTA
- [x] Grid layout handles 0, 1, 2, 3 photos automatically

### Phase 4: Testing (30 min)
- [ ] Manual test all scenarios from Testing Matrix
- [ ] Test on small screen (iPhone SE)
- [ ] Test on large screen (iPhone 15 Pro Max)
- [ ] Test on Android (back button, permissions)
- [ ] Test network failure scenarios

### Phase 5: Polish (15 min)
- [ ] Verify animations smooth (60fps)
- [ ] Check touch targets adequate (32px minimum)
- [ ] Verify text readable on all screens
- [ ] Test with real photos (high resolution)
- [ ] Final visual review against mockups

### Post-Implementation
- [ ] Update CLAUDE.md status (mark features complete)
- [ ] Create git commit with descriptive message
- [ ] Test complete user flow (QR → Setup → Photos → Profile)
- [ ] Update README.md if needed

---

**Last Updated:** 2026-02-19
**Estimated Effort:** 2-3 hours total
**Priority:** Medium (UX improvement, not critical bug)
**Assigned To:** Available for pickup