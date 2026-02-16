---
title: Host Event Onboarding Carousel + Event Creation
type: feat
status: active
date: 2026-02-16
---

# Host Event Onboarding Carousel + Event Creation

## Overview

Add "Host with flick" onboarding carousel (3 steps) and event creation form to enable users to create and manage their own events. Users access this feature via the existing "Host An Event" button on WelcomeScreen.

## Problem Statement

Currently, the "Host An Event" button shows "Coming soon!" The festivals table exists but has no creation UI. Event hosts (wedding planners, festival organizers, etc.) need a self-service way to:
1. Understand the value proposition of hosting with flick
2. Create their event with custom details
3. Generate and access a unique QR code for their event
4. View event dashboard with real-time metrics

## Proposed Solution

**Navigation Flow:**
```
WelcomeScreen → "Host An Event" button
  ↓
HostOnboarding1Screen (carousel step 1/3)
  ↓ "Next"
HostOnboarding2Screen (carousel step 2/3)
  ↓ "Next"
HostOnboarding3Screen (carousel step 3/3)
  ↓ "Create an Event"
CreateEventScreen (form)
  ↓ Submit
EventSuccessScreen (shows QR code)
```

**Components to Build:**
1. **HostOnboarding1Screen** - First carousel step with value prop
2. **HostOnboarding2Screen** - Second carousel step
3. **HostOnboarding3Screen** - Third carousel step with CTA
4. **CreateEventScreen** - Event creation form
5. **EventSuccessScreen** - Shows generated QR code and event details

## Prerequisites

Before implementation:
1. **Database Schema:** Run `festivals-schema.sql` in Supabase SQL Editor (per CLAUDE.md "🔮 Next Up")
2. **Dependencies:** Install `react-native-qrcode-svg` if not already present
3. **Verify:** Check that `src/lib/festivals.js` exists and exports required functions

## Technical Approach

**Pattern Reference:** Follow existing Setup1/Setup2/Setup3Screen multi-step pattern:
- Use gradient background: `['#FF6B9D', '#C44CE0', '#7B5EE3']`
- Pass data via `route.params` (not global state)
- Show progress dots (3 dots, expand active one)
- Use `navigation.navigate()` between steps
- Use `navigation.replace()` after final submission

**Database:**
- Create records in existing `festivals` table (schema in `festivals-schema.sql`)
- Generate unique festival ID (UUID or slug)
- Store QR code URL in Supabase Storage (optional)

**QR Code:**
- Use `react-native-qrcode-svg` for client-side generation
- Encode festival ID or deep link URL
- Display immediately on success screen

**Files to Create:**
```
src/screens/HostOnboarding1Screen.js
src/screens/HostOnboarding2Screen.js
src/screens/HostOnboarding3Screen.js
src/screens/CreateEventScreen.js
src/screens/EventSuccessScreen.js
src/lib/events.js  (event creation functions)
```

**Files to Modify:**
```
App.js  (add new screens to stack navigator)
src/screens/WelcomeScreen.js  (update handleHostEvent)
```

## Acceptance Criteria

### Carousel Screens (Steps 1-3)
- [x] All 3 screens use consistent gradient background
- [x] Progress dots display correctly (1/3, 2/3, 3/3 active states)
- [x] "Next" button navigates to next step
- [x] Step 3 shows "Create an Event" button (not "Next")
- [ ] Back navigation returns to previous step (not WelcomeScreen)
- [x] Content matches design reference image

### Create Event Form
- [x] Form fields: Event name (required), Start date (required), End date (required), Sponsor name (optional)
- [x] Date pickers use platform-native UI
- [x] Validation: Name 3+ chars, End date > Start date, Start date >= today
- [x] Submit button disabled until form is valid
- [x] Loading state shows ActivityIndicator during submission
- [x] Form uses KeyboardAvoidingView + ScrollView

### Event Creation (Backend)
- [x] Creates record in `festivals` table with unique ID
- [x] Generates UUID or slug-based festival ID
- [x] Stores event data: name, start_date, end_date, sponsor_name
- [x] Error handling for network failures (show retry option)
- [x] Prevents duplicate submissions with loading guard

### Success Screen
- [x] Displays large QR code encoding festival ID
- [x] Shows event name and date range
- [x] "Download QR" button saves image to device
- [x] "Done" button navigates back to WelcomeScreen
- [x] Uses same gradient background as carousel

### Integration
- [x] "Host An Event" button navigates to HostOnboarding1Screen
- [ ] Generated QR codes work with existing QRScannerScreen
- [ ] Events appear in festivals table and can be joined by attendees 

## Edge Cases to Handle

**From SpecFlow Analysis:**
1. **Back Navigation:** User can go back to previous carousel step (not exit entirely)
2. **Network Failure:** Show error alert with "Retry" button, preserve form data
3. **Duplicate Event Name:** Allow duplicates (disambiguate by unique ID)
4. **Form Exit:** Clearing form data on exit (no draft saving in MVP)
5. **Loading State:** Disable submit button and show spinner to prevent double-submission

## Design Decisions

**Authentication:** No auth required for MVP - any user can create events anonymously

**Post-Creation Flow:** Navigate to EventSuccessScreen showing QR code and event details. "Done" button returns to WelcomeScreen.

**QR Storage:** Client-side generation only. QR codes are not uploaded to Supabase Storage.

**Returning Hosts:** Show carousel every time the "Host An Event" button is pressed (no state tracking in MVP).

**Multi-Event Hosting:** Users can create unlimited events. No account/ownership system in MVP.

**Event Dashboard:** Not in MVP scope. Only success screen with QR code.

## Context

**Existing Patterns:**
- Multi-step flow: `/Users/michaellevinger/dev/testing/src/screens/Setup1Screen.js` (lines 1-140)
- Form validation: `/Users/michaellevinger/dev/testing/src/screens/Setup2Screen.js` (lines 24-36)
- Gradient background: `/Users/michaellevinger/dev/testing/src/screens/WelcomeScreen.js` (lines 29-34)
- Database operations: `/Users/michaellevinger/dev/testing/src/lib/festivals.js`

**Database Schema:**
```sql
-- festivals table (from festivals-schema.sql)
CREATE TABLE festivals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sponsor_name TEXT,
  sponsor_logo_url TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## MVP Scope

**In Scope:**
- 3-step carousel onboarding
- Event creation form with validation
- QR code generation (client-side)
- Success screen showing QR code
- Basic error handling

**Out of Scope (Future):**
- Event dashboard with analytics
- Event editing after creation
- Event deletion UI
- Multi-event management screen
- QR code persistence to Supabase Storage
- Email confirmation with QR code
- Sponsor logo upload
- Event capacity limits

## References

- Design mockup: Screenshot provided showing "Host with flick" carousel step 1
- Related issue: CLAUDE.md section "🔮 Next Up" mentions festivals schema
- Database schema: `/Users/michaellevinger/dev/testing/festivals-schema.sql`
- Similar patterns: Setup1/2/3Screen.js for multi-step flow
- QR Scanner: `/Users/michaellevinger/dev/testing/src/screens/QRScannerScreen.js`
