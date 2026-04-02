# Backlog — Bugs and Missing Features

Tracked issues and planned work.

Updated: 2026-04-02

---

## Bugs

- [x] **Phone number exchange doesn't require recipient to have a phone number** — Fixed: requesting stores 'pending' for recipient's phone. When accepting, user is guided to profile to add phone number first. `updateExchangePhone` helper fills in the real number before accepting.
- [x] **App restart loses event session** — Fixed: festival_id key mismatch in updateUser, now persists correctly and AppNavigator routes to Dashboard on relaunch.
- [x] **EventSuccessScreen buttons hidden behind Android nav bar** — Fixed: use useSafeAreaInsets for bottom padding, share buttons side-by-side in one row.


## Missing Features (Push Notifications)

- [ ] **iOS push notifications** — Requires Apple Developer account ($99/yr), APNs key upload to EAS, TestFlight setup. Android is working.
## Missing Features (General)

- [x] **Join event via deep link (no QR scan)** — Share an event link via WhatsApp/SMS/etc. that opens the app and joins the event directly, instead of requiring a QR code scan every time.
- [x] **Google Sign-In for hosts** — Web + Android OAuth clients created, Supabase configured. Needs testing in preview build.
- [ ] **App Store / Play Store submission** — Production builds, store listings, screenshots, review process.

## Cleanup

- [ ] **Dead files (~60MB)** — See `docs/CLEANUP-CANDIDATES.md` for the full list. Review with team before deleting.

---

## Done

### Bugs (Resolved)
- [x] **Notification icon shows as purple square** — Fixed: created monochrome `assets/notification-icon.png` and updated `app.json`.
- [x] **Real-time messages not appearing in chat** — Fixed: added `messages` table to Supabase Realtime publication + 3s polling fallback.
- [x] **"Already Flicked" error on fast double-tap** — Fixed: silently ignore duplicate flick during card transition.
- [x] **Phone icon always shows "Request" modal** — Fixed: checks exchange state first (accepted → Vault, pending from them → accept/decline, pending from me → waiting).
- [x] **System message buttons not working** — Fixed: check `metadata.type === 'exchange_request'` instead of `metadata.buttons`.
- [x] **VaultScreen crash on missing route params** — Fixed: route params now optional with DB fallback for other user's name.
- [x] **Unmatch doesn't clear data history** — Already handled: `unmatchUser()` deletes messages, exchanges, flicks, and match record.

### Features (Shipped)
- [x] **Notification settings not wired to backend** — Fixed.
- [x] **Notification grouping** — Fixed: Edge Function sets `threadId` per match.
- [x] **In-app notification suppression** — Fixed: suppress banner when user is already on the relevant screen.
- [x] **Preview build (shareable APK)** — Done: `eas build --profile preview --platform android`.
- [x] **Age range filter on radar** — Added: onboarding step after "Looking For", editable from Profile, client-side filtering in radar.
- [x] **Reorder onboarding: profile before QR scan** — Done: new users create profile first, then scan QR. Returning users go straight to QR scanner.
- [x] **Ladies-first number exchange rule** — Males can't request a female's number until she messages or requests first. Shared `canRequestExchange` utility in matchUtils.js.
- [x] **Exchange request preview in matches tab** — System messages show "You asked for X's number" / "X asked for your number" instead of raw content.
- [x] **Deep link event joining** — Shareable URLs (`helloflick.com/join/EVENT_ID`) open the app and auto-join events. New users complete onboarding first, then join. QR codes now encode full URLs for native camera scanning.
- [x] **Host an Event access from onboarding** — "Host an Event" link on NameScreen + `flick://host` deep link, so hosts can skip attendee onboarding.
- [x] **Share Link button on EventSuccessScreen** — Share event join URL alongside QR code image.
