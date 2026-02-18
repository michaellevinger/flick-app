---
title: Fix SafeAreaView Deprecation Warning and Image Upload Failures
type: fix
status: active
date: 2026-02-18
---

# Fix SafeAreaView Deprecation Warning and Image Upload Failures

## Overview

Two critical bugs are blocking user experience:
1. **SafeAreaView deprecation warning** appearing despite partial migration
2. **Image uploads failing in chat** with "Bucket not found" error

Both have clear root causes and working patterns to replicate from existing code.

## Problem Statement

### Bug 1: SafeAreaView Deprecation Warning

```
WARN  SafeAreaView has been deprecated and will be removed in a future release.
Please use 'react-native-safe-area-context' instead.
```

**Impact:** Console warnings on every app launch, potential future breakage when React Native removes SafeAreaView

**Root Cause:** 13 screen files still importing SafeAreaView from 'react-native' instead of 'react-native-safe-area-context'

### Bug 2: Image Upload Failures

```
LOG  Upload response: 400 {"statusCode":"404","error":"Bucket not found","message":"Bucket not found"}
ERROR  Upload failed: 400 - Bucket not found
ERROR  Error sending image message: [Error: Upload failed: 400 - Bucket not found]
```

**Impact:** Users cannot send photos in chat, breaking a core messaging feature

**Root Causes:**
1. `chat-images` storage bucket doesn't exist in Supabase
2. Current FormData upload method is unreliable in React Native (documented issue)

## Proposed Solution

### Part 1: Complete SafeAreaView Migration

Migrate remaining 13 files to use `react-native-safe-area-context`:

**Files Requiring Migration:**
1. `src/screens/WelcomeScreen.js:7`
2. `src/screens/Setup1Screen.js:8`
3. `src/screens/Setup2Screen.js:8`
4. `src/screens/Setup3Screen.js:8`
5. `src/screens/CameraScreen.js:10`
6. `src/screens/BirthdayScreen.js:7`
7. `src/screens/BioScreen.js:7`
8. `src/screens/LookingForScreen.js:7`
9. `src/screens/HostOnboarding1Screen.js:7`
10. `src/screens/HostOnboarding2Screen.js:7`
11. `src/screens/HostOnboarding3Screen.js:7`
12. `src/screens/CreateEventScreen.js:7`
13. `src/screens/EventSuccessScreen.js:7`

**Migration Pattern (proven working):**

```javascript
// BEFORE (deprecated)
import { SafeAreaView } from 'react-native';

// AFTER (correct)
import { SafeAreaView } from 'react-native-safe-area-context';

// Optional: For granular control
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
```

**Reference Implementation:** `src/screens/UserProfileScreen.js:14` (already migrated)

### Part 2: Fix Image Upload System

#### Step 2a: Create chat-images Storage Bucket

**Manual Setup Required (via Supabase Dashboard):**

1. Navigate to Storage in Supabase Dashboard
2. Click "New bucket"
3. Configure bucket:
   - Name: `chat-images`
   - Public bucket: **ON**
   - File size limit: 5 MB
   - Allowed MIME types: `image/*`

4. Create RLS Policies:

```sql
-- Policy 1: Allow anonymous uploads
CREATE POLICY "Allow anonymous uploads to chat-images"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'chat-images');

-- Policy 2: Allow public downloads
CREATE POLICY "Allow public downloads from chat-images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'chat-images');

-- Policy 3: Allow deletes (for cleanup)
CREATE POLICY "Allow deletes from chat-images"
ON storage.objects FOR DELETE TO public
USING (bucket_id = 'chat-images');
```

**Reference:** `selfies` bucket follows same pattern (already working)

#### Step 2b: Replace FormData Upload with XMLHttpRequest

**Problem with Current Implementation:**
- Uses FormData + fetch() which is unreliable in React Native
- Documented in SESSION_NOTES.md: "Standard fetch() does NOT work on file:// URIs"

**Solution:** Use proven XMLHttpRequest pattern from `src/lib/database.js:196-260`

**Current Code (BROKEN):**
```javascript
// src/lib/messages.js:48-126
const formData = new FormData();
formData.append('', {
  uri: imageUri,
  type: 'image/jpeg',
  name: fileName,
});

const uploadResponse = await fetch(uploadUrl, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'apikey': SUPABASE_ANON_KEY,
  },
  body: formData,
});
```

**Replacement Code (WORKING PATTERN):**
```javascript
// Import at top of file
import * as FileSystem from 'expo-file-system/legacy';

// Replace sendImageMessage() implementation
export async function sendImageMessage(senderId, recipientId, imageUri) {
  try {
    const matchId = getMatchId(senderId, recipientId);
    const fileName = `${matchId}_${Date.now()}.jpg`;

    console.log('Starting image upload for:', fileName);
    console.log('Image URI:', imageUri);

    // Step 1: Read image as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });

    // Step 2: Convert base64 to binary
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Step 3: Upload via XMLHttpRequest (not fetch!)
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/chat-images/${fileName}`;

    const uploadSuccess = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.timeout = 60000; // 60 second timeout

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          console.log('Upload successful');
          resolve(true);
        } else {
          console.error('Upload failed:', xhr.status, xhr.responseText);
          reject(new Error(`Upload failed: ${xhr.status} - ${xhr.responseText}`));
        }
      };

      xhr.onerror = () => {
        console.error('Upload network error');
        reject(new Error('Network error during upload'));
      };

      xhr.ontimeout = () => {
        console.error('Upload timeout');
        reject(new Error('Upload timeout'));
      };

      xhr.open('POST', uploadUrl);
      xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
      xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_ANON_KEY}`);
      xhr.setRequestHeader('Content-Type', 'image/jpeg');
      xhr.send(bytes.buffer);
    });

    // Step 4: Get public URL
    const { data: urlData } = supabase.storage
      .from('chat-images')
      .getPublicUrl(fileName);

    console.log('Public URL:', urlData.publicUrl);

    // Step 5: Create message record
    const { data, error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: senderId,
        recipient_id: recipientId,
        message_type: 'image',
        image_url: urlData.publicUrl,
      })
      .select()
      .single();

    if (error) {
      console.error('Message insert error:', error);
      throw error;
    }

    console.log('Message saved:', data);

    // Update match metadata
    await updateMatchMetadata(matchId, senderId, recipientId);

    return data;
  } catch (error) {
    console.error('Error sending image message:', error);
    throw error;
  }
}
```

**Key Differences:**
- ✅ Uses expo-file-system/legacy (SDK 54 compatible)
- ✅ Binary encoding via Uint8Array
- ✅ XMLHttpRequest instead of fetch()
- ✅ Proper timeout handling (60s)
- ✅ Better error logging
- ✅ Matches proven working pattern from selfies upload

## Technical Considerations

### SafeAreaView Migration
- **Risk:** Low - 10 files already successfully migrated
- **Testing:** Verify on both iOS (notched devices) and Android
- **Compatibility:** react-native-safe-area-context already in package.json
- **App.js already wrapped in SafeAreaProvider** ✅

### Image Upload Fix
- **Network Requirements:** Test on cellular data (corporate WiFi may block Supabase Storage)
- **Metro Cache:** May need `npx expo start --localhost --clear` after changes
- **File Size:** 5 MB limit enforced at bucket level
- **MIME Types:** Only image/* allowed (security best practice)

### Performance Impact
- **XMLHttpRequest:** More reliable than FormData, similar performance
- **Binary encoding:** Adds ~50ms overhead, acceptable for user-initiated uploads
- **Timeout:** 60 seconds gives adequate time for slow connections

## Acceptance Criteria

### Part 1: SafeAreaView Migration
- [x] All 13 files migrated to use react-native-safe-area-context
- [ ] No SafeAreaView deprecation warnings in console
- [ ] All migrated screens render correctly on iOS notched devices
- [ ] All migrated screens render correctly on Android
- [ ] No layout regressions (padding, spacing intact)

### Part 2: Image Upload Fix
- [x] chat-images bucket created in Supabase with public access
- [x] All 3 RLS policies configured (INSERT, SELECT, DELETE)
- [x] sendImageMessage() refactored to use XMLHttpRequest
- [x] expo-file-system/legacy imported correctly
- [x] Binary encoding working (no base64 string issues)
- [ ] Image uploads succeed from MessageInput.js
- [ ] Uploaded images display in chat bubbles
- [ ] Image URLs are publicly accessible
- [ ] Upload timeout handling works (network error scenarios)
- [ ] Optimistic UI updates work (sending indicator)
- [ ] Error messages display to user on upload failure

### Testing Checklist
- [ ] Test SafeAreaView on iPhone with notch (iOS 14+)
- [ ] Test SafeAreaView on Android (various screen sizes)
- [ ] Test image upload on cellular data (not corporate WiFi)
- [ ] Test image upload on slow connection (3G simulation)
- [ ] Test upload timeout handling (airplane mode mid-upload)
- [ ] Test image display in chat feed
- [ ] Test image full-screen modal
- [ ] Verify no console errors or warnings

## Implementation Plan

### Phase 1: SafeAreaView Migration (15 min)
1. Create MultiEdit script for batch migration
2. Update all 13 files with corrected import
3. Run app and verify no warnings
4. Test onboarding flow (most affected screens)
5. Commit: "fix: Complete SafeAreaView migration to react-native-safe-area-context"

### Phase 2: Storage Bucket Setup (5 min)
1. Log into Supabase Dashboard
2. Navigate to Storage
3. Create chat-images bucket with public access
4. Apply 3 RLS policies via SQL Editor
5. Verify bucket appears in storage list
6. Document completion in SUPABASE_SETUP.md

### Phase 3: Upload Method Refactor (20 min)
1. Add expo-file-system/legacy import to messages.js
2. Replace sendImageMessage() with XMLHttpRequest pattern
3. Copy binary encoding logic from database.js
4. Add timeout and error handling
5. Test upload with single image
6. Commit: "fix: Replace FormData with XMLHttpRequest for reliable chat image uploads"

### Phase 4: Integration Testing (15 min)
1. Clear Metro cache: `npx expo start --localhost --clear`
2. Test complete chat flow: Camera → Upload → Display
3. Test gallery flow: Gallery → Upload → Display
4. Test error handling: Airplane mode → Show error
5. Verify optimistic updates work
6. Verify no regressions in text/location messages

### Phase 5: Documentation (5 min)
1. Update CLAUDE.md completed features
2. Add troubleshooting notes to SESSION_NOTES.md
3. Document bucket setup in SUPABASE_SETUP.md
4. Update QUICKSTART.md if needed

**Total Estimated Time:** 60 minutes

## Success Metrics

- [ ] Zero SafeAreaView warnings in console
- [ ] 100% image upload success rate in testing (10+ uploads)
- [ ] No console errors during upload process
- [ ] Image display latency < 2 seconds on good connection
- [ ] Graceful error handling on network failures

## Dependencies & Risks

### Dependencies
- ✅ expo-file-system already in package.json
- ✅ react-native-safe-area-context already installed
- ✅ SafeAreaProvider already in App.js
- ✅ Supabase Storage API access working (selfies upload proves this)

### Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Binary encoding fails on Android | Low | High | Test on physical Android device |
| Corporate network blocks uploads | Medium | Low | Document cellular data requirement |
| Metro cache causes old code to run | High | Low | Clear cache before testing |
| RLS policies misconfigured | Low | High | Copy exact policies from selfies bucket |

### Rollback Plan
If image uploads still fail after migration:
1. Check Supabase Storage logs for detailed error
2. Verify bucket exists and is public
3. Test with curl/Postman to isolate app vs API issue
4. Fallback: Temporarily disable image upload feature

## References & Research

### Internal References

**Working Patterns:**
- SafeAreaView migration: `src/screens/UserProfileScreen.js:14`
- XMLHttpRequest upload: `src/lib/database.js:196-260`
- Binary encoding: `src/lib/database.js:224-228`
- Storage bucket config: `SUPABASE_SETUP.md` (selfies setup)

**Documented Learnings:**
- `SESSION_NOTES.md:508-514` - FormData unreliable in React Native
- `SESSION_NOTES.md:295-298` - Storage path gotchas
- `SESSION_NOTES.md:402-411` - Corporate network blocking
- `SESSION_NOTES.md:318-321` - Expo SDK 54 compatibility

**Configuration Files:**
- `app.json` - Expo configuration
- `package.json` - Dependencies list
- `.env` - Supabase credentials

### Files to Modify

1. **SafeAreaView Migration (13 files):**
   - src/screens/WelcomeScreen.js
   - src/screens/Setup1Screen.js
   - src/screens/Setup2Screen.js
   - src/screens/Setup3Screen.js
   - src/screens/CameraScreen.js
   - src/screens/BirthdayScreen.js
   - src/screens/BioScreen.js
   - src/screens/LookingForScreen.js
   - src/screens/HostOnboarding1Screen.js
   - src/screens/HostOnboarding2Screen.js
   - src/screens/HostOnboarding3Screen.js
   - src/screens/CreateEventScreen.js
   - src/screens/EventSuccessScreen.js

2. **Upload Fix (1 file):**
   - src/lib/messages.js (lines 48-126)

3. **Documentation (3 files):**
   - CLAUDE.md (status update)
   - SUPABASE_SETUP.md (bucket creation steps)
   - SESSION_NOTES.md (troubleshooting notes)

### External References

- [react-native-safe-area-context docs](https://github.com/th3rdwave/react-native-safe-area-context)
- [Expo FileSystem legacy API](https://docs.expo.dev/versions/latest/sdk/filesystem/)
- [Supabase Storage API](https://supabase.com/docs/reference/javascript/storage-from-upload)
- [XMLHttpRequest specification](https://xhr.spec.whatwg.org/)

## Notes

### Why XMLHttpRequest > FormData?

From documented learnings:
> "Standard fetch() does NOT work on file:// URIs in React Native. XMLHttpRequest is MORE RELIABLE than fetch() for binary uploads."

This is a known React Native limitation where the fetch() API doesn't properly handle local file URIs or binary data encoding. XMLHttpRequest with manual binary conversion is the proven workaround.

### Why Manual Bucket Creation?

Supabase Storage buckets cannot be created via SQL. They must be created through:
1. Supabase Dashboard UI (recommended for simplicity)
2. Supabase Management API (for automation)
3. Supabase CLI (for local development)

The SQL policies are applied AFTER bucket creation.

### Testing on Corporate Networks

If uploads fail during testing:
1. Switch to cellular data
2. Or test from home WiFi
3. Corporate networks often block Supabase Storage domains

This is documented in SESSION_NOTES.md based on actual development experience.
